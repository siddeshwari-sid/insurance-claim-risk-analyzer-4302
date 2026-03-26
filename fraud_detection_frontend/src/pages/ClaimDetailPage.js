import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getClaimById } from "../api/client";
import { formatMoney, formatNumber } from "../utils/format";
import { Card } from "../components/ui/Card";
import { StatusPill } from "../components/ui/StatusPill";

/**
 * Claim detail page styled to match the same dark card system.
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
            Queue
          </Link>
          <Link className="Button ButtonPrimary" to="/upload">
            Upload
          </Link>
        </div>
      </div>

      {loadError ? (
        <div className="Alert AlertError" role="alert">
          <div className="AlertTitle">Failed to load claim</div>
          <div>{loadError}</div>
        </div>
      ) : null}

      <div className="Grid2" aria-label="Claim detail content">
        <Card
          title="Summary"
          right={<span className="Muted">{loading ? "Loading…" : "Scored"}</span>}
        >
          {loading ? (
            <div className="TableEmpty">Loading…</div>
          ) : !claim ? (
            <div className="TableEmpty">Claim not found.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              <div className="Grid2">
                <div>
                  <div className="StatLabel">Risk</div>
                  <div style={{ marginTop: 8 }}>
                    <StatusPill level={claim.riskLevel} />
                  </div>
                </div>
                <div>
                  <div className="StatLabel">Risk Score</div>
                  <div className="StatValue">
                    {Number.isFinite(claim.riskScore) ? claim.riskScore : "—"}
                  </div>
                </div>
              </div>

              <div style={{ height: 1, background: "var(--divider)" }} />

              <div className="Grid2">
                <div>
                  <div className="StatLabel">Claim Amount</div>
                  <div className="StatValue">{formatMoney(claim.claim_amount)}</div>
                </div>
                <div>
                  <div className="StatLabel">Incident Type</div>
                  <div className="StatValue" style={{ fontSize: 14 }}>
                    {claim.incident_type ?? "—"}
                  </div>
                </div>
              </div>

              <div className="Grid2">
                <div>
                  <div className="StatLabel">Days Since Incident</div>
                  <div className="StatValue" style={{ fontSize: 14 }}>
                    {formatNumber(claim.days_since_incident)}
                  </div>
                </div>
                <div>
                  <div className="StatLabel">Prior Claims</div>
                  <div className="StatValue" style={{ fontSize: 14 }}>
                    {formatNumber(claim.prior_claims_count)}
                  </div>
                </div>
              </div>

              <div className="Grid2">
                <div style={{ gridColumn: "span 2" }}>
                  <div className="StatLabel">Description</div>
                  <div style={{ marginTop: 8, color: "var(--text-secondary)" }}>
                    {claim.description ?? "—"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        <div style={{ display: "grid", gap: 12 }}>
          <Card
            title="Signals"
            right={
              <span className="Muted">
                {loading ? "—" : explanations.length ? `${explanations.length}` : "0"}
              </span>
            }
          >
            {loading ? (
              <div className="TableEmpty">Loading…</div>
            ) : !claim ? (
              <div className="TableEmpty">—</div>
            ) : explanations.length === 0 ? (
              <div className="TableEmpty">No explanations returned for this claim.</div>
            ) : (
              <ol style={{ margin: 0, paddingLeft: 16, color: "var(--text-secondary)" }}>
                {explanations.map((r, idx) => (
                  <li key={idx} style={{ marginBottom: 8 }}>
                    {r}
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card title="Policy & History" right={<span className="Muted">Metadata</span>}>
            {loading ? (
              <div className="TableEmpty">Loading…</div>
            ) : !claim ? (
              <div className="TableEmpty">—</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                <div>
                  <div className="StatLabel">Policy Tenure (months)</div>
                  <div className="StatValue" style={{ fontSize: 14 }}>
                    {formatNumber(claim.policy_tenure_months)}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
