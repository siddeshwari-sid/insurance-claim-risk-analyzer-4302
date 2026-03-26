import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getClaims } from "../api/client";
import { formatMoney, formatNumber } from "../utils/format";
import { Card } from "../components/ui/Card";
import { StatusPill } from "../components/ui/StatusPill";

/**
 * Claim Queue page: matches screenshot with
 * - top action buttons
 * - 3 summary cards
 * - table in a card with header strip
 */
export default function QueuePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const risk = searchParams.get("risk") || "All";
  const q = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "score_desc";

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
    return { total, high, medium, low };
  }, [claims]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return claims.filter((c) => {
      if (risk !== "All" && c?.riskLevel !== risk) return false;
      if (!term) return true;

      const hay = [
        c?.id,
        c?.incident_type,
        c?.description,
        ...(Array.isArray(c?.explanations) ? c.explanations : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(term);
    });
  }, [claims, q, risk]);

  const sorted = useMemo(() => {
    const arr = filtered.slice();
    if (sort === "score_asc") {
      arr.sort((a, b) => (a?.riskScore || 0) - (b?.riskScore || 0));
    } else if (sort === "amount_desc") {
      arr.sort((a, b) => Number(b?.claim_amount || 0) - Number(a?.claim_amount || 0));
    } else {
      // score_desc default
      arr.sort((a, b) => (b?.riskScore || 0) - (a?.riskScore || 0));
    }
    return arr;
  }, [filtered, sort]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "All") next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  }

  return (
    <>
      <div className="PageHeader">
        <div>
          <h1 className="PageTitle">Claim Queue</h1>
          <p className="Muted">
            Review scored claims. Filter and open a claim for full detail.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="Button" to="/dashboard">
            Dashboard
          </Link>
          <Link className="Button ButtonPrimary" to="/upload">
            Upload
          </Link>
        </div>
      </div>

      {loadError ? (
        <div className="Alert AlertError" role="alert">
          <div className="AlertTitle">Failed to load queue</div>
          <div>{loadError}</div>
        </div>
      ) : null}

      <div className="Grid3" aria-label="Queue summary">
        <Card title="Total" right={<span className="Muted">Claims</span>}>
          <div className="StatValue">{loading ? "—" : formatNumber(metrics.total)}</div>
          <div className="Muted">Across all uploads</div>
        </Card>
        <Card title="High Risk" right={<StatusPill level="High" />}>
          <div className="StatValue">{loading ? "—" : formatNumber(metrics.high)}</div>
          <div className="Muted">Needs review</div>
        </Card>
        <Card title="Medium/Low" right={<span className="Muted">Combined</span>}>
          <div className="StatValue">
            {loading ? "—" : formatNumber(metrics.medium + metrics.low)}
          </div>
          <div className="Muted">Monitor</div>
        </Card>
      </div>

      <Card
        title="Claims"
        right={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              className="Input"
              style={{ width: 240 }}
              value={q}
              onChange={(e) => updateParam("q", e.target.value)}
              placeholder="Search…"
              aria-label="Search claims"
            />
            <select
              className="Select"
              style={{ width: 140 }}
              value={risk}
              onChange={(e) => updateParam("risk", e.target.value)}
              aria-label="Filter by risk"
            >
              <option value="All">All</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select
              className="Select"
              style={{ width: 190 }}
              value={sort}
              onChange={(e) => updateParam("sort", e.target.value)}
              aria-label="Sort claims"
            >
              <option value="score_desc">Risk score (high → low)</option>
              <option value="score_asc">Risk score (low → high)</option>
              <option value="amount_desc">Claim amount (high → low)</option>
            </select>
          </div>
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
                <th className="Truncate">Description</th>
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
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="TableEmpty">
                    No claims match your filters. Try uploading a CSV first.
                  </td>
                </tr>
              ) : (
                sorted.map((c) => (
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
                    <td
                      className="Truncate"
                      title={c.description ? String(c.description) : ""}
                      style={{ maxWidth: 420 }}
                    >
                      {c.description ? String(c.description) : "—"}
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
    </>
  );
}
