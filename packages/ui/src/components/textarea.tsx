import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-32 w-full resize-y rounded-xl border border-[var(--fp-border-subtle)] bg-[var(--fp-color-surface)] px-3.5 py-3 text-sm leading-6 text-[var(--fp-color-text)] outline-none transition duration-[var(--fp-duration-fast)] placeholder:text-[var(--fp-color-text-muted)] focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/10 disabled:opacity-50 aria-invalid:border-rose-400/60 aria-invalid:ring-2 aria-invalid:ring-rose-400/10",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
