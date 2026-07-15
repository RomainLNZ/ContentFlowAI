import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { Overlay, type OverlayProps } from "./overlay";

export type DialogProps = Omit<OverlayProps, "className" | "panelClassName"> & {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" };

export function Dialog({ size = "md", className, ...props }: DialogProps) {
  return (
    <Overlay
      className="items-center justify-center p-4"
      panelClassName={cn("max-h-[min(90vh,52rem)] w-full overflow-auto rounded-3xl", sizes[size], className)}
      {...props}
    />
  );
}

export type ConfirmDialogProps = Omit<DialogProps, "children" | "footer"> & {
  message: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
};

export function ConfirmDialog({
  message,
  confirmLabel,
  cancelLabel = "Annuler",
  destructive = false,
  busy = false,
  onConfirm,
  onOpenChange,
  ...props
}: ConfirmDialogProps) {
  return (
    <Dialog
      {...props}
      onOpenChange={onOpenChange}
      footer={
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => onOpenChange(false)}
            className="min-h-10 rounded-xl border border-[var(--fp-border-subtle)] px-4 text-sm font-medium"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={cn(
              "min-h-10 rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-50",
              destructive ? "bg-rose-500" : "bg-violet-600",
            )}
          >
            {busy ? "Traitement…" : confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-sm leading-6 text-[var(--fp-color-text-secondary)]">{message}</div>
    </Dialog>
  );
}
