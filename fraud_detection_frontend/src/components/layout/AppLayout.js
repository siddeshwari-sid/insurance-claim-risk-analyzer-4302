import React, { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { getApiBase } from "../../api/client";

/**
 * Sidebar + content shell for the application.
 * Matches the dark "glass" UI in the provided screenshots.
 */
export default function AppLayout({ children }) {
  const apiBase = useMemo(() => getApiBase(), []);
  const location = useLocation();

  // Some platforms probe a healthcheck path; keep a tiny response if configured.
  const healthcheckPath = process.env.REACT_APP_HEALTHCHECK_PATH || "/healthz";
  const isHealthz =
    typeof window !== "undefined" && location.pathname === healthcheckPath;

  if (isHealthz) {
    return (
      <div className="Content">
        <div className="Container">
          <h1 className="PageTitle">ok</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="AppShell">
      <aside className="Sidebar" aria-label="Primary navigation">
        <div className="Brand">
          <div className="BrandMark" aria-hidden="true" />
          <div className="BrandText">
            <div className="BrandTitle">Risk Analyzer</div>
            <div className="BrandSub">Insurance claim scoring</div>
          </div>
        </div>

        <nav className="Nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `NavItem ${isActive ? "NavItemActive" : ""}`
            }
          >
            <span className="NavIcon" aria-hidden="true">
              D
            </span>
            Dashboard
          </NavLink>

          <NavLink
            to="/upload"
            className={({ isActive }) =>
              `NavItem ${isActive ? "NavItemActive" : ""}`
            }
          >
            <span className="NavIcon" aria-hidden="true">
              U
            </span>
            Upload
          </NavLink>

          <NavLink
            to="/queue"
            className={({ isActive }) =>
              `NavItem ${isActive ? "NavItemActive" : ""}`
            }
          >
            <span className="NavIcon" aria-hidden="true">
              Q
            </span>
            Claim Queue
          </NavLink>
        </nav>

        <div className="SidebarFooter">
          <div className="Truncate" title={apiBase}>
            API: <code>{apiBase}</code>
          </div>
        </div>
      </aside>

      <div className="Content">
        <div className="Container">
          {/* provide a convenient docs link as a subtle "icon button" in the content area */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <a
              className="Button ButtonIcon"
              href={`${String(apiBase).replace(/\/+$/, "")}/docs`}
              target="_blank"
              rel="noreferrer"
              aria-label="Open API Docs"
              title="Open API Docs"
            >
              ?
            </a>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
