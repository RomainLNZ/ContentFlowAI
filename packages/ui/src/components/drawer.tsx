import { cn } from "../lib/cn";
import { Overlay, type OverlayProps } from "./overlay";

export type DrawerProps = Omit<OverlayProps, "className" | "panelClassName"> & {
  side?: "left" | "right";
  className?: string;
};

export function Drawer({ side = "right", className, ...props }: DrawerProps) {
  return (
    <Overlay
      className={side === "right" ? "justify-end" : "justify-start"}
      panelClassName={cn(
        "h-full w-full max-w-md overflow-auto",
        side === "right" ? "border-l" : "border-r",
        className,
      )}
      {...props}
    />
  );
}
