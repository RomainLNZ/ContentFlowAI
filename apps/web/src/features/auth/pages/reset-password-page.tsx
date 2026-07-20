import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthentication } from "../auth-context";

export function ResetPasswordPage() {
  const authentication = useAuthentication();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const code = new URLSearchParams(window.location.search).get("code");
  const [ready, setReady] = useState(!code);

  useEffect(() => {
    if (!code) return;
    void authentication
      .exchangeCodeForSession(code)
      .then(() => setReady(true))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Lien invalide."));
  }, [authentication, code]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await authentication.updatePassword(password);
      navigate("/app", { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Mise à jour impossible.");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#08090c] px-6 text-zinc-100">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8"
      >
        <h1 className="text-3xl font-semibold">Nouveau mot de passe</h1>
        {!ready && !error && <p className="mt-6 text-sm text-zinc-400">Validation du lien sécurisé…</p>}
        {ready && (
          <label className="mt-6 block text-sm text-zinc-300">
            Mot de passe
            <input
              type="password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3"
            />
          </label>
        )}
        {error && (
          <p className="mt-4 text-sm text-red-300" role="alert">
            {error}
          </p>
        )}
        <button
          disabled={!ready}
          className="mt-6 w-full rounded-xl bg-violet-500 px-5 py-3 font-medium disabled:opacity-40"
        >
          Enregistrer
        </button>
      </form>
    </main>
  );
}
