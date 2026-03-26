import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getClaims } from "../api/client";
import { formatMoney, formatNumber } from "../utils/format";
import { Card } from "../components/ui/Card";
import { StatusPill } from "../components/ui/StatusPill";

/**
 * Dashboard showing compact cards similar to screenshot:
 * - Overview (totals)
 * - Risk split summary
 * - Recent high-risk claims preview
 * - Rules/explanations preview
 */
export default function DashboardPage() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const data = await getClaims({ signal: controller.signal });
        setClaims(Array.isArray(data?.claims) ? data.claims : []);
      } catch (e) {
        setClaims([]);
        setLoadError(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const metrics = useMemo(() => {
    const total = claims.length;
    const high = claims.filter((c) => c?.riskLevel === "High").length;
    const medium = claims.filter((c) => c?.riskLevel === "Medium").length;
    const low = claims.filter((c) => c?.riskLevel === "Low").length;

    const totalAmount = claims.reduce((acc, c) => {
      const v = Number(c?.claim_amount);
      return acc + (Number.isFinite(v) ? v : 0);
    }, 0);

    return { total, high, medium, low, totalAmount };
  }, [claims]);

  const topHigh = useMemo(() => {
    return claims
      .filter((c) => c?.riskLevel === "High")
      .slice()
      .sort((a, b) => (b?.riskScore || 0) - (a?.riskScore || 0))
      .slice(0, 6);
  }, [claims]);

  const topReasons = useMemo(() => {
    const bag = new Map();
    for (const c of claims) {
      const expl = Array.isArray(c?.explanations) ? c.explanations : [];
      for (const r of expl.slice(0, 2)) {
        const key = String(r || "").trim();
        if (!key) continue;
        bag.set(key, (bag.get(key) || 0) + 1);
      }
    }
    const arr = Array.from(bag.entries()).map(([reason, count]) => ({
      reason,
      count,
    }));
    arr.sort((a, b) => b.count - a.count);
    return arr.slice(0, 6);
  }, [claims]);

  return (
    <>
      <div className="PageHeader">
        <div>
          <h1 className="PageTitle">Dashboard</h1>
          <p className="Muted">
            Overview of recent uploads and risk signals.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="Button" to="/queue">
            View Queue
          </Link>
          <Link className="Button ButtonPrimary" to="/upload">
            Upload
          </Link>
        </div>
      </div>

      {loadError ? (
        <div className="Alert AlertError" role="alert">
          <div className="AlertTitle">Failed to load dashboard</div>
          <div>{loadError}</div>
          <div className="AlertHint">
            Ensure the backend exposes <code>GET /api/claims</code>.
          </div>
        </div>
      ) : null}

      <div className="Grid2" aria-label="Dashboard cards">
        <Card
          title="Overview"
          right={<span className="Muted">{loading ? "Loading…" : "Latest"}</span>}
        >
          <div className="Grid2" style={{ gap: 10 }}>
            <div>
              <div className="StatLabel">Total Claims</div>
              <div className="StatValue">{loading ? "—" : formatNumber(metrics.total)}</div>
            </div>
            <div>
              <div className="StatLabel">Total Amount</div>
              <div className="StatValue">{loading ? "—" : formatMoney(metrics.totalAmount)}</div>
            </div>
          </div>

          <div style={{ height: 1, background: "var(--divider)", margin: "12px 0" }} />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span className="Pill PillHigh">
              <span className="Dot" aria-hidden="true" />
              High: {loading ? "—" : formatNumber(metrics.high)}
            </span>
            <span className="Pill PillMedium">
              <span className="Dot" aria-hidden="true" />
              Medium: {loading ? "—" : formatNumber(metrics.medium)}
            </span>
            <span className="Pill PillLow">
              <span className="Dot" aria-hidden="true" />
              Low: {loading ? "—" : formatNumber(metrics.low)}
            </span>
          </div>
        </Card>

        <Card title="Top Signals" right={<span className="Muted">Most frequent</span>}>
          {loading ? (
            <div className="TableEmpty">Loading…</div>
          ) : topReasons.length === 0 ? (
            <div className="TableEmpty">No explanations yet. Upload a CSV.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {topReasons.map((r) => (
                <div key={r.reason}>
                  <div className="StatLabel Truncate" title={r.reason}>
                    {r.reason}
                  </div>
                  <div className="Muted" style={{ marginTop: 4 }}>
                    {formatNumber(r.count)} occurrence(s)
                  </div>
                  <div style={{ height: 1, background: "var(--divider)", marginTop: 10 }} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <div style={{ gridColumn: "span 2" }}>
          <Card
            title="High-risk Claims"
            right={
              <span className="Muted">
                {loading ? "Loading…" : `${topHigh.length} shown`}
              </span>
            }
          >
            <div className="TableWrap">
              <table className="Table">
                <thead>
                  <tr>
                    <th>Risk</th>
                    <th>ID</th>
                    <th>Score</th>
                    <th>Amount</th>
                    <th>Incident</th>
                    <th className="Truncate">Top reason</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="TableEmpty">
                        Loading…
                      </td>
                    </tr>
                  ) : topHigh.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="TableEmpty">
                        No high-risk claims yet. Upload a CSV to generate scoring.
                      </td>
                    </tr>
                  ) : (
                    topHigh.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <StatusPill level={c.riskLevel} />
                        </td>
                        <td className="Truncate" title={c.id}>
                          {c.id}
                        </td>
                        <td>{Number.isFinite(c.riskScore) ? c.riskScore : "—"}</td>
                        <td>{formatMoney(c.claim_amount)}</td>
                        <td className="Truncate" title={c.incident_type ?? ""}>
                          {c.incident_type ?? "—"}
                        </td>
                        <td className="Truncate" title={(c.explanations && c.explanations[0]) || ""}>
                          {Array.isArray(c.explanations) && c.explanations.length
                            ? c.explanations[0]
                            : "—"}
                        </td>
                        <td style={{ width: 1, whiteSpace: "nowrap" }}>
                          <Link className="Button" to={`/claims/${encodeURIComponent(c.id)}`}>
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
