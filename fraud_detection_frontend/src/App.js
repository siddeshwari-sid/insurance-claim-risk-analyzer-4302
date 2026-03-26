import React from "react";
import "./App.css";

/**
 * Minimal shell app to ensure the React preview starts successfully.
 * This will be expanded by future tasks into the full dashboard/uploader UI.
 */
function App() {
  const healthcheckPath = process.env.REACT_APP_HEALTHCHECK_PATH || "/healthz";
  const apiBase = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || "";

  // Simple client-side "healthz" view:
  // CRA dev server itself indicates readiness; this is just a visible indicator.
  const isHealthz = typeof window !== "undefined" && window.location.pathname === healthcheckPath;

  if (isHealthz) {
    return (
      <div className="App">
        <h1>ok</h1>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="AppHeader">
        <h1>Insurance Claim Risk Analyzer</h1>
        <p className="Muted">
          Frontend preview is running. Backend API base: <code>{apiBase || "(not set)"}</code>
        </p>
        <p className="Muted">
          Tip: open <code>{healthcheckPath}</code> for a simple health response.
        </p>
      </header>
    </div>
  );
}

export default App;
