const TONES = {
  neutral: "bg-surface-muted text-muted",
  success: "bg-success-surface text-success",
  danger: "bg-danger-surface text-danger",
  warning: "bg-warning-surface text-warning",
  info: "bg-info-surface text-info",
};

export type Tone = keyof typeof TONES;

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
