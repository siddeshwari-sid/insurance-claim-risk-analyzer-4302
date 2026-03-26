const AUTH_STORAGE_KEY = "fraud_detection_auth_v1";

/**
 * This project uses simple client-side authentication for demo purposes.
 * The "session" is stored in localStorage.
 */

// PUBLIC_INTERFACE
export function getStoredAuth() {
  /**
   * Read the current auth session from localStorage.
   * @returns {{ email: string, loginAt: string } | null}
   */
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // Backward compatibility: previously stored sessions used { username }.
    const email = parsed?.email ?? parsed?.username;

    if (!email || typeof email !== "string") return null;

    return { ...parsed, email: String(email) };
  } catch {
    return null;
  }
}

// PUBLIC_INTERFACE
export function isAuthenticated() {
  /**
   * Returns true if the user is currently authenticated.
   */
  return Boolean(getStoredAuth());
}

const DEFAULT_EMAIL = "admin";
const DEFAULT_PASSWORD = "admin";

// PUBLIC_INTERFACE
export function loginWithCredentials(email, password) {
  /**
   * "Authenticates" the user client-side.
   * In a real app this would call a backend auth endpoint.
   *
   * This demo app requires default credentials:
   *   email: admin
   *   password: admin
   *
   * Note: despite the UI calling this an "email", we keep the demo credential
   * as "admin" to preserve the existing default behavior.
   *
   * @param {string} email
   * @param {string} password
   * @returns {{ email: string, loginAt: string }}
   */
  const e = String(email || "").trim();
  const p = String(password || "");

  if (!e) {
    throw new Error("Email is required.");
  }
  if (!p) {
    throw new Error("Password is required.");
  }

  // Enforce default credentials for this demo.
  // Keep the error explicit and user-friendly.
  if (e !== DEFAULT_EMAIL || p !== DEFAULT_PASSWORD) {
    throw new Error("Incorrect email or password. Try admin / admin.");
  }

  const session = { email: e, loginAt: new Date().toISOString() };
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  return session;
}

// PUBLIC_INTERFACE
export function logout() {
  /**
   * Clears the auth session.
   */
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
