import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type EmptyStateProps = {
  icon?: ReactNode;
  eyebrow?: string;
  title: string;
  description: string;
  benefit?: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon,
  eyebrow,
  title,
  description,
  benefit,
  primaryAction,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <section
      className={cn(
        "grid min-h-64 place-items-center rounded-3xl border border-dashed border-[var(--fp-border-strong)] px-6 py-12 text-center",
        className,
      )}
    >
      <div className="max-w-lg">
        {icon && (
          <div className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl border border-[var(--fp-border-subtle)] bg-[var(--fp-color-elevated)] text-violet-400">
            {icon}
          </div>
        )}
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-400">{eyebrow}</p>
        )}
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-[var(--fp-color-text)] sm:text-2xl">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--fp-color-text-secondary)]">{description}</p>
        {benefit && <p className="mt-2 text-sm font-medium text-[var(--fp-color-text)]">{benefit}</p>}
        {(primaryAction || secondaryAction) && (
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            {primaryAction}
            {secondaryAction}
          </div>
        )}
      </div>
    </section>
  );
}
