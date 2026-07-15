import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";

const focusable =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type OverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  className?: string;
  panelClassName?: string;
};

export function Overlay({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  closeLabel = "Fermer",
  className,
  panelClassName,
}: OverlayProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(focusable);
      (first ?? panelRef.current)?.focus();
    });
    return () => {
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      onOpenChange(false);
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;
    const nodes = [...panelRef.current.querySelectorAll<HTMLElement>(focusable)];
    const first = nodes[0];
    const last = nodes.at(-1);
    if (!first || !last) {
      event.preventDefault();
      panelRef.current.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return createPortal(
    <div
      className={cn("fixed inset-0 z-[100] flex bg-black/65 backdrop-blur-sm", className)}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={cn(
          "relative border border-[var(--fp-border-subtle)] bg-[var(--fp-color-surface)] text-[var(--fp-color-text)] shadow-2xl outline-none",
          panelClassName,
        )}
      >
        <header className="border-b border-[var(--fp-border-subtle)] px-6 py-5 pr-16">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="mt-1 text-sm leading-6 text-[var(--fp-color-text-secondary)]">
              {description}
            </p>
          )}
        </header>
        <button
          type="button"
          aria-label={closeLabel}
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-lg text-[var(--fp-color-text-muted)] transition hover:bg-[var(--fp-color-elevated)] hover:text-[var(--fp-color-text)]"
        >
          <span aria-hidden="true" className="text-xl leading-none">
            ×
          </span>
        </button>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <footer className="flex flex-wrap justify-end gap-3 border-t border-[var(--fp-border-subtle)] px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
