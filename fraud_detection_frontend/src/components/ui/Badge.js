import React from "react";
import { normalizeRisk, riskClassName } from "../../utils/format";

// PUBLIC_INTERFACE
export default function Badge({ risk, score }) {
  /** Risk badge component (optionally displays numeric score like "High (82)"). */
  const label = normalizeRisk(risk);

  const n = score === null || score === undefined ? null : Number(score);
  const scoreText = Number.isFinite(n) ? ` (${Math.round(n)})` : "";

  return <span className={riskClassName(label)}>{label}{scoreText}</span>;
}
