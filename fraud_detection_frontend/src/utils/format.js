// PUBLIC_INTERFACE
export function formatMoney(value) {
  /** Format a numeric value as USD. Falls back gracefully for unknown values. */
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  return num.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

// PUBLIC_INTERFACE
export function formatNumber(value) {
  /** Format a numeric value with locale separators. */
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  return num.toLocaleString();
}

// PUBLIC_INTERFACE
export function riskBadgeClass(riskLevel) {
  /** Map risk level to CSS badge class. */
  if (riskLevel === "High") return "Badge BadgeHigh";
  if (riskLevel === "Medium") return "Badge BadgeMedium";
  if (riskLevel === "Low") return "Badge BadgeLow";
  return "Badge";
}
