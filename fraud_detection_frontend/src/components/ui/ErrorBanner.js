import React from "react";

// PUBLIC_INTERFACE
export default function ErrorBanner({ error, title = "Something went wrong" }) {
  /** Render a user-friendly error message. */
  if (!error) return null;

  const message =
    typeof error === "string" ? error : error?.message || "Unknown error";

  return (
    <div className="alert alertError" role="alert" aria-live="polite">
      <strong>{title}:</strong> {message}
    </div>
  );
}
