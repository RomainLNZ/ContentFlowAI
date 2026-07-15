import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-[var(--fp-duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:pointer-events-none disabled:opacity-50 active:scale-[.98] motion-reduce:active:scale-100",
  {
    variants: {
      variant: {
        primary: "bg-white text-zinc-950 shadow-[0_1px_18px_rgba(255,255,255,.12)] hover:bg-zinc-200",
        secondary:
          "border border-[var(--fp-border-subtle)] bg-[var(--fp-color-surface)] text-[var(--fp-color-text)] hover:bg-[var(--fp-color-elevated)]",
        ghost:
          "text-[var(--fp-color-text-secondary)] hover:bg-[var(--fp-color-elevated)] hover:text-[var(--fp-color-text)]",
        danger: "bg-rose-500 text-white hover:bg-rose-400",
      },
      size: { default: "h-11 px-4", sm: "h-9 px-3", lg: "h-12 px-6", icon: "size-10" },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";
