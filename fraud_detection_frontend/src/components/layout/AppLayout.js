import React from "react";
import { NavLink } from "react-router-dom";
import { getApiBaseUrl } from "../../api/client";

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

// PUBLIC_INTERFACE
export default function AppLayout({ children }) {
  /**
   * Application shell with sidebar navigation.
   * Wraps page content and provides a consistent layout.
   */
  const baseUrl = getApiBaseUrl();
  const apiHint = baseUrl ? baseUrl : "same-origin";

  return (
    <div className="appShell">
      <aside className="sidebar" aria-label="Primary">
        <div className="brand">
          <div className="brandMark" aria-hidden="true" />
          <div className="brandTitle">
            <strong>Claim Risk Analyzer</strong>
            <span>Fraud Detection</span>
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
            <strong>API:</strong> {apiHint}
          </div>
          <div style={{ marginTop: 6 }}>
            <span>
              Tip: set <code>REACT_APP_API_BASE_URL</code> for local dev.
            </span>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="container">{children}</div>
      </main>
    </div>
  );
}
