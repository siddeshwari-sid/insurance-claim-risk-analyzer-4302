import React from "react";
import { normalizeRisk, riskClassName } from "../../utils/format";

// PUBLIC_INTERFACE
export default function Badge({ risk }) {
  /** Risk badge component. */
  const label = normalizeRisk(risk);
  return <span className={riskClassName(label)}>{label}</span>;
}
