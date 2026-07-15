import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";

export type ToastTone = "neutral" | "success" | "warning" | "danger";
export type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
  action?: ReactNode;
};
type ToastItem = ToastInput & { id: number };
type ToastContextValue = { toast: (input: ToastInput) => number; dismiss: (id: number) => void };

const ToastContext = createContext<ToastContextValue | null>(null);
const toneClass: Record<ToastTone, string> = {
  neutral: "border-[var(--fp-border-subtle)]",
  success: "border-emerald-400/30",
  warning: "border-amber-400/30",
  danger: "border-rose-400/30",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const dismiss = useCallback(
    (id: number) => setItems((current) => current.filter((item) => item.id !== id)),
    [],
  );
  const toast = useCallback(
    (input: ToastInput) => {
      const id = ++nextId.current;
      setItems((current) => [...current, { ...input, id }]);
      window.setTimeout(() => dismiss(id), input.duration ?? 5_000);
      return id;
    },
    [dismiss],
  );
  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-label="Notifications de l’application"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[120] flex flex-col items-end gap-3 sm:left-auto sm:w-96"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role={item.tone === "danger" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto w-full rounded-2xl border bg-[var(--fp-color-surface)] p-4 text-[var(--fp-color-text)] shadow-2xl",
              toneClass[item.tone ?? "neutral"],
            )}
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <strong className="text-sm font-semibold">{item.title}</strong>
                {item.description && (
                  <p className="mt-1 text-sm leading-5 text-[var(--fp-color-text-secondary)]">
                    {item.description}
                  </p>
                )}
                {item.action && <div className="mt-3">{item.action}</div>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Fermer la notification"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--fp-color-text-muted)] hover:bg-[var(--fp-color-elevated)]"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast doit être utilisé dans ToastProvider");
  return context;
}
