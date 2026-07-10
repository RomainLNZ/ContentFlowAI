import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/env";
import { signIn } from "../api/auth.api";
import { AuthShell } from "../components/auth-shell";
import { FormField } from "../components/form-field";
import { signInSchema, type SignInValues } from "../schemas/auth.schema";

export function SignInPage() {
  const navigate = useNavigate();
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });
  const mutation = useMutation({ mutationFn: signIn, onSuccess: () => navigate("/app") });

  return (
    <AuthShell>
      <div className="rounded-3xl border border-white/[.08] bg-white/[.025] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-9">
        <header>
          <h2 className="text-2xl font-semibold tracking-tight">Heureux de vous revoir</h2>
          <p className="mt-2 text-sm text-zinc-500">Connectez-vous pour piloter votre communication.</p>
        </header>
        {!isSupabaseConfigured && (
          <p
            role="status"
            className="mt-5 rounded-xl border border-amber-300/10 bg-amber-300/[.06] p-3 text-xs text-amber-200"
          >
            Configuration locale requise : copiez <code>.env.example</code> vers <code>.env</code>.
          </p>
        )}
        <form
          className="mt-7 space-y-5"
          onSubmit={(event) => void form.handleSubmit((values) => mutation.mutate(values))(event)}
          noValidate
        >
          <FormField
            id="email"
            label="Email professionnel"
            type="email"
            autoComplete="email"
            placeholder="vous@entreprise.fr"
            error={form.formState.errors.email?.message}
            {...form.register("email")}
          />
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-zinc-300">
                Mot de passe
              </label>
              <Link className="text-xs text-zinc-500 transition hover:text-white" to="/forgot-password">
                Mot de passe oublié ?
              </Link>
            </div>
            <FormField
              id="password"
              label=""
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={form.formState.errors.password?.message}
              {...form.register("password")}
            />
          </div>
          {mutation.error && (
            <p role="alert" className="text-sm text-rose-400">
              Connexion impossible. Vérifiez vos identifiants.
            </p>
          )}
          <Button className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <>
                Se connecter <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
        <p className="mt-7 text-center text-sm text-zinc-500">
          Nouveau sur CommunicationOS ?{" "}
          <Link className="font-medium text-zinc-200 hover:text-white" to="/sign-up">
            Créer un compte
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
