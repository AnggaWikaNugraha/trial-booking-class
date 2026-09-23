import type { ComponentProps } from "react";

// Checkboxes and radios keep the browser's own control; the box styling is for
// text-like inputs only.
const TOGGLE_TYPES = new Set(["checkbox", "radio"]);

export function Input({ type = "text", className = "", ...props }: ComponentProps<"input">) {
  const base = TOGGLE_TYPES.has(type)
    ? "accent-primary disabled:opacity-50"
    : "block w-full rounded-lg border border-border bg-surface p-2.5 text-sm disabled:opacity-50";
  return <input type={type} className={`${base} ${className}`} {...props} />;
}
