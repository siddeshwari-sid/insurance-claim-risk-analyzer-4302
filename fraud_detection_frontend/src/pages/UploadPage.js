import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { uploadClaimsCsv } from "../api/client";
import { formatMoney, riskBadgeClass } from "../utils/format";

/**
 * Upload CSV page: allows users to paste CSV content and submit for scoring.
 */
export default function UploadPage() {
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

  async function onSubmit(e) {
    e.preventDefault();
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

  return (
    <>
      <div className="PageHeader">
        <div>
          <h1 className="PageTitle">Upload CSV</h1>
          <p className="Muted">
            Paste claim rows (CSV) and the backend will assign a risk score/level with explanations.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="Button" to="/dashboard">
            Back to dashboard
          </Link>
          <Link className="Button ButtonPrimary" to="/queue">
            View queue
          </Link>
        </div>
      </div>

      {error ? (
        <div className="Alert AlertError" role="alert">
          <div className="AlertTitle">Upload failed</div>
          <div>{error}</div>
          <div className="AlertHint">
            The backend expects <code>POST /api/claims/upload</code> with <code>text/csv</code>.
          </div>
        </div>
      ) : null}

      <section className="Card">
        <div className="CardHeader">
          <h2>CSV input</h2>
          <div className="Muted">Tip: include headers exactly as shown.</div>
        </div>

        <form className="FormRow" onSubmit={onSubmit}>
          <textarea
            className="Textarea"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            spellCheck={false}
            aria-label="CSV input"
          />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="Button ButtonPrimary"
              type="submit"
              disabled={submitting || !String(csvText || "").trim()}
            >
              {submitting ? "Uploading…" : "Upload and score"}
            </button>
            <button
              className="Button"
              type="button"
              disabled={submitting}
              onClick={() => {
                setResult(null);
                setError("");
              }}
            >
              Clear results
            </button>
          </div>
        </form>
      </section>

      {result ? (
        <>
          <section className="Card" aria-label="Upload summary">
            <div className="CardHeader">
              <h2>Upload summary</h2>
              <div className="Muted">
                Accepted: <strong>{accepted.length}</strong> • Warnings:{" "}
                <strong>{warnings.length}</strong>
              </div>
            </div>

            {warnings.length ? (
              <div className="Alert" role="status">
                <div className="AlertTitle">Warnings</div>
                <div className="AlertHint">
                  Some rows were skipped or had parsing issues.
                </div>
                <ul className="ReasonList">
                  {warnings.slice(0, 8).map((w, idx) => (
                    <li key={`${w?.row ?? idx}-${idx}`}>
                      Row {w?.row ?? "—"}:{" "}
                      {Array.isArray(w?.errors) ? w.errors.join("; ") : "—"}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <section className="Card" aria-label="Accepted claims">
            <div className="CardHeader">
              <h2>Accepted claims</h2>
              <div className="Muted">
                Open a claim to see full details and explanations.
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
                  {accepted.length === 0 ? (
                    <tr>
                      <td className="TableEmpty" colSpan={6}>
                        No accepted rows.
                      </td>
                    </tr>
                  ) : (
                    accepted.map((c) => (
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
      ) : null}
    </>
  );
}
