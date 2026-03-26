import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getClaim } from "../api/client";
import Badge from "../components/ui/Badge";
import ErrorBanner from "../components/ui/ErrorBanner";
import Loading from "../components/ui/Loading";

function getExplanations(claim) {
  const exp = claim?.explanations || claim?.reasons || claim?.reasonCodes || claim?.explanation;
  if (!exp) return [];
  if (Array.isArray(exp)) return exp.map(String);
  return [String(exp)];
}

// PUBLIC_INTERFACE
export default function ClaimDetailPage() {
  /** Claim detail view: fetch claim by id and display its risk and explanations. */
  const { id } = useParams();
  const [claim, setClaim] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setError(null);
      setClaim(null);
      const data = await getClaim(id);
      // Backend may return {claim:{...}} or plain object
      const obj = data?.claim ? data.claim : data;
      setClaim(obj);
    } catch (e) {
      setError(e);
      setClaim({});
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const explanations = useMemo(() => getExplanations(claim || {}), [claim]);

  const basic = useMemo(() => {
    if (!claim) return {};
    return {
      claimId: claim?.id || claim?.claimId || claim?.claim_id || id,
      risk: claim?.riskLevel || claim?.risk || claim?.risk_level,
      claimant: claim?.claimant || claim?.claimantName || claim?.name,
      amount: claim?.amount || claim?.claimAmount || claim?.claim_amount,
      date: claim?.dateOfLoss || claim?.lossDate || claim?.date || claim?.loss_date,
      policy: claim?.policyNumber || claim?.policy || claim?.policy_number,
    };
  }, [claim, id]);

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>Claim Detail</h1>
          <p>Review the assigned risk and the rules that triggered it.</p>
        </div>
        <div className="btnRow">
          <Link className="btn" to="/queue">
            Back to queue
          </Link>
          <button className="btn" onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      <ErrorBanner error={error} title="Failed to load claim" />

      {claim === null ? (
        <Loading label="Loading claim detail…" />
      ) : (
        <>
          <div className="grid gridCols2" style={{ marginBottom: 14 }}>
            <div className="card cardPad">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div className="kpiTitle">Claim ID</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>
                    {String(basic.claimId || id)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="kpiTitle">Risk</div>
                  <div style={{ marginTop: 6 }}>
                    <Badge risk={basic.risk} />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                <div>
                  <span className="kpiTitle">Claimant</span>
                  <div style={{ fontWeight: 700 }}>{basic.claimant ? String(basic.claimant) : "—"}</div>
                </div>
                <div>
                  <span className="kpiTitle">Amount</span>
                  <div style={{ fontWeight: 700 }}>{basic.amount !== undefined && basic.amount !== null ? String(basic.amount) : "—"}</div>
                </div>
                <div>
                  <span className="kpiTitle">Date</span>
                  <div style={{ fontWeight: 700 }}>{basic.date ? String(basic.date) : "—"}</div>
                </div>
                <div>
                  <span className="kpiTitle">Policy</span>
                  <div style={{ fontWeight: 700 }}>{basic.policy ? String(basic.policy) : "—"}</div>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <strong>Cross-claim signals</strong>
                <div className="smallHelp">
                  Detected by comparing this claim against previously uploaded claims in the in-memory store.
                </div>

                {claim?.fraudSignals ? (
                  <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                    <div className="card cardPad" style={{ background: "rgba(241,245,249,0.65)" }}>
                      <div className="kpiTitle">Duplicate claim_id count</div>
                      <div style={{ fontWeight: 800 }}>
                        {String(claim.fraudSignals.duplicateClaimIdCount ?? 0)}
                      </div>
                      <div className="smallHelp">
                        Number of previously stored claims with the same claim_id.
                      </div>
                    </div>

                    <div className="grid gridCols3" style={{ gap: 10 }}>
                      <div className="card cardPad" style={{ background: "rgba(241,245,249,0.65)" }}>
                        <div className="kpiTitle">Prior claimant count</div>
                        <div style={{ fontWeight: 800 }}>
                          {String(claim.fraudSignals.priorClaimantCount ?? 0)}
                        </div>
                      </div>
                      <div className="card cardPad" style={{ background: "rgba(241,245,249,0.65)" }}>
                        <div className="kpiTitle">Prior provider count</div>
                        <div style={{ fontWeight: 800 }}>
                          {String(claim.fraudSignals.priorProviderCount ?? 0)}
                        </div>
                      </div>
                      <div className="card cardPad" style={{ background: "rgba(241,245,249,0.65)" }}>
                        <div className="kpiTitle">Prior location count</div>
                        <div style={{ fontWeight: 800 }}>
                          {String(claim.fraudSignals.priorLocationCount ?? 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="alert" style={{ marginTop: 10 }}>
                    No cross-claim signals available for this claim (older uploads may not include them).
                  </div>
                )}
              </div>
            </div>

            <div className="card cardPad">
              <strong>Explanations</strong>
              <div className="smallHelp">
                These strings explain why the claim was scored at the given risk level (including any cross-claim signals).
              </div>

              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                {explanations.length === 0 ? (
                  <div className="alert">No explanations available for this claim.</div>
                ) : (
                  explanations.map((e, idx) => (
                    <div
                      key={`${idx}-${e}`}
                      className="card cardPad"
                      style={{ background: "rgba(241,245,249,0.65)" }}
                    >
                      {e}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="cardPad">
              <strong>Raw claim data</strong>
              <div className="smallHelp">
                Full claim object as returned by the backend. Useful for auditing and troubleshooting CSV mappings.
              </div>
            </div>
            <div className="cardPad" style={{ paddingTop: 0 }}>
              <pre
                style={{
                  margin: 0,
                  background: "rgba(15,23,42,0.03)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: 12,
                  overflow: "auto",
                }}
              >
                {JSON.stringify(claim, null, 2)}
              </pre>
            </div>
          </div>
        </>
      )}
    </>
  );
}
