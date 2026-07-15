import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link } from "react-router-dom";
import { Button, Input } from "@flowpilot/ui";
import { authErrorMessage, signUp } from "../api/auth.api";
import { AuthShell } from "../components/auth-shell";
import { FormField } from "../components/form-field";
import { passwordStrength, signUpSchema, type SignUpValues } from "../schemas/auth.schema";

export function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    criteriaMode: "all",
    defaultValues: {
      fullName: "",
      organizationName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });
  const password = useWatch({ control: form.control, name: "password" });
  const strength = passwordStrength(password);
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
            label="Nom de l’organisation"
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
          <div className="space-y-2 text-sm font-medium text-zinc-300">
            <label htmlFor="password">Mot de passe</label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="10 caractères, majuscule et chiffre"
                aria-invalid={Boolean(form.formState.errors.password)}
                aria-describedby="password-help password-error"
                className="pr-12"
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-500 hover:text-zinc-200"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <div id="password-help" aria-live="polite">
              <div className="grid grid-cols-4 gap-1" aria-hidden="true">
                {[1, 2, 3, 4].map((level) => (
                  <span
                    key={level}
                    className={`h-1 rounded-full ${strength.score >= level ? strength.color : "bg-white/[0.07]"}`}
                  />
                ))}
              </div>
              {strength.label && (
                <p className="mt-1 text-xs font-normal text-zinc-500">
                  Robustesse : <span className="text-zinc-300">{strength.label}</span>
                </p>
              )}
            </div>
            {form.formState.errors.password && (
              <p id="password-error" role="alert" className="text-xs font-normal text-rose-400">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
          <div className="space-y-2 text-sm font-medium text-zinc-300">
            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmation ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Saisissez à nouveau votre mot de passe"
                aria-invalid={Boolean(form.formState.errors.confirmPassword)}
                aria-describedby={form.formState.errors.confirmPassword ? "confirmPassword-error" : undefined}
                className="pr-12"
                {...form.register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmation((value) => !value)}
                aria-label={showConfirmation ? "Masquer la confirmation" : "Afficher la confirmation"}
                aria-pressed={showConfirmation}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-500 hover:text-zinc-200"
              >
                {showConfirmation ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {form.formState.errors.confirmPassword && (
              <p id="confirmPassword-error" role="alert" className="text-xs font-normal text-rose-400">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
          <label className="flex items-start gap-3 text-xs leading-5 text-zinc-500">
            <input
              id="acceptTerms"
              type="checkbox"
              aria-invalid={Boolean(form.formState.errors.acceptTerms)}
              aria-describedby={form.formState.errors.acceptTerms ? "acceptTerms-error" : undefined}
              className="mt-1 size-4 accent-violet-500"
              {...form.register("acceptTerms")}
            />
            <span>J’accepte les conditions d’utilisation et la politique de confidentialité.</span>
          </label>
          {form.formState.errors.acceptTerms && (
            <p id="acceptTerms-error" role="alert" className="text-xs text-rose-400">
              {form.formState.errors.acceptTerms.message}
            </p>
          )}
          {mutation.error && (
            <p role="alert" className="text-sm text-rose-400">
              {authErrorMessage(mutation.error, "sign-up")}
            </p>
          )}
          <Button type="submit" className="mt-2 w-full" disabled={mutation.isPending}>
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
