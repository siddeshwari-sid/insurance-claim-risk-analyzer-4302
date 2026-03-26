const AUTH_STORAGE_KEY = "fraud_detection_auth_v1";

/**
 * This project uses simple client-side authentication for demo purposes.
 * The "session" is stored in localStorage.
 */

// PUBLIC_INTERFACE
export function getStoredAuth() {
  /**
   * Read the current auth session from localStorage.
   * @returns {{ username: string, loginAt: string } | null}
   */
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.username !== "string") return null;
    return parsed;
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

// PUBLIC_INTERFACE
export function loginWithCredentials(username, password) {
  /**
   * "Authenticates" the user client-side.
   * In a real app this would call a backend auth endpoint.
   *
   * @param {string} username
   * @param {string} password
   * @returns {{ username: string, loginAt: string }}
   */
  const u = String(username || "").trim();
  const p = String(password || "");

  if (!u) {
    throw new Error("Username is required.");
  }
  if (!p) {
    throw new Error("Password is required.");
  }

  const session = { username: u, loginAt: new Date().toISOString() };
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
