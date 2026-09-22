import type { ComponentProps } from "react";

export function Button({ type = "button", className = "", ...props }: ComponentProps<"button">) {
  return (
    <button
      type={type}
      className={`rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
