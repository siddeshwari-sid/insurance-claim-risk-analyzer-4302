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

// PUBLIC_INTERFACE
export async function uploadClaimsCsv(file) {
  /**
   * Upload a CSV file with claim information.
   * Backend is expected to accept multipart/form-data.
   */
  const formData = new FormData();
  // Common field name is "file"; backend should be implemented accordingly.
  formData.append("file", file);

  return apiRequest("/api/claims/upload", {
    method: "POST",
    body: formData,
  });
}
