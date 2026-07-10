import { Sparkles } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2.5 font-semibold tracking-tight text-white">
      <span className="grid size-9 place-items-center rounded-xl border border-violet-300/20 bg-gradient-to-br from-violet-500 to-indigo-700 shadow-[0_0_28px_rgba(124,58,237,.3)]">
        <Sparkles className="size-4" aria-hidden="true" />
      </span>
      <span>
        CommunicationOS <span className="text-zinc-500">AI</span>
      </span>
    </div>
  );
}
