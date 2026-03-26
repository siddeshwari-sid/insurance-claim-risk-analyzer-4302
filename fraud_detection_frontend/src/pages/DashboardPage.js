import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import { getClaims } from "../api/client";
import { formatMoney, formatNumber, riskBadgeClass } from "../utils/format";

/**
 * Dashboard showing KPIs, risk distribution, and a high-risk preview.
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

  const riskPieData = useMemo(
    () => [
      { name: "High", value: metrics.high, color: "#ef4444" },
      { name: "Medium", value: metrics.medium, color: "#f59e0b" },
      { name: "Low", value: metrics.low, color: "#22c55e" },
    ],
    [metrics.high, metrics.medium, metrics.low]
  );

  const incidentBarData = useMemo(() => {
    const counts = new Map();
    for (const c of claims) {
      const key = c?.incident_type ? String(c.incident_type) : "Unknown";
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const arr = Array.from(counts.entries()).map(([incident, count]) => ({
      incident,
      count,
    }));
    arr.sort((a, b) => b.count - a.count);
    return arr.slice(0, 10);
  }, [claims]);

  const highRiskPreview = useMemo(() => {
    return claims
      .filter((c) => c?.riskLevel === "High")
      .slice()
      .sort((a, b) => (b?.riskScore || 0) - (a?.riskScore || 0))
      .slice(0, 8);
  }, [claims]);

  return (
    <>
      <div className="PageHeader">
        <div>
          <h1 className="PageTitle">Dashboard</h1>
          <p className="Muted">
            Risk distribution, totals, and top high-risk claims from the latest
            upload(s).
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="Button ButtonPrimary" to="/upload">
            Upload new CSV
          </Link>
          <Link className="Button" to="/queue">
            View queue
          </Link>
        </div>
      </div>

      {loadError ? (
        <div className="Alert AlertError" role="alert">
          <div className="AlertTitle">Failed to load dashboard</div>
          <div>{loadError}</div>
          <div className="AlertHint">
            Ensure the backend is running and accessible. The backend must expose{" "}
            <code>GET /api/claims</code>.
          </div>
        </div>
      ) : null}

      <section className="KpiGrid" aria-label="Key risk metrics">
        <div className="Kpi">
          <div className="KpiLabel">Total Claims</div>
          <div className="KpiValue">{loading ? "—" : formatNumber(metrics.total)}</div>
        </div>

        <div className="Kpi KpiHigh">
          <div className="KpiLabel">High Risk</div>
          <div className="KpiValue">{loading ? "—" : formatNumber(metrics.high)}</div>
        </div>

        <div className="Kpi KpiMed">
          <div className="KpiLabel">Medium Risk</div>
          <div className="KpiValue">{loading ? "—" : formatNumber(metrics.medium)}</div>
        </div>

        <div className="Kpi KpiLow">
          <div className="KpiLabel">Low Risk</div>
          <div className="KpiValue">{loading ? "—" : formatNumber(metrics.low)}</div>
        </div>
      </section>

      <section className="Row" aria-label="Dashboard charts">
        <div className="Card">
          <div className="CardHeader">
            <h2>Incident types (top 10)</h2>
            <div className="Muted">{loading ? "Loading…" : `${claims.length} total`}</div>
          </div>

          <div className="ChartWrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incidentBarData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="incident" interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="Card">
          <div className="CardHeader">
            <h2>Risk distribution</h2>
            <div className="Muted">
              Total amount: {loading ? "—" : formatMoney(metrics.totalAmount)}
            </div>
          </div>

          <div className="ChartWrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip />
                <Pie
                  data={riskPieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {riskPieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="Card" aria-label="High-risk preview">
        <div className="CardHeader">
          <h2>High-risk claims</h2>
          <div className="Muted">
            Showing top {highRiskPreview.length} by risk score
          </div>
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
                    No high-risk claims yet. Upload a CSV to generate scoring.
                  </td>
                </tr>
              ) : (
                highRiskPreview.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/claims/${encodeURIComponent(c.id)}`}>{c.id}</Link>
                    </td>
                    <td>
                      <span className={riskBadgeClass(c.riskLevel)}>{c.riskLevel}</span>
                    </td>
                    <td>{Number.isFinite(c.riskScore) ? c.riskScore : "—"}</td>
                    <td>{formatMoney(c.claim_amount)}</td>
                    <td>{c.incident_type ?? "—"}</td>
                    <td>
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
    </>
  );
}
