import type { ReactNode } from "react";

type Props = {
  title?: string;
  description?: string;
  step?: number;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Card({ title, description, step, action, children, className = "" }: Props) {
  return (
    <section className={`rounded-xl border border-border bg-surface p-5 ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && (
              <h2 className="flex items-center gap-2 font-semibold">
                {step !== undefined && (
                  <span className="flex size-6 items-center justify-center rounded-full bg-surface-muted text-xs text-muted">
                    {step}
                  </span>
                )}
                {title}
              </h2>
            )}
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
