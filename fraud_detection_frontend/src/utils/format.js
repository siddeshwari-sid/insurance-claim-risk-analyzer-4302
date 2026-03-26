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

function isHighAmountReason(reason) {
  /**
   * Detect the specific reason we need to suppress in UI:
   * "High claim amount (>= 10,000)" (and close variants).
   *
   * We intentionally keep this matching narrow to avoid hiding other legitimate
   * amount-related explanations like ">= 25,000" that may still be desired.
   */
  const s = String(reason || "").trim().toLowerCase();
  if (!s) return false;

  // Exact / common variants.
  if (s.includes("high claim amount") && s.includes("10,000")) return true;
  if (s.includes("high claim amount") && s.includes("10000")) return true;

  return false;
}

// PUBLIC_INTERFACE
export function sanitizeExplanations(explanations) {
  /**
   * Remove suppressed reasons from the explanation list, preserving order.
   *
   * @param {any} explanations string | string[] | null
   * @returns {string[]} sanitized explanations
   */
  const list = Array.isArray(explanations)
    ? explanations.map(String)
    : explanations
      ? [String(explanations)]
      : [];

  return list.map((x) => String(x)).filter((x) => !isHighAmountReason(x));
}

// PUBLIC_INTERFACE
export function pickFirstExplanation(explanations, fallback = "—") {
  /**
   * Pick the first non-suppressed explanation for compact "reason summary" UIs.
   *
   * @param {any} explanations string | string[] | null
   * @param {string} fallback
   * @returns {string}
   */
  const cleaned = sanitizeExplanations(explanations);
  return cleaned.length > 0 ? cleaned[0] : fallback;
}
