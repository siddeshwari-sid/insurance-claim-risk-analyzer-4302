import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Color palette aligned with existing badge colors / theme accents.
 * Keep translucent fills for the "glass" look.
 */
const RISK_COLORS = {
  High: "rgba(239, 68, 68, 0.85)", // --danger
  Medium: "rgba(245, 158, 11, 0.85)", // --warning
  Low: "rgba(6, 182, 212, 0.85)", // --success
};

const RISK_STROKES = {
  High: "rgba(239, 68, 68, 0.45)",
  Medium: "rgba(245, 158, 11, 0.48)",
  Low: "rgba(6, 182, 212, 0.48)",
};

function getClaimTimestamp(claim) {
  // Prefer backend canonical field from OpenAPI: createdAt.
  // Fall back to other common variants used across the app.
  const raw =
    claim?.createdAt ??
    claim?.created_at ??
    claim?.uploadedAt ??
    claim?.uploaded_at ??
    claim?.timestamp ??
    claim?.date ??
    claim?.lossDate ??
    claim?.dateOfLoss ??
    null;

  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function safeRisk(value) {
  const v = String(value || "").trim().toLowerCase();
  if (v === "high") return "High";
  if (v === "medium") return "Medium";
  if (v === "low") return "Low";
  return "Unknown";
}

/**
 * Groups timestamps into "upload buckets". Without an explicit upload/batch id from the backend,
 * we treat "bursts" of createdAt times as an upload session.
 *
 * Rule:
 * - sort by timestamp ascending
 * - start new bucket if time gap to previous claim exceeds gapMs (default 10 minutes)
 */
function buildUploadBuckets(claims, gapMs) {
  const items = claims
    .map((c) => ({ claim: c, ts: getClaimTimestamp(c) }))
    .filter((x) => x.ts)
    .sort((a, b) => a.ts.getTime() - b.ts.getTime());

  const buckets = [];
  let current = null;

  for (const item of items) {
    if (!current) {
      current = { start: item.ts, end: item.ts, claims: [item.claim] };
      continue;
    }
    const gap = item.ts.getTime() - current.end.getTime();
    if (gap > gapMs) {
      buckets.push(current);
      current = { start: item.ts, end: item.ts, claims: [item.claim] };
    } else {
      current.end = item.ts;
      current.claims.push(item.claim);
    }
  }
  if (current) buckets.push(current);
  return buckets;
}

function formatBucketLabel(bucket, index) {
  const pad2 = (n) => String(n).padStart(2, "0");
  const s = bucket.start;

  // Keep label compact to fit bar chart.
  const date = `${pad2(s.getMonth() + 1)}/${pad2(s.getDate())}`;
  const time = `${pad2(s.getHours())}:${pad2(s.getMinutes())}`;
  return `Upload ${index + 1} • ${date} ${time}`;
}

function aggregateBucket(bucket, index) {
  const out = {
    name: formatBucketLabel(bucket, index),
    High: 0,
    Medium: 0,
    Low: 0,
    total: 0,
  };

  for (const c of bucket.claims) {
    const r = safeRisk(c?.riskLevel ?? c?.risk ?? c?.risk_level);
    if (r === "High" || r === "Medium" || r === "Low") out[r] += 1;
    out.total += 1;
  }

  return out;
}

function renderCustomLegend({ payload }) {
  if (!payload || payload.length === 0) return null;
  return (
    <ul className="chartLegend" aria-label="Risk level legend">
      {payload.map((entry) => (
        <li key={entry.value} className="chartLegendItem">
          <span
            className="chartLegendSwatch"
            aria-hidden="true"
            style={{
              background: entry.color,
              borderColor:
                entry.value === "High"
                  ? RISK_STROKES.High
                  : entry.value === "Medium"
                    ? RISK_STROKES.Medium
                    : RISK_STROKES.Low,
            }}
          />
          <span className="chartLegendLabel">{entry.value}</span>
        </li>
      ))}
    </ul>
  );
}

function GlassTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  const byKey = Object.fromEntries(payload.map((p) => [p.dataKey, p.value]));
  const total =
    Number(byKey.High || 0) + Number(byKey.Medium || 0) + Number(byKey.Low || 0);

  return (
    <div
      style={{
        background: "rgba(17, 24, 39, 0.92)",
        border: "1px solid rgba(148, 163, 184, 0.22)",
        borderRadius: 12,
        boxShadow:
          "0 18px 50px rgba(0,0,0,0.62), 0 1px 0 rgba(255,255,255,0.04) inset",
        color: "rgba(229,231,235,0.95)",
        fontSize: 12,
        padding: "10px 12px",
        outline: "none",
      }}
    >
      <div style={{ fontWeight: 900, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "grid", gap: 4 }}>
        <div style={{ color: "rgba(229,231,235,0.85)" }}>
          Total: <strong>{total}</strong>
        </div>
        <div style={{ color: RISK_COLORS.High }}>
          High: <strong style={{ color: "rgba(229,231,235,0.95)" }}>{byKey.High || 0}</strong>
        </div>
        <div style={{ color: RISK_COLORS.Medium }}>
          Medium:{" "}
          <strong style={{ color: "rgba(229,231,235,0.95)" }}>{byKey.Medium || 0}</strong>
        </div>
        <div style={{ color: RISK_COLORS.Low }}>
          Low: <strong style={{ color: "rgba(229,231,235,0.95)" }}>{byKey.Low || 0}</strong>
        </div>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export default function RiskCountsBar({
  claims,
  height = 280,
  maxBuckets = 8,
  gapMinutes = 10,
}) {
  /**
   * Bar chart visualization for risk counts grouped over time / per upload.
   *
   * Because the current backend API does not expose an explicit upload batch id,
   * we infer "uploads" as time buckets (bursts of claim createdAt timestamps).
   *
   * @param {Array<any>} claims - Raw claims list from API.
   * @param {number} height - Chart container height in px.
   * @param {number} maxBuckets - Maximum number of upload buckets shown (most recent).
   * @param {number} gapMinutes - Gap threshold in minutes to split upload buckets.
   */
  const { data, hasTimestamps } = useMemo(() => {
    const list = Array.isArray(claims) ? claims : [];
    const anyTs = list.some((c) => Boolean(getClaimTimestamp(c)));

    if (!anyTs) return { data: [], hasTimestamps: false };

    const buckets = buildUploadBuckets(list, gapMinutes * 60 * 1000);
    // Show most recent buckets only to keep chart readable.
    const tail = buckets.slice(Math.max(0, buckets.length - maxBuckets));
    return {
      data: tail.map((b, idx) => aggregateBucket(b, buckets.length - tail.length + idx)),
      hasTimestamps: true,
    };
  }, [claims, gapMinutes, maxBuckets]);

  if (!hasTimestamps) {
    return (
      <div className="chartEmpty" role="note" aria-label="No time-series chart data">
        <div style={{ fontWeight: 800 }}>No time-series data available</div>
        <div className="smallHelp" style={{ marginTop: 6 }}>
          The current claim objects do not include timestamps (e.g. <code>createdAt</code>). Upload
          a CSV with a backend that returns timestamps to see risk counts per upload over time.
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="chartEmpty" role="note" aria-label="No chart data">
        <div style={{ fontWeight: 800 }}>No claims yet</div>
        <div className="smallHelp" style={{ marginTop: 6 }}>
          Upload a CSV to see risk counts per upload over time.
        </div>
      </div>
    );
  }

  return (
    <div className="chartWrap" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 18, right: 18, left: 0, bottom: 18 }}>
          <CartesianGrid stroke="rgba(148, 163, 184, 0.14)" strokeDasharray="4 6" />
          <XAxis
            dataKey="name"
            tick={{ fill: "rgba(229,231,235,0.72)", fontSize: 11 }}
            axisLine={{ stroke: "rgba(148, 163, 184, 0.18)" }}
            tickLine={{ stroke: "rgba(148, 163, 184, 0.18)" }}
            interval={0}
            angle={-12}
            textAnchor="end"
            height={44}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "rgba(229,231,235,0.72)", fontSize: 11 }}
            axisLine={{ stroke: "rgba(148, 163, 184, 0.18)" }}
            tickLine={{ stroke: "rgba(148, 163, 184, 0.18)" }}
          />
          <Tooltip content={<GlassTooltip />} />
          <Legend verticalAlign="bottom" align="center" content={renderCustomLegend} />

          <Bar
            dataKey="High"
            stackId="risk"
            fill={RISK_COLORS.High}
            stroke={RISK_STROKES.High}
            strokeWidth={2}
            isAnimationActive={false}
            radius={[10, 10, 0, 0]}
          />
          <Bar
            dataKey="Medium"
            stackId="risk"
            fill={RISK_COLORS.Medium}
            stroke={RISK_STROKES.Medium}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Bar
            dataKey="Low"
            stackId="risk"
            fill={RISK_COLORS.Low}
            stroke={RISK_STROKES.Low}
            strokeWidth={2}
            isAnimationActive={false}
            radius={[0, 0, 10, 10]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
