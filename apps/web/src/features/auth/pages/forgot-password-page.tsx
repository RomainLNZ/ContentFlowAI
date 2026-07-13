import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Button } from "@flowpilot/ui";
import { requestPasswordReset } from "../api/auth.api";
import { AuthShell } from "../components/auth-shell";
import { FormField } from "../components/form-field";
import { emailSchema, type ForgotPasswordValues } from "../schemas/auth.schema";

export function ForgotPasswordPage() {
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });
  const mutation = useMutation({ mutationFn: requestPasswordReset });
  return (
    <AuthShell>
      <div className="rounded-3xl border border-white/[.08] bg-white/[.025] p-6 backdrop-blur-xl sm:p-9">
        <h2 className="text-2xl font-semibold">Réinitialiser votre accès</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Nous vous enverrons un lien à usage unique. Le message reste volontairement identique, que le compte
          existe ou non.
        </p>
        {mutation.isSuccess ? (
          <div
            role="status"
            className="mt-7 rounded-xl border border-emerald-400/10 bg-emerald-400/[.06] p-4 text-sm text-emerald-200"
          >
            Si cette adresse correspond à un compte, le lien a été envoyé.
          </div>
        ) : (
          <form
            className="mt-7 space-y-5"
            onSubmit={(event) => void form.handleSubmit((values) => mutation.mutate(values))(event)}
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
            <Button className="w-full" disabled={mutation.isPending}>
              {mutation.isPending && <LoaderCircle className="size-4 animate-spin" />}Envoyer le lien
            </Button>
          </form>
        )}
        <Link
          to="/sign-in"
          className="mt-7 flex items-center justify-center gap-2 text-sm text-zinc-500 hover:text-white"
        >
          <ArrowLeft className="size-4" /> Retour à la connexion
        </Link>
      </div>
    </AuthShell>
  );
}
