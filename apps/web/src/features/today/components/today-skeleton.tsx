export function TodaySkeleton({ label = "Chargement de votre briefing" }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="animate-pulse pt-10">
      <div className="flex gap-5 border-y border-white/[0.07] py-3">
        <div className="h-3 w-28 rounded-full bg-white/[0.07]" />
        <div className="h-3 w-24 rounded-full bg-white/[0.06]" />
      </div>
      <div className="mt-8 h-80 rounded-[26px] border border-white/[0.08] bg-white/[0.035]" />
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="h-72 rounded-[26px] border border-white/[0.08] bg-white/[0.03]" />
        <div className="h-72 rounded-[26px] border border-white/[0.08] bg-white/[0.03]" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
