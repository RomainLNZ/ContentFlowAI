import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function Surface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-[var(--fp-border-subtle)] bg-[var(--fp-color-surface)] text-[var(--fp-color-text)] shadow-[var(--fp-shadow-surface)]",
        className,
      )}
      {...props}
    />
  );
}
