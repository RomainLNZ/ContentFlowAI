import { Sparkles } from "lucide-react";

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2.5 font-semibold tracking-tight ${inverse ? "text-white" : "text-[var(--ink)]"}`}
    >
      <span className="relative grid size-9 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 via-violet-600 to-pink-400 text-white shadow-[0_0_28px_rgba(124,58,237,.3)]">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,.6),transparent_25%)]" />
        <Sparkles className="relative size-4" aria-hidden="true" />
      </span>
      <span>
        Communication<span className="font-normal text-violet-500">OS</span>
      </span>
    </div>
  );
}
