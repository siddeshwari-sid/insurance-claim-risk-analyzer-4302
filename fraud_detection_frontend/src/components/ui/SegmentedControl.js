import React from "react";

/**
 * Segmented control used on Upload page to mimic pill tabs.
 */

// PUBLIC_INTERFACE
export function SegmentedControl({ items, value, onChange, ariaLabel }) {
  /** A simple segmented control. items: [{value,label}] */
  return (
    <div className="Segmented" role="tablist" aria-label={ariaLabel || "Tabs"}>
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            className={`Segment ${active ? "SegmentActive" : ""}`}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.value)}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
