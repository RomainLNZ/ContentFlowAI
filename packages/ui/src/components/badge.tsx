import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", {
  variants: {
    tone: {
      neutral: "border-white/10 bg-white/[.05] text-zinc-300",
      brand: "border-violet-400/20 bg-violet-400/10 text-violet-300",
      success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
      danger: "border-rose-400/20 bg-rose-400/10 text-rose-300",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;
export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
