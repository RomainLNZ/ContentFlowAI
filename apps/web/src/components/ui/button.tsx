import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:pointer-events-none disabled:opacity-50 active:scale-[.98]",
  {
    variants: {
      variant: {
        primary: "bg-white text-zinc-950 shadow-[0_1px_18px_rgba(255,255,255,.12)] hover:bg-zinc-200",
        secondary: "border border-white/10 bg-white/[.04] text-zinc-200 hover:bg-white/[.08]",
        ghost: "text-zinc-400 hover:bg-white/[.05] hover:text-white",
      },
      size: { default: "h-11 px-4", sm: "h-9 px-3", icon: "size-10" },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";
