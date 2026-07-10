import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function Surface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/[.08] bg-white/[.025] shadow-2xl shadow-black/30 backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}
