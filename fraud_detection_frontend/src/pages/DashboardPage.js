import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listClaims } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import Badge from "../components/ui/Badge";
import ErrorBanner from "../components/ui/ErrorBanner";
import Loading from "../components/ui/Loading";
import { normalizeRisk, safeNumber } from "../utils/format";

function countByRisk(claims) {
  const counts = { High: 0, Medium: 0, Low: 0, Unknown: 0 };
  for (const c of claims) {
    const r = normalizeRisk(c?.riskLevel || c?.risk || c?.risk_level);
    if (counts[r] === undefined) counts.Unknown += 1;
    else counts[r] += 1;
  }
  return counts;
}

// PUBLIC_INTERFACE
export default function DashboardPage() {
  /** Dashboard view: KPIs + high-risk preview. */
  const [claims, setClaims] = useState(null);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  async function refresh() {
    try {
      setError(null);
      const data = await listClaims();
      // Backend may return {claims:[...]} or plain [...]
      const list = Array.isArray(data) ? data : data?.claims || [];
      setClaims(list);
    } catch (e) {
      setError(e);
      setClaims([]);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const stats = useMemo(() => countByRisk(claims || []), [claims]);

  const highRisk = useMemo(() => {
    const list = (claims || []).filter((c) => normalizeRisk(c?.riskLevel || c?.risk) === "High");
    // Keep most recent first if an uploadedAt exists; otherwise stable.
    return list.slice(0, 8);
  }, [claims]);

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>Dashboard</h1>
          <p>At-a-glance risk distribution of recently uploaded claims.</p>
        </div>
        <div className="btnRow">
          {!isAuthenticated ? (
            <button className="btn" onClick={() => navigate("/login")}>
              Login
            </button>
          ) : (
            <button
              className="btn"
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
            >
              Logout
            </button>
          )}

          <button className="btn" onClick={refresh}>
            Refresh
          </button>
          <Link className="btn btnPrimary" to="/upload">
            Upload CSV
          </Link>
        </div>
      </div>

      <ErrorBanner error={error} title="Failed to load claims" />

      {claims === null ? (
        <Loading label="Loading claims…" />
      ) : (
        <>
          <div className="grid gridCols3" style={{ marginBottom: 14 }}>
            <div className="card cardPad">
              <p className="kpiTitle">Total claims</p>
              <p className="kpiValue">{safeNumber(claims.length)}</p>
              <div className="kpiSub">In-memory queue (current session)</div>
            </div>
            <div className="card cardPad">
              <p className="kpiTitle">High risk</p>
              <p className="kpiValue">{safeNumber(stats.High)}</p>
              <div className="kpiSub">Requires immediate review</div>
            </div>
            <div className="card cardPad">
              <p className="kpiTitle">Medium + Low</p>
              <p className="kpiValue">
                {safeNumber(stats.Medium + stats.Low)}
              </p>
              <div className="kpiSub">Monitor / standard handling</div>
            </div>
          </div>

          <div className="card">
            <div className="cardPad" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <strong>High-risk preview</strong>
                <div className="smallHelp">Click a claim to review its details and explanations.</div>
              </div>
              <Link className="btn" to="/queue">
                Open queue
              </Link>
            </div>

            <div className="tableWrap">
              <table className="table" aria-label="High risk claims preview">
                <thead>
                  <tr>
                    <th>Claim ID</th>
                    <th>Risk</th>
                    <th>Claimant</th>
                    <th>Amount</th>
                    <th>Reason (summary)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {highRisk.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ color: "var(--muted)" }}>
                        No high-risk claims currently in the queue.
                      </td>
                    </tr>
                  ) : (
                    highRisk.map((c) => {
                      const id = c?.id || c?.claimId || c?.claim_id;
                      const claimant = c?.claimant || c?.claimantName || c?.name || "—";
                      const amount = c?.amount || c?.claimAmount || c?.claim_amount || "—";
                      const reasons = c?.explanations || c?.reasonCodes || c?.reasons || c?.explanation;
                      const summary = Array.isArray(reasons)
                        ? reasons[0]
                        : typeof reasons === "string"
                          ? reasons
                          : "—";

                      return (
                        <tr key={String(id)}>
                          <td>{String(id)}</td>
                          <td>
                            <Badge risk={c?.riskLevel || c?.risk} />
                          </td>
                          <td>{String(claimant)}</td>
                          <td>{String(amount)}</td>
                          <td title={summary}>{String(summary)}</td>
                          <td>
                            <Link className="btn" to={`/claims/${encodeURIComponent(id)}`}>
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
