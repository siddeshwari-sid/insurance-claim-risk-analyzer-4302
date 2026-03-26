import React, { useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import ErrorBanner from "../components/ui/ErrorBanner";
import { useAuth } from "../auth/AuthContext";

function safePathname(value) {
  if (!value) return null;
  const s = String(value);
  if (!s.startsWith("/")) return null;
  if (s.startsWith("/login")) return "/dashboard";
  return s;
}

// PUBLIC_INTERFACE
export default function LoginPage() {
  /**
   * Login screen for simple client-side auth.
   * After login, navigates to the originally requested page (if any) or /dashboard.
   */
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = useMemo(() => {
    const from = location.state?.from?.pathname;
    return safePathname(from) || "/dashboard";
  }, [location.state]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  function onChangeUsername(next) {
    setUsername(next);
    // Clear stale error as user edits
    if (error) setError(null);
  }

  function onChangePassword(next) {
    setPassword(next);
    // Clear stale error as user edits
    if (error) setError(null);
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      setBusy(true);
      setError(null);
      login(username, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "calc(100vh - 56px)", display: "grid", placeItems: "center" }}>
      <div className="card" style={{ width: "min(520px, 100%)" }}>
        <div className="cardPad">
          <div style={{ marginBottom: 10 }}>
            <h1 style={{ margin: 0, fontSize: 20, letterSpacing: "-0.02em" }}>Sign in</h1>
            <p style={{ margin: "6px 0 0 0", color: "var(--muted)", fontSize: 13 }}>
              Enter your username and password to access the dashboard.
            </p>
          </div>

          <ErrorBanner error={error} title="Login failed" />

          <form onSubmit={onSubmit} style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <div>
              <label htmlFor="username" style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>
                Username
              </label>
              <input
                id="username"
                className="input"
                autoComplete="username"
                value={username}
                onChange={(e) => onChangeUsername(e.target.value)}
                placeholder="admin"
                disabled={busy}
              />
            </div>

            <div>
              <label htmlFor="password" style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>
                Password
              </label>
              <input
                id="password"
                className="input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => onChangePassword(e.target.value)}
                placeholder="admin"
                disabled={busy}
              />
            </div>

            <div className="btnRow" style={{ marginTop: 6, justifyContent: "flex-end" }}>
              <button className="btn btnPrimary" type="submit" disabled={busy}>
                {busy ? "Signing in…" : "Sign in"}
              </button>
            </div>

            <div className="smallHelp">
              Demo credentials: <code>admin</code> / <code>admin</code>. Authentication is client-side only and stored in your browser localStorage.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
