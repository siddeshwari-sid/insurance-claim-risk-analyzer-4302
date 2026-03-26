import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

/**
 * Dashboard app: fetches claims from the backend and renders summary + a high-risk preview.
 *
 * Env:
 * - REACT_APP_API_BASE (preferred) or REACT_APP_BACKEND_URL
 *   Example: http://localhost:3001
 */
function App() {
  const healthcheckPath = process.env.REACT_APP_HEALTHCHECK_PATH || "/healthz";
  const apiBase =
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_BACKEND_URL ||
    "http://localhost:3001";

  const isHealthz =
    typeof window !== "undefined" && window.location.pathname === healthcheckPath;

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError("");

      try {
        const res = await fetch(`${apiBase.replace(/\/+$/, "")}/api/claims`, {
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          const bodyText = await res.text();
          throw new Error(
            `Request failed: ${res.status} ${res.statusText}${
              bodyText ? ` — ${bodyText}` : ""
            }`
          );
        }

        const data = await res.json();
        const list = Array.isArray(data?.claims) ? data.claims : [];

        if (!cancelled) setClaims(list);
      } catch (e) {
        if (!cancelled) {
          setClaims([]);
          setLoadError(
            `Unable to load claims from API (${apiBase}). ${String(
              e?.message || e
            )}`
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  const metrics = useMemo(() => {
    const total = claims.length;
    const high = claims.filter((c) => c?.riskLevel === "High").length;
    const medium = claims.filter((c) => c?.riskLevel === "Medium").length;
    const low = claims.filter((c) => c?.riskLevel === "Low").length;
    return { total, high, medium, low };
  }, [claims]);

  const highRiskPreview = useMemo(() => {
    return claims
      .filter((c) => c?.riskLevel === "High")
      .slice()
      .sort((a, b) => (b?.riskScore || 0) - (a?.riskScore || 0))
      .slice(0, 8);
  }, [claims]);

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
        <div className="HeaderRow">
          <div>
            <h1>Insurance Claim Risk Analyzer</h1>
            <p className="Muted">
              Backend API: <code>{apiBase}</code>
            </p>
          </div>

          <a
            className="Button"
            href={`${apiBase.replace(/\/+$/, "")}/docs`}
            target="_blank"
            rel="noreferrer"
          >
            Open API Docs
          </a>
        </div>
      </header>

      <main className="Main">
        {loadError ? (
          <div className="Alert AlertError" role="alert">
            <div className="AlertTitle">Dashboard failed to load</div>
            <div className="AlertBody">{loadError}</div>
            <div className="AlertHint">
              Make sure the backend is running and CORS allows this origin. The
              backend should expose <code>GET /api/claims</code> on{" "}
              <code>{apiBase}</code>.
            </div>
          </div>
        ) : null}

        <section className="KpiGrid" aria-label="Key risk metrics">
          <div className="KpiCard">
            <div className="KpiLabel">Total Claims</div>
            <div className="KpiValue">{loading ? "—" : metrics.total}</div>
          </div>

          <div className="KpiCard KpiHigh">
            <div className="KpiLabel">High Risk</div>
            <div className="KpiValue">{loading ? "—" : metrics.high}</div>
          </div>

          <div className="KpiCard KpiMed">
            <div className="KpiLabel">Medium Risk</div>
            <div className="KpiValue">{loading ? "—" : metrics.medium}</div>
          </div>

          <div className="KpiCard KpiLow">
            <div className="KpiLabel">Low Risk</div>
            <div className="KpiValue">{loading ? "—" : metrics.low}</div>
          </div>
        </section>

        <section className="Panel" aria-label="High-risk preview">
          <div className="PanelHeader">
            <h2>High-risk claims</h2>
            <p className="Muted">
              Showing top {highRiskPreview.length} by risk score
            </p>
          </div>

          <div className="TableWrap">
            <table className="Table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Risk</th>
                  <th>Score</th>
                  <th>Amount</th>
                  <th>Incident</th>
                  <th>Top reason</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="TableEmpty">
                      Loading…
                    </td>
                  </tr>
                ) : highRiskPreview.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="TableEmpty">
                      No high-risk claims found. Upload a CSV to generate claim
                      scoring.
                    </td>
                  </tr>
                ) : (
                  highRiskPreview.map((c) => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td>
                        <span className="Badge BadgeHigh">{c.riskLevel}</span>
                      </td>
                      <td>{Number.isFinite(c.riskScore) ? c.riskScore : "—"}</td>
                      <td>{c.claim_amount ?? "—"}</td>
                      <td>{c.incident_type ?? "—"}</td>
                      <td className="ReasonCell">
                        {Array.isArray(c.explanations) && c.explanations.length
                          ? c.explanations[0]
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="Panel" aria-label="How to populate dashboard">
          <div className="PanelHeader">
            <h2>Populate data</h2>
            <p className="Muted">
              This demo stores claims in-memory on the backend (resets on
              restart).
            </p>
          </div>

          <ol className="Muted">
            <li>
              Upload claims via <code>POST /api/claims/upload</code> (CSV text or
              JSON <code>{"{ csv: \"...\" }"}</code>).
            </li>
            <li>
              Refresh this page to see live totals and high-risk preview.
            </li>
          </ol>
        </section>
      </main>
    </div>
  );
}

export default App;
