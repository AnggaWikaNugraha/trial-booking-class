import type { ComponentProps } from "react";

const VARIANTS = {
  primary: "bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90",
  secondary: "border border-border bg-surface px-3 py-1.5 text-sm hover:bg-surface-muted",
};

type Props = ComponentProps<"button"> & { variant?: keyof typeof VARIANTS };

export function Button({ type = "button", variant = "primary", className = "", ...props }: Props) {
  return (
    <button
      type={type}
      className={`rounded-lg transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
