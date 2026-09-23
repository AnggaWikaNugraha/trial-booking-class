import type { ReactNode } from "react";

type Props = {
  label: string;
  children: ReactNode;
};

// Wrapping the field in the label ties them together without an id.
export function FormFieldGroup({ label, children }: Props) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
