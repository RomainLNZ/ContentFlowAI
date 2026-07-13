import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";

const benefits = [
  "Une stratégie éditoriale toujours active",
  "Des contenus alignés avec votre marque",
  "Des recommandations utiles chaque jour",
];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08090c] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(124,58,237,.16),transparent_35%),radial-gradient(circle_at_90%_80%,rgba(37,99,235,.1),transparent_30%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.05fr_.95fr]">
        <section className="hidden flex-col justify-between border-r border-white/[.06] p-12 lg:flex xl:p-16">
          <Logo inverse />
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-xl"
          >
            <p className="mb-5 text-xs font-medium uppercase tracking-[.22em] text-violet-300">
              Votre communication, orchestrée
            </p>
            <h1 className="text-5xl font-medium leading-[1.08] tracking-[-.045em]">
              L’IA qui transforme vos idées en une présence qui compte.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-zinc-400">
              Planifiez, créez et améliorez votre communication depuis un espace pensé pour votre entreprise.
            </p>
            <ul className="mt-10 space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 text-sm text-zinc-300">
                  <CheckCircle2 className="size-4 text-violet-400" />
                  {benefit}
                </li>
              ))}
            </ul>
          </motion.div>
          <p className="text-xs text-zinc-600">© 2026 FlowPilot</p>
        </section>
        <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10">
          <div className="absolute left-5 top-6 lg:hidden">
            <Logo inverse />
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-md"
          >
            {children}
          </motion.div>
        </section>
      </div>
    </main>
  );
}
