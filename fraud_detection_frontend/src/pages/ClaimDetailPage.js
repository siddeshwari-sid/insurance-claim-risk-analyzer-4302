import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getClaimById } from "../api/client";
import { formatMoney, formatNumber, riskBadgeClass } from "../utils/format";

/**
 * Claim detail page: shows all fields and explanations for a claim.
 */
export default function ClaimDetailPage() {
  const { id } = useParams();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setLoadError("");
      setClaim(null);

      try {
        const data = await getClaimById(id, { signal: controller.signal });
        setClaim(data?.claim || null);
      } catch (e) {
        setLoadError(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    }

    if (id) load();
    return () => controller.abort();
  }, [id]);

  const explanations = useMemo(() => {
    return Array.isArray(claim?.explanations) ? claim.explanations : [];
  }, [claim]);

  return (
    <>
      <div className="PageHeader">
        <div>
          <h1 className="PageTitle">Claim Detail</h1>
          <p className="Muted">
            Claim ID: <code>{id}</code>
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="Button" to="/queue">
            Back to queue
          </Link>
          <Link className="Button" to="/dashboard">
            Dashboard
          </Link>
        </div>
      </div>

      {loadError ? (
        <div className="Alert AlertError" role="alert">
          <div className="AlertTitle">Failed to load claim</div>
          <div>{loadError}</div>
        </div>
      ) : null}

      <section className="Card" aria-label="Claim summary">
        <div className="CardHeader">
          <h2>Summary</h2>
          <div className="Muted">{loading ? "Loading…" : "Scored by backend rules"}</div>
        </div>

        {loading ? (
          <div className="TableEmpty">Loading…</div>
        ) : !claim ? (
          <div className="TableEmpty">Claim not found.</div>
        ) : (
          <>
            <div className="MetaGrid">
              <div className="MetaItem">
                <div className="MetaLabel">Risk level</div>
                <div className="MetaValue">
                  <span className={riskBadgeClass(claim.riskLevel)}>{claim.riskLevel}</span>
                </div>
              </div>
              <div className="MetaItem">
                <div className="MetaLabel">Risk score</div>
                <div className="MetaValue">
                  {Number.isFinite(claim.riskScore) ? claim.riskScore : "—"}
                </div>
              </div>
              <div className="MetaItem">
                <div className="MetaLabel">Claim amount</div>
                <div className="MetaValue">{formatMoney(claim.claim_amount)}</div>
              </div>
            </div>

            <div className="MetaGrid" style={{ marginTop: 10 }}>
              <div className="MetaItem">
                <div className="MetaLabel">Incident</div>
                <div className="MetaValue">{claim.incident_type ?? "—"}</div>
              </div>
              <div className="MetaItem">
                <div className="MetaLabel">Days since incident</div>
                <div className="MetaValue">{formatNumber(claim.days_since_incident)}</div>
              </div>
              <div className="MetaItem">
                <div className="MetaLabel">Prior claims</div>
                <div className="MetaValue">{formatNumber(claim.prior_claims_count)}</div>
              </div>
            </div>

            <div className="MetaGrid" style={{ marginTop: 10 }}>
              <div className="MetaItem">
                <div className="MetaLabel">Policy tenure (months)</div>
                <div className="MetaValue">{formatNumber(claim.policy_tenure_months)}</div>
              </div>
              <div className="MetaItem" style={{ gridColumn: "span 2" }}>
                <div className="MetaLabel">Description</div>
                <div className="MetaValue">{claim.description ?? "—"}</div>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="Card" aria-label="Explanations">
        <div className="CardHeader">
          <h2>Explanations</h2>
          <div className="Muted">
            {loading ? "—" : explanations.length ? `${explanations.length} signal(s)` : "No signals"}
          </div>
        </div>

        {loading ? (
          <div className="TableEmpty">Loading…</div>
        ) : !claim ? (
          <div className="TableEmpty">—</div>
        ) : explanations.length === 0 ? (
          <div className="TableEmpty">No explanations returned for this claim.</div>
        ) : (
          <ol className="ReasonList">
            {explanations.map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
