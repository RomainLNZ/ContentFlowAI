import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;
export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-xl border border-[var(--fp-border-subtle)] bg-[var(--fp-color-surface)] px-3.5 text-sm text-[var(--fp-color-text)] outline-none transition duration-[var(--fp-duration-fast)] placeholder:text-[var(--fp-color-text-muted)] focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/10 disabled:opacity-50 aria-invalid:border-rose-400/60 aria-invalid:ring-2 aria-invalid:ring-rose-400/10",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
