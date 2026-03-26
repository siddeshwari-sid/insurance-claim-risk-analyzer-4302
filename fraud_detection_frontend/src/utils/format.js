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
  /**
   * Backwards-compatible mapping used by existing pages.
   * In the updated UI, we prefer <StatusPill/> but keeping this avoids breakage.
   */
  if (riskLevel === "High") return "Pill PillHigh";
  if (riskLevel === "Medium") return "Pill PillMedium";
  if (riskLevel === "Low") return "Pill PillLow";
  return "Pill";
}
