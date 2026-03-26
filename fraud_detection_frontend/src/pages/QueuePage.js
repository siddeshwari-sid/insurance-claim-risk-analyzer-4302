import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getClaims } from "../api/client";
import { formatMoney, riskBadgeClass } from "../utils/format";

/**
 * Queue page: a sortable, filterable list of all claims.
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
            Filter by risk, search by ID/incident/description, then open a claim for details.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="Button" to="/dashboard">
            Back to dashboard
          </Link>
          <Link className="Button ButtonPrimary" to="/upload">
            Upload CSV
          </Link>
        </div>
      </div>

      {loadError ? (
        <div className="Alert AlertError" role="alert">
          <div className="AlertTitle">Failed to load queue</div>
          <div>{loadError}</div>
        </div>
      ) : null}

      <section className="Card" aria-label="Queue filters">
        <div className="CardHeader">
          <h2>Filters</h2>
          <div className="Muted">{loading ? "Loading…" : `${sorted.length} shown`}</div>
        </div>

        <div className="FormRow">
          <div className="Row" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <label>
              <div className="Muted" style={{ marginBottom: 6 }}>
                Search
              </div>
              <input
                className="Input"
                value={q}
                onChange={(e) => updateParam("q", e.target.value)}
                placeholder="e.g., C-1001, Collision, suspicious..."
              />
            </label>

            <label>
              <div className="Muted" style={{ marginBottom: 6 }}>
                Risk
              </div>
              <select
                className="Input"
                value={risk}
                onChange={(e) => updateParam("risk", e.target.value)}
              >
                <option value="All">All</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>
          </div>

          <label>
            <div className="Muted" style={{ marginBottom: 6 }}>
              Sort
            </div>
            <select
              className="Input"
              value={sort}
              onChange={(e) => updateParam("sort", e.target.value)}
            >
              <option value="score_desc">Risk score (high → low)</option>
              <option value="score_asc">Risk score (low → high)</option>
              <option value="amount_desc">Claim amount (high → low)</option>
            </select>
          </label>
        </div>
      </section>

      <section className="Card" aria-label="Queue table">
        <div className="CardHeader">
          <h2>Claims</h2>
          <div className="Muted">Click a claim ID to view details</div>
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
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="TableEmpty">
                    Loading…
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="TableEmpty">
                    No claims match your filters. Try uploading a CSV first.
                  </td>
                </tr>
              ) : (
                sorted.map((c) => (
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
                    <td style={{ color: "#334155" }}>
                      {c.description ? String(c.description).slice(0, 120) : "—"}
                      {c.description && String(c.description).length > 120 ? "…" : ""}
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
