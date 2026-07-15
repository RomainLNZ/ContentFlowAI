import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-xl bg-[color-mix(in_srgb,var(--fp-color-text)_8%,transparent)] motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}

export function SkeletonGroup({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="status" aria-label={label} className={className} aria-busy="true">
      {children}
      <span className="sr-only">{label}</span>
    </div>
  );
}
