/**
 * API client helpers for the fraud detection backend.
 *
 * Env:
 * - REACT_APP_API_BASE (preferred) or REACT_APP_BACKEND_URL
 *   Example: http://localhost:3001
 */

// PUBLIC_INTERFACE
export function getApiBase() {
  /** Get the configured API base URL. */
  return (
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_BACKEND_URL ||
    "http://localhost:3001"
  );
}

function normalizeBase(base) {
  return String(base || "").replace(/\/+$/, "");
}

// PUBLIC_INTERFACE
export async function getClaims({ signal } = {}) {
  /** Fetch all claims. Returns { claims: Claim[] }. */
  const base = normalizeBase(getApiBase());
  const res = await fetch(`${base}/api/claims`, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `GET /api/claims failed: ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`
    );
  }

  return res.json();
}

// PUBLIC_INTERFACE
export async function getClaimById(id, { signal } = {}) {
  /** Fetch a single claim by id. Returns { claim: Claim }. */
  const base = normalizeBase(getApiBase());
  const res = await fetch(`${base}/api/claims/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 404) throw new Error("Claim not found");
    throw new Error(
      `GET /api/claims/${id} failed: ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`
    );
  }

  return res.json();
}

// PUBLIC_INTERFACE
export async function uploadClaimsCsv(csvText) {
  /**
   * Upload claims CSV text to the backend for scoring.
   * Returns { claims: Claim[], warnings: {row:number, errors:string[]}[] }
   */
  const base = normalizeBase(getApiBase());
  const res = await fetch(`${base}/api/claims/upload`, {
    method: "POST",
    headers: { "Content-Type": "text/csv", Accept: "application/json" },
    body: csvText,
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ignore; will error below
  }

  if (!res.ok) {
    const errMsg =
      json?.error ||
      (typeof json?.details === "string" ? json.details : "") ||
      text ||
      `${res.status} ${res.statusText}`;
    throw new Error(`Upload failed: ${errMsg}`);
  }

  return json || { claims: [], warnings: [] };
}
