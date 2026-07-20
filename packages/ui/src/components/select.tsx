import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-11 rounded-xl border border-[var(--fp-border-subtle)] bg-[var(--fp-color-surface)] px-3.5 text-sm text-[var(--fp-color-text)] outline-none transition duration-[var(--fp-duration-fast)] focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/10 disabled:opacity-50 aria-invalid:border-rose-400/60",
      className,
    )}
    {...props}
  />
));
Select.displayName = "Select";
