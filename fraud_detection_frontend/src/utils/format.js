// PUBLIC_INTERFACE
export function normalizeRisk(value) {
  /** Normalize risk strings to one of: High, Medium, Low, Unknown */
  if (!value) return "Unknown";
  const v = String(value).trim().toLowerCase();
  if (v === "high") return "High";
  if (v === "medium") return "Medium";
  if (v === "low") return "Low";
  return String(value);
}

// PUBLIC_INTERFACE
export function riskClassName(risk) {
  /** Map risk to badge class names. */
  const r = normalizeRisk(risk);
  if (r === "High") return "badge badgeHigh";
  if (r === "Medium") return "badge badgeMedium";
  if (r === "Low") return "badge badgeLow";
  return "badge";
}

// PUBLIC_INTERFACE
export function safeNumber(n) {
  /** Render numbers safely for KPI values. */
  if (n === null || n === undefined) return "—";
  if (Number.isNaN(Number(n))) return "—";
  return String(n);
}
