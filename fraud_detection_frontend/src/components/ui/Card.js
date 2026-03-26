import React from "react";

/**
 * Card component with optional header strip and body padding.
 */

// PUBLIC_INTERFACE
export function Card({ title, right, children, bodyClassName = "" }) {
  /** A themed container matching the screenshot "glass card" style. */
  return (
    <section className="Card">
      {title ? (
        <div className="CardHeader">
          <h2>{title}</h2>
          <div>{right}</div>
        </div>
      ) : null}
      <div className={`CardBody ${bodyClassName}`.trim()}>{children}</div>
    </section>
  );
}
