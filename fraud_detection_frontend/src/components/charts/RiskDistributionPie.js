import React, { useMemo } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

/**
 * Color palette aligned with existing badge colors / theme accents.
 * Keep slightly translucent fills for "glass" feel.
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

function formatPercent(value) {
  if (!Number.isFinite(value)) return "";
  return `${Math.round(value * 100)}%`;
}

function buildData(counts) {
  return [
    { name: "High", value: Number(counts?.High || 0) },
    { name: "Medium", value: Number(counts?.Medium || 0) },
    { name: "Low", value: Number(counts?.Low || 0) },
  ];
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
          <span className="chartLegendLabel">
            {entry.value}
            <span className="chartLegendValue">
              {typeof entry.payload?.value === "number"
                ? ` • ${entry.payload.value}`
                : ""}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

// PUBLIC_INTERFACE
export default function RiskDistributionPie({ counts, height = 260 }) {
  /**
   * Pie chart visualization for claim distribution by risk level.
   *
   * @param {{High:number, Medium:number, Low:number}} counts - Risk counts.
   * @param {number} height - Chart container height in px.
   */
  const data = useMemo(() => buildData(counts), [counts]);
  const total = useMemo(
    () => data.reduce((acc, d) => acc + (Number(d.value) || 0), 0),
    [data]
  );

  if (!total) {
    return (
      <div className="chartEmpty" role="note" aria-label="No chart data">
        <div style={{ fontWeight: 800 }}>No claims yet</div>
        <div className="smallHelp" style={{ marginTop: 6 }}>
          Upload a CSV to see the distribution by risk level.
        </div>
      </div>
    );
  }

  return (
    <div className="chartWrap" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            wrapperStyle={{ outline: "none" }}
            contentStyle={{
              background: "rgba(17, 24, 39, 0.92)",
              border: "1px solid rgba(148, 163, 184, 0.22)",
              borderRadius: 12,
              boxShadow:
                "0 18px 50px rgba(0,0,0,0.62), 0 1px 0 rgba(255,255,255,0.04) inset",
              color: "rgba(229,231,235,0.95)",
              fontSize: 12,
            }}
            itemStyle={{ color: "rgba(229,231,235,0.95)" }}
            labelStyle={{ color: "rgba(229,231,235,0.75)" }}
            formatter={(value, name) => [value, name]}
          />

          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            content={renderCustomLegend}
          />

          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="46%"
            innerRadius="55%"
            outerRadius="82%"
            paddingAngle={2}
            isAnimationActive={false}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={1}
            labelLine={false}
            label={({ percent }) => formatPercent(percent)}
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={RISK_COLORS[entry.name]}
                stroke={RISK_STROKES[entry.name]}
                strokeWidth={2}
              />
            ))}
          </Pie>

          {/* Center total label */}
          <text
            x="50%"
            y="46%"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fill: "rgba(229,231,235,0.95)",
              fontWeight: 900,
              fontSize: 18,
              letterSpacing: "-0.02em",
            }}
          >
            {total}
          </text>
          <text
            x="50%"
            y="46%"
            textAnchor="middle"
            dominantBaseline="hanging"
            dy={16}
            style={{
              fill: "rgba(229,231,235,0.70)",
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            total
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
