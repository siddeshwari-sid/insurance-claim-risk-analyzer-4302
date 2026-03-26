import React from "react";

/**
 * Color-coded status pill with dot.
 */

// PUBLIC_INTERFACE
export function StatusPill({ level }) {
  /** Render a pill for High/Medium/Low levels. */
  const safe = level === "High" || level === "Medium" || level === "Low" ? level : "—";
  const cls =
    safe === "High"
      ? "Pill PillHigh"
      : safe === "Medium"
        ? "Pill PillMedium"
        : safe === "Low"
          ? "Pill PillLow"
          : "Pill";
  return (
    <span className={cls}>
      <span className="Dot" aria-hidden="true" />
      {safe}
    </span>
  );
}
