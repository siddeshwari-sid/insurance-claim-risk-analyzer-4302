import React from "react";

// PUBLIC_INTERFACE
export default function Loading({ label = "Loading…" }) {
  /** Accessible loading state. */
  return (
    <div className="alert" role="status" aria-live="polite">
      {label}
    </div>
  );
}
