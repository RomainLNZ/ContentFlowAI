import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Button } from "@flowpilot/ui";
import { signUp } from "../api/auth.api";
import { AuthShell } from "../components/auth-shell";
import { FormField } from "../components/form-field";
import { signUpSchema, type SignUpValues } from "../schemas/auth.schema";

export function SignUpPage() {
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      organizationName: "",
      email: "",
      password: "",
      acceptTerms: false as never,
    },
  });
  const mutation = useMutation({ mutationFn: signUp });
  if (mutation.isSuccess)
    return (
      <AuthShell>
        <div className="rounded-3xl border border-white/[.08] bg-white/[.025] p-9 text-center">
          <span className="text-4xl">✦</span>
          <h2 className="mt-5 text-2xl font-semibold">Vérifiez votre messagerie</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Un lien sécurisé vient de vous être envoyé pour activer votre espace.
          </p>
        </div>
      </AuthShell>
    );
  return (
    <AuthShell>
      <div className="rounded-3xl border border-white/[.08] bg-white/[.025] p-6 backdrop-blur-xl sm:p-9">
        <header>
          <h2 className="text-2xl font-semibold tracking-tight">Créez votre espace</h2>
          <p className="mt-2 text-sm text-zinc-500">Quelques informations pour préparer votre FlowPilot.</p>
        </header>
        <form
          className="mt-7 grid gap-4"
          onSubmit={(event) => void form.handleSubmit((values) => mutation.mutate(values))(event)}
          noValidate
        >
          <FormField
            id="fullName"
            label="Nom complet"
            autoComplete="name"
            placeholder="Marie Dupont"
            error={form.formState.errors.fullName?.message}
            {...form.register("fullName")}
          />
          <FormField
            id="organizationName"
            label="Entreprise"
            autoComplete="organization"
            placeholder="Atelier Horizon"
            error={form.formState.errors.organizationName?.message}
            {...form.register("organizationName")}
          />
          <FormField
            id="email"
            label="Email professionnel"
            type="email"
            autoComplete="email"
            placeholder="marie@horizon.fr"
            error={form.formState.errors.email?.message}
            {...form.register("email")}
          />
          <FormField
            id="password"
            label="Mot de passe"
            type="password"
            autoComplete="new-password"
            placeholder="8 caractères minimum"
            error={form.formState.errors.password?.message}
            {...form.register("password")}
          />
          <label className="flex items-start gap-3 text-xs leading-5 text-zinc-500">
            <input type="checkbox" className="mt-1 accent-violet-500" {...form.register("acceptTerms")} />
            <span>J’accepte les conditions d’utilisation et la politique de confidentialité.</span>
          </label>
          {form.formState.errors.acceptTerms && (
            <p role="alert" className="text-xs text-rose-400">
              {form.formState.errors.acceptTerms.message}
            </p>
          )}
          {mutation.error && (
            <p role="alert" className="text-sm text-rose-400">
              Création impossible. Cette adresse est peut-être déjà utilisée.
            </p>
          )}
          <Button className="mt-2 w-full" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <>
                Créer mon espace <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500">
          Déjà un compte ?{" "}
          <Link className="font-medium text-zinc-200" to="/sign-in">
            Se connecter
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
