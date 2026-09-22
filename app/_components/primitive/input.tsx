import type { ComponentProps } from "react";

// Checkboxes and radios keep the browser's own control; the box styling is for
// text-like inputs only.
const TOGGLE_TYPES = new Set(["checkbox", "radio"]);

export function Input({ type = "text", className = "", ...props }: ComponentProps<"input">) {
  const base = TOGGLE_TYPES.has(type)
    ? "accent-blue-600 disabled:opacity-50"
    : "block w-full rounded border border-neutral-300 bg-transparent p-2 disabled:opacity-50";
  return <input type={type} className={`${base} ${className}`} {...props} />;
}
