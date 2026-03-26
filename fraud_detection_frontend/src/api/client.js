/**
 * Minimal fetch wrapper for the Fraud Detection backend REST API.
 *
 * Endpoints:
 * - POST /api/claims/upload
 * - GET  /api/claims
 * - GET  /api/claims/:id
 *
 * This module includes a runtime backend discovery handshake to make preview
 * deployments reliable even when build-time env vars are not injected.
 */

let cachedDiscoveredBaseUrl = null;
let discoveryPromise = null;

function stripTrailingSlash(url) {
  return String(url || "").replace(/\/+$/, "");
}

function computeBackendOriginCandidate() {
  /**
   * Best-effort candidate for where the backend *should* be in Kavia preview:
   * same hostname as the frontend, but port 3001.
   *
   * This is used only to call GET /api/config to fetch the authoritative
   * backend base URL.
   */
  if (typeof window === "undefined" || !window?.location?.origin) return null;
  try {
    const u = new URL(window.location.origin);
    u.port = "3001";
    return stripTrailingSlash(u.toString());
  } catch {
    return null;
  }
}

async function discoverApiBaseUrl() {
  /**
   * Discover backend base URL at runtime.
   *
   * Why: In preview, REACT_APP_* env vars may be missing, and relative URLs can
   * accidentally hit the frontend dev server (port 3000), producing:
   *   "Cannot POST /api/claims/upload"
   *
   * Strategy:
   * 1) Call GET {candidateBackendOrigin}/api/config
   * 2) Cache returned apiBaseUrl and use it for all subsequent requests
   * 3) If discovery fails, fall back to the previous heuristic (port 3001) or
   *    same-origin as last resort.
   */
  if (cachedDiscoveredBaseUrl) return cachedDiscoveredBaseUrl;

  if (discoveryPromise) return discoveryPromise;

  discoveryPromise = (async () => {
    const candidate = computeBackendOriginCandidate();
    if (!candidate) return null;

    try {
      const res = await fetch(`${candidate}/api/config`, { method: "GET" });
      if (!res.ok) return null;
      const data = await res.json().catch(() => null);

      const apiBaseUrl = stripTrailingSlash(data?.apiBaseUrl || "");
      if (!apiBaseUrl) return null;

      cachedDiscoveredBaseUrl = apiBaseUrl;
      return cachedDiscoveredBaseUrl;
    } catch {
      return null;
    } finally {
      // Clear inflight promise so a later retry is possible if needed.
      discoveryPromise = null;
    }
  })();

  return discoveryPromise;
}

// PUBLIC_INTERFACE
export function getApiBaseUrl() {
  /**
   * Returns the backend base URL (no trailing slash).
   *
   * Configure one of (preferred):
   * - REACT_APP_API_BASE
   * - REACT_APP_BACKEND_URL
   *
   * If not present, this function returns "" and apiRequest() will
   * attempt runtime discovery (async) before falling back.
   */
  const raw =
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_BACKEND_URL ||
    process.env.REACT_APP_API_BASE_URL ||
    "";

  const trimmed = String(raw).trim();

  if (trimmed) {
    // Common copy/paste mistake: pointing at Swagger docs URL.
    const withoutDocs = trimmed.replace(/\/docs\/?$/i, "");
    return stripTrailingSlash(withoutDocs);
  }

  // If discovery already ran, use it synchronously.
  if (cachedDiscoveredBaseUrl) return cachedDiscoveredBaseUrl;

  // Otherwise, don't guess here; apiRequest() will attempt discovery.
  return "";
}

function looksLikeHtml(text) {
  return /^\s*<!doctype html/i.test(text) || /<html[\s>]/i.test(text);
}

async function parseJsonOrText(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  return response.text();
}

async function resolveBaseUrlForRequest() {
  // 1) Prefer env-configured base URL.
  const envBase = getApiBaseUrl();
  if (envBase) return envBase;

  // 2) Try runtime discovery handshake.
  const discovered = await discoverApiBaseUrl();
  if (discovered) return discovered;

  // 3) Heuristic fallback: port 3001 on same hostname.
  const candidate = computeBackendOriginCandidate();
  if (candidate) return candidate;

  // 4) Last resort: same-origin (reverse proxy deployments).
  return "";
}

// PUBLIC_INTERFACE
export async function apiRequest(path, options = {}) {
  /**
   * Executes an HTTP request against the backend API and throws helpful errors.
   */
  const base = await resolveBaseUrlForRequest();
  const url = `${base}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await parseJsonOrText(res).catch(() => "");
    const baseNow = getApiBaseUrl() || cachedDiscoveredBaseUrl || "";

    let message =
      typeof body === "string"
        ? body || `Request failed: ${res.status}`
        : body?.error || body?.message || `Request failed: ${res.status}`;

    // If we accidentally hit a frontend/dev server route, Express/CRA often returns HTML.
    if (typeof body === "string" && looksLikeHtml(body)) {
      message =
        `Request failed (HTTP ${res.status}). ` +
        `The server returned HTML instead of JSON. ` +
        `This usually means the request did not reach the backend API. ` +
        `Resolved base: "${baseNow || "(empty)"}".`;
    }

    // Also handle plain "Cannot POST /api/..." without HTML wrapper.
    if (typeof message === "string" && /cannot\s+post\s+/i.test(message)) {
      message =
        `Request failed (HTTP ${res.status}): ${message.trim()}. ` +
        `Resolved base: "${baseNow || "(empty)"}".`;
    }

    const error = new Error(message);
    error.status = res.status;
    error.body = body;
    throw error;
  }

  return parseJsonOrText(res);
}

// PUBLIC_INTERFACE
export async function listClaims() {
  /** Fetch all claims from the queue. */
  return apiRequest("/api/claims", { method: "GET" });
}

// PUBLIC_INTERFACE
export async function getClaim(id) {
  /** Fetch a single claim by id. */
  return apiRequest(`/api/claims/${encodeURIComponent(id)}`, { method: "GET" });
}

function supportsMultipartUpload() {
  // CRA convention: any non-empty string enables the feature.
  // This keeps compatibility if the backend later switches to multipart/form-data.
  return String(process.env.REACT_APP_API_UPLOAD_MULTIPART || "").trim() === "true";
}

async function fileToText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsText(file);
  });
}

// PUBLIC_INTERFACE
export async function uploadClaimsCsv(file) {
  /**
   * Upload a CSV file with claim information.
   *
   * Backend supports:
   *  - Content-Type: text/csv with raw CSV as request body
   *  - Content-Type: application/json with {"csv": "..."}
   *
   * If REACT_APP_API_UPLOAD_MULTIPART=true, will send multipart/form-data with field "file"
   * for compatibility with alternative backends.
   */
  if (!file) {
    throw new Error("No file selected.");
  }

  if (supportsMultipartUpload()) {
    const formData = new FormData();
    formData.append("file", file);

    return apiRequest("/api/claims/upload", {
      method: "POST",
      body: formData,
    });
  }

  // Prefer raw CSV body to match backend OpenAPI spec exactly.
  const csvText = await fileToText(file);

  return apiRequest("/api/claims/upload", {
    method: "POST",
    headers: {
      "Content-Type": "text/csv",
    },
    body: csvText,
  });
}
