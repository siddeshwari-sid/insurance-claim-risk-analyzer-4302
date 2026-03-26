import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { uploadClaimsCsv } from "../api/client";
import { formatMoney } from "../utils/format";
import { Card } from "../components/ui/Card";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { StatusPill } from "../components/ui/StatusPill";

/**
 * Upload page styled to match screenshot:
 * - large panel card
 * - segmented tabs
 * - right-side primary action
 */
export default function UploadPage() {
  const [tab, setTab] = useState("paste");

  const [csvText, setCsvText] = useState(
    "id,claim_amount,incident_type,days_since_incident,policy_tenure_months,prior_claims_count,description\n" +
      "C-1001,12000,Collision,2,14,0,Rear-end collision in parking lot\n" +
      "C-1002,250000,Fire,1,2,3,Kitchen fire with smoke damage\n"
  );
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const warnings = useMemo(() => result?.warnings || [], [result]);
  const accepted = useMemo(() => result?.claims || [], [result]);

  async function onSubmit() {
    setSubmitting(true);
    setError("");
    setResult(null);

    try {
      const res = await uploadClaimsCsv(csvText);
      setResult(res);
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setSubmitting(false);
    }
  }

  const tabs = useMemo(
    () => [
      { value: "paste", label: "Paste CSV" },
      { value: "file", label: "Upload File" },
      { value: "help", label: "Format Help" },
    ],
    []
  );

  return (
    <>
      <div className="PageHeader">
        <div>
          <h1 className="PageTitle">Upload</h1>
          <p className="Muted">
            Submit claim data and receive a risk level, score, and explanations.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="Button" to="/dashboard">
            Back
          </Link>
          <Link className="Button" to="/queue">
            Queue
          </Link>
        </div>
      </div>

      {error ? (
        <div className="Alert AlertError" role="alert">
          <div className="AlertTitle">Upload failed</div>
          <div>{error}</div>
          <div className="AlertHint">
            Backend expects <code>POST /api/claims/upload</code> with <code>text/csv</code>.
          </div>
        </div>
      ) : null}

      <Card
        title="Upload Claims"
        right={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <SegmentedControl
              items={tabs}
              value={tab}
              onChange={setTab}
              ariaLabel="Upload mode"
            />
            <button
              className="Button ButtonPrimary"
              type="button"
              onClick={onSubmit}
              disabled={submitting || tab !== "paste" || !String(csvText || "").trim()}
            >
              {submitting ? "Scoring…" : "Run Scoring"}
            </button>
          </div>
        }
      >
        {tab === "paste" ? (
          <div style={{ display: "grid", gap: 12 }}>
            <div className="Muted">
              Paste CSV with headers. Results will appear below in the same panel style.
            </div>
            <textarea
              className="Textarea"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              spellCheck={false}
              aria-label="CSV input"
            />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                className="Button"
                type="button"
                disabled={submitting}
                onClick={() => {
                  setResult(null);
                  setError("");
                }}
              >
                Clear Results
              </button>
            </div>
          </div>
        ) : tab === "file" ? (
          <div style={{ display: "grid", gap: 10 }}>
            <div className="Muted">
              File upload UI is not implemented in this template. Use “Paste CSV” for now.
            </div>
            <div
              style={{
                border: "1px dashed rgba(255,255,255,0.18)",
                borderRadius: 12,
                padding: 16,
                background: "rgba(0,0,0,0.18)",
              }}
            >
              <div className="Muted">Drop a CSV here (coming soon)</div>
              <div style={{ marginTop: 10 }}>
                <button className="Button" type="button" disabled>
                  Choose File
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <div className="Muted">Expected headers:</div>
            <code>
              id,claim_amount,incident_type,days_since_incident,policy_tenure_months,prior_claims_count,description
            </code>
            <div className="Muted">
              Example row:
              <div style={{ marginTop: 6 }}>
                <code>C-1001,12000,Collision,2,14,0,Rear-end collision in parking lot</code>
              </div>
            </div>
          </div>
        )}
      </Card>

      {result ? (
        <div className="Grid2">
          <Card
            title="Upload Summary"
            right={
              <span className="Muted">
                Accepted: <strong>{accepted.length}</strong> • Warnings:{" "}
                <strong>{warnings.length}</strong>
              </span>
            }
          >
            {warnings.length ? (
              <div className="Alert" role="status">
                <div className="AlertTitle">Warnings</div>
                <div className="AlertHint">Some rows were skipped or had parsing issues.</div>
                <ul style={{ margin: "10px 0 0", paddingLeft: 16, color: "var(--text-secondary)" }}>
                  {warnings.slice(0, 8).map((w, idx) => (
                    <li key={`${w?.row ?? idx}-${idx}`}>
                      Row {w?.row ?? "—"}:{" "}
                      {Array.isArray(w?.errors) ? w.errors.join("; ") : "—"}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="Muted">No warnings.</div>
            )}
          </Card>

          <Card title="Next Steps" right={<span className="Muted">Review</span>}>
            <div style={{ display: "grid", gap: 10 }}>
              <div className="Muted">
                Open the claim queue to review all newly scored claims.
              </div>
              <Link className="Button ButtonPrimary" to="/queue">
                Go to Queue
              </Link>
            </div>
          </Card>

          <div style={{ gridColumn: "span 2" }}>
            <Card title="Accepted Claims" right={<span className="Muted">Click Open</span>}>
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
                    {accepted.length === 0 ? (
                      <tr>
                        <td className="TableEmpty" colSpan={7}>
                          No accepted rows.
                        </td>
                      </tr>
                    ) : (
                      accepted.map((c) => (
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
      ) : null}
    </>
  );
}
