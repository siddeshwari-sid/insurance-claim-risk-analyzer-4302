import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listClaims } from "../api/client";
import Badge from "../components/ui/Badge";
import ErrorBanner from "../components/ui/ErrorBanner";
import Loading from "../components/ui/Loading";
import { formatCurrency, normalizeRisk, sanitizeExplanations } from "../utils/format";

function extractBasics(claim) {
  const id = claim?.id || claim?.claimId || claim?.claim_id;
  const risk = claim?.riskLevel || claim?.risk || claim?.risk_level;

  // Backend canonical field is claimantName.
  const claimant =
    claim?.claimantName ||
    claim?.claimant ||
    claim?.name ||
    claim?.insuredName ||
    claim?.insured_name;

  const amountRaw = claim?.claimAmount ?? claim?.amount ?? claim?.claim_amount;
  const amount = amountRaw;

  const date = claim?.dateOfLoss || claim?.lossDate || claim?.date || claim?.loss_date;
  return { id, risk, claimant, amount, date };
}

// PUBLIC_INTERFACE
export default function QueuePage() {
  /** Queue view: list, filter by risk, quick search. */
  const [claims, setClaims] = useState(null);
  const [riskFilter, setRiskFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [error, setError] = useState(null);

  async function refresh() {
    try {
      setError(null);
      const data = await listClaims();
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = claims || [];

    return list.filter((c) => {
      const { id, claimant, risk, amount, date } = extractBasics(c);
      const r = normalizeRisk(risk);
      if (riskFilter !== "All" && r !== riskFilter) return false;

      if (!q) return true;
      const haystack = [
        id,
        claimant,
        r,
        amount,
        date,
        ...(Array.isArray(c?.explanations) ? c.explanations : []),
      ]
        .filter(Boolean)
        .map(String)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [claims, query, riskFilter]);

  const counts = useMemo(() => {
    const list = claims || [];
    const c = { High: 0, Medium: 0, Low: 0, Unknown: 0 };
    for (const item of list) {
      const r = normalizeRisk(item?.riskLevel || item?.risk);
      if (c[r] === undefined) c.Unknown += 1;
      else c[r] += 1;
    }
    return c;
  }, [claims]);

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>Claim Queue</h1>
          <p>Review and triage scored claims. Filter by risk and open details.</p>
        </div>
        <div className="btnRow">
          <button className="btn" onClick={refresh}>
            Refresh
          </button>
          <Link className="btn btnPrimary" to="/upload">
            Upload more
          </Link>
        </div>
      </div>

      <ErrorBanner error={error} title="Failed to load queue" />

      {claims === null ? (
        <Loading label="Loading queue…" />
      ) : (
        <>
          <div className="grid gridCols3" style={{ marginBottom: 14 }}>
            <div className="card cardPad">
              <p className="kpiTitle">High</p>
              <p className="kpiValue">{counts.High}</p>
              <div className="kpiSub">Immediate review</div>
            </div>
            <div className="card cardPad">
              <p className="kpiTitle">Medium</p>
              <p className="kpiValue">{counts.Medium}</p>
              <div className="kpiSub">Needs follow-up</div>
            </div>
            <div className="card cardPad">
              <p className="kpiTitle">Low</p>
              <p className="kpiValue">{counts.Low}</p>
              <div className="kpiSub">Standard handling</div>
            </div>
          </div>

          <div className="card cardPad" style={{ marginBottom: 14 }}>
            <div className="grid gridCols2">
              <div>
                <label style={{ display: "block", fontWeight: 700, marginBottom: 8 }}>
                  Risk filter
                </label>
                <select
                  className="select"
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                >
                  <option value="All">All risks</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <div className="smallHelp">Filter the queue by assigned risk level.</div>
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 700, marginBottom: 8 }}>
                  Search
                </label>
                <input
                  className="input"
                  placeholder="Search by claim id, claimant, amount, explanations…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <div className="smallHelp">Search is client-side on the current queue results.</div>
              </div>
            </div>
          </div>

          <div className="tableWrap">
            <table className="table" aria-label="Claims queue">
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Risk</th>
                  <th>Claimant</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Explanations</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ color: "var(--muted)" }}>
                      No claims match the current filter/search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const { id, risk, claimant, amount, date } = extractBasics(c);
                    const explanations = sanitizeExplanations(
                      c?.explanations ||
                        c?.reasons ||
                        c?.reasonCodes ||
                        c?.explanation ||
                        []
                    );
                    const explanationText = Array.isArray(explanations)
                      ? explanations.join("; ")
                      : String(explanations);

                    return (
                      <tr key={String(id)}>
                        <td>{String(id)}</td>
                        <td>
                          <Badge risk={risk} score={c?.riskScore ?? c?.score} />
                        </td>
                        <td>{claimant ? String(claimant) : "—"}</td>
                        <td>{formatCurrency(amount)}</td>
                        <td>{date ? String(date) : "—"}</td>
                        <td
                          style={{
                            maxWidth: 420,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={explanationText}
                        >
                          {explanationText || "—"}
                        </td>
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

          <div className="smallHelp" style={{ marginTop: 10 }}>
            Showing {filtered.length} / {(claims || []).length} claims.
          </div>
        </>
      )}
    </>
  );
}
