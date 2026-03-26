import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getApiBaseUrl } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

function Icon({ type }) {
  const commonProps = { className: "navIcon", viewBox: "0 0 24 24" };
  if (type === "dashboard") {
    return (
      <svg {...commonProps} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 13h7V4H4v9zM13 20h7V11h-7v9zM13 4h7v5h-7V4zM4 20h7v-5H4v5z" />
      </svg>
    );
  }
  if (type === "upload") {
    return (
      <svg {...commonProps} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 16V4m0 0 4 4m-4-4-4 4" />
        <path d="M4 20h16" />
      </svg>
    );
  }
  if (type === "queue") {
    return (
      <svg {...commonProps} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 6h13M8 12h13M8 18h13" />
        <path d="M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    );
  }
  return null;
}

function BrandLogoMark() {
  return (
    <span className="brandMark" aria-hidden="true">
      <svg
        width="38"
        height="38"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient
            id="kaviaMarkGradient"
            x1="10"
            y1="10"
            x2="40"
            y2="40"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#3b82f6" />
            <stop offset="1" stopColor="#06b6d4" />
          </linearGradient>
          <radialGradient
            id="kaviaMarkGlow"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(16 14) rotate(45) scale(26 26)"
          >
            <stop stopColor="white" stopOpacity="0.35" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Rounded square base */}
        <rect
          x="6"
          y="6"
          width="36"
          height="36"
          rx="12"
          fill="url(#kaviaMarkGradient)"
        />
        <rect
          x="6"
          y="6"
          width="36"
          height="36"
          rx="12"
          fill="url(#kaviaMarkGlow)"
        />

        {/* Abstract "shield + check" motif for fraud/risk */}
        <path
          d="M24 14c5.6 0 10 2.1 10 2.1v8.7c0 8.1-5.5 13.2-10 15.1-4.5-1.9-10-7-10-15.1v-8.7S18.4 14 24 14Z"
          fill="rgba(7,11,22,0.22)"
          stroke="rgba(255,255,255,0.38)"
          strokeWidth="1.2"
        />
        <path
          d="M19.5 25.2l3 3.2 6-6.4"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

// PUBLIC_INTERFACE
export default function AppLayout({ children }) {
  /**
   * Application shell with sidebar navigation.
   * Wraps page content and provides a consistent layout.
   */
  const baseUrl = getApiBaseUrl();
  const apiHint = baseUrl ? baseUrl : "same-origin";

  const { session, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="appShell">
      <aside className="sidebar" aria-label="Primary">
        <div className="brand">
          <BrandLogoMark />
          <div className="brandLockup">
            <div className="brandNameRow">
              <span className="brandName">Claim Risk Analyzer</span>
            </div>
            <div className="brandTagline">Fraud Detection</div>
          </div>
        </div>

        <nav className="nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `navItem ${isActive ? "navItemActive" : ""}`
            }
          >
            <Icon type="dashboard" />
            Dashboard
          </NavLink>
          <NavLink
            to="/upload"
            className={({ isActive }) =>
              `navItem ${isActive ? "navItemActive" : ""}`
            }
          >
            <Icon type="upload" />
            Upload CSV
          </NavLink>
          <NavLink
            to="/queue"
            className={({ isActive }) =>
              `navItem ${isActive ? "navItemActive" : ""}`
            }
          >
            <Icon type="queue" />
            Claim Queue
          </NavLink>
        </nav>

        <div className="sidebarFooter">
          <div>
            <strong>Signed in:</strong>{" "}
            {session?.email
              ? String(session.email)
              : session?.username
                ? String(session.username)
                : "—"}
          </div>

          <div style={{ marginTop: 8 }}>
            <div>
              <strong>API:</strong> {apiHint}
            </div>
            <div style={{ marginTop: 6 }}>
              <span>
                Tip: set <code>REACT_APP_API_BASE_URL</code> for local dev.
              </span>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <button
              className="btn"
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
              style={{ width: "100%" }}
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="container">{children}</div>
      </main>
    </div>
  );
}
