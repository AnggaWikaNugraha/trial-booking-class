import type { ComponentProps } from "react";

const VARIANTS = {
  primary: "bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700",
  secondary:
    "border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900",
};

type Props = ComponentProps<"button"> & { variant?: keyof typeof VARIANTS };

export function Button({ type = "button", variant = "primary", className = "", ...props }: Props) {
  return (
    <button
      type={type}
      className={`rounded disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
