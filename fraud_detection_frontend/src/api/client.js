/**
 * Minimal fetch wrapper for the Fraud Detection backend REST API.
 *
 * Endpoints (per work item):
 * - POST /api/claims/upload
 * - GET  /api/claims
 * - GET  /api/claims/:id
 */

// PUBLIC_INTERFACE
export function getApiBaseUrl() {
  /**
   * Returns the backend base URL.
   *
   * Uses REACT_APP_API_BASE_URL if provided, otherwise defaults to same-origin.
   * In local dev, you likely want: REACT_APP_API_BASE_URL=http://localhost:3001
   */
  return (process.env.REACT_APP_API_BASE_URL || "").replace(/\/$/, "");
}

async function parseJsonOrText(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  return response.text();
}

// PUBLIC_INTERFACE
export async function apiRequest(path, options = {}) {
  /**
   * Executes an HTTP request against the backend API and throws helpful errors.
   */
  const base = getApiBaseUrl();
  const url = `${base}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await parseJsonOrText(res).catch(() => "");
    const message =
      typeof body === "string"
        ? body || `Request failed: ${res.status}`
        : body?.error || body?.message || `Request failed: ${res.status}`;
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
   * Backend (current) supports:
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
