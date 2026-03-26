import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { uploadClaimsCsv } from "../api/client";
import ErrorBanner from "../components/ui/ErrorBanner";
import Badge from "../components/ui/Badge";
import { formatCurrency, normalizeRisk } from "../utils/format";


function summarizeUploadResponse(resp) {
  // Accept flexible backend shapes: { processed, claims, inserted, message, ... }
  if (!resp) return { claims: [], message: "" };
  const claims = Array.isArray(resp) ? resp : resp?.claims || resp?.data || [];
  const message = resp?.message || resp?.status || "";
  return { claims, message };
}

function countByRisk(claims) {
  const counts = { High: 0, Medium: 0, Low: 0, Unknown: 0 };
  for (const c of claims) {
    const r = normalizeRisk(c?.riskLevel || c?.risk || c?.risk_level);
    if (counts[r] === undefined) counts.Unknown += 1;
    else counts[r] += 1;
  }
  return counts;
}

// PUBLIC_INTERFACE
export default function UploadPage() {
  /** Upload view: select CSV and upload to backend. */
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  const counts = useMemo(() => countByRisk(uploadResult?.claims || []), [uploadResult]);

  async function loadDemoSeed() {
    try {
      setError(null);
      setUploadResult(null);

      const resp = await fetch("/seed/seedClaimsAllRules.csv", { cache: "no-store" });
      if (!resp.ok) {
        throw new Error(`Failed to load seed CSV: HTTP ${resp.status}`);
      }
      const text = await resp.text();

      // Build a File so uploadClaimsCsv can continue using FormData/text-csv as-is.
      const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
      const demoFile = new File([blob], "seedClaimsAllRules.csv", { type: "text/csv" });
      setFile(demoFile);
    } catch (e) {
      setError(e);
    }
  }

  async function onUpload() {
    if (!file) return;
    try {
      setBusy(true);
      setError(null);
      setUploadResult(null);

      const resp = await uploadClaimsCsv(file);
      const parsed = summarizeUploadResponse(resp);
      setUploadResult(parsed);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>Upload CSV</h1>
          <p>Upload a CSV file containing claims. The backend will assign risk levels and explanations.</p>
        </div>
        <div className="btnRow">
          <Link className="btn" to="/queue">
            View queue
          </Link>
        </div>
      </div>

      <div className="card cardPad" style={{ marginBottom: 14 }}>
        <div className="grid gridCols2">
          <div>
            <label style={{ display: "block", fontWeight: 700, marginBottom: 8 }}>
              CSV file
            </label>
            <input
              className="input"
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div className="smallHelp">
              Expected columns depend on backend parsing rules. If some columns are missing, the backend may still ingest best-effort.
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 700, marginBottom: 8 }}>
              Actions
            </label>
            <div className="btnRow">
              <button className="btn btnPrimary" onClick={onUpload} disabled={!file || busy}>
                {busy ? "Uploading…" : "Upload & Score"}
              </button>

              <button className="btn" onClick={loadDemoSeed} disabled={busy}>
                Load demo seed CSV
              </button>

              <button
                className="btn btnDanger"
                onClick={() => {
                  setFile(null);
                  setError(null);
                  setUploadResult(null);
                  // reset input (simple approach: reload page state is enough for typical flow)
                }}
                disabled={busy}
              >
                Reset
              </button>
            </div>
            <div className="smallHelp">
              After upload, navigate to the queue to filter and review claims.
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <ErrorBanner error={error} title="Upload failed" />
        </div>
      </div>

      {uploadResult && (
        <div className="card">
          <div className="cardPad">
            <strong>Upload result</strong>
            {uploadResult.message ? (
              <div className="smallHelp">{uploadResult.message}</div>
            ) : (
              <div className="smallHelp">Processed file successfully.</div>
            )}
          </div>

          <div className="cardPad" style={{ paddingTop: 0 }}>
            <div className="grid gridCols3" style={{ marginBottom: 10 }}>
              <div className="card cardPad" style={{ background: "rgba(241,245,249,0.65)" }}>
                <p className="kpiTitle">High</p>
                <p className="kpiValue">{counts.High}</p>
              </div>
              <div className="card cardPad" style={{ background: "rgba(241,245,249,0.65)" }}>
                <p className="kpiTitle">Medium</p>
                <p className="kpiValue">{counts.Medium}</p>
              </div>
              <div className="card cardPad" style={{ background: "rgba(241,245,249,0.65)" }}>
                <p className="kpiTitle">Low</p>
                <p className="kpiValue">{counts.Low}</p>
              </div>
            </div>

            <div className="tableWrap">
              <table className="table" aria-label="Upload sample claims">
                <thead>
                  <tr>
                    <th>Claim ID</th>
                    <th>Risk</th>
                    <th>Claimant</th>
                    <th>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(uploadResult.claims || []).slice(0, 10).map((c) => {
                    const id = c?.id || c?.claimId || c?.claim_id;
                    const claimant =
                      c?.claimantName ||
                      c?.claimant ||
                      c?.name ||
                      c?.insuredName ||
                      c?.insured_name ||
                      "—";
                    const amountRaw = c?.claimAmount ?? c?.amount ?? c?.claim_amount;
                    return (
                      <tr key={String(id)}>
                        <td>{String(id)}</td>
                        <td>
                          <Badge risk={c?.riskLevel || c?.risk} score={c?.riskScore ?? c?.score} />
                        </td>
                        <td>{String(claimant)}</td>
                        <td>{formatCurrency(amountRaw)}</td>
                        <td>
                          <Link className="btn" to={`/claims/${encodeURIComponent(id)}`}>
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {(uploadResult.claims || []).length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ color: "var(--muted)" }}>
                        No claims returned in response. Check backend upload implementation/response shape.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="smallHelp" style={{ marginTop: 10 }}>
              Showing first 10 claims returned by the upload response.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
