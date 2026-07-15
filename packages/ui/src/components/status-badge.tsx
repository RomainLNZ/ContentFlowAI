import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const statusBadgeVariants = cva(
  "inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "border-white/10 bg-white/[.05] text-zinc-300",
        brand: "border-violet-400/20 bg-violet-400/10 text-violet-300",
        info: "border-sky-400/20 bg-sky-400/10 text-sky-300",
        success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
        warning: "border-amber-400/20 bg-amber-400/10 text-amber-300",
        danger: "border-rose-400/20 bg-rose-400/10 text-rose-300",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof statusBadgeVariants> & { dot?: boolean };

export function StatusBadge({ className, tone, dot = false, children, ...props }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ tone }), className)} {...props}>
      {dot && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
