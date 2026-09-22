import type { ComponentProps } from "react";

export type SelectOption = { value: string; label: string };

type Props = Omit<ComponentProps<"select">, "onChange" | "children"> & {
  options: SelectOption[];
  placeholder?: string;
  onChange: (value: string) => void;
};

export function Select({ options, placeholder, onChange, className = "", ...props }: Props) {
  return (
    <select
      className={`block w-full rounded border border-neutral-300 bg-transparent p-2 disabled:opacity-50 ${className}`}
      onChange={(e) => onChange(e.target.value)}
      {...props}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
