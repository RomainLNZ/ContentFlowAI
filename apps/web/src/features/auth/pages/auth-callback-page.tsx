import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthentication } from "../auth-context";

export function AuthCallbackPage() {
  const authentication = useAuthentication();
  const navigate = useNavigate();
  const code = new URLSearchParams(window.location.search).get("code");
  const [error, setError] = useState<string | undefined>(() =>
    code ? undefined : "Le code de connexion est absent ou expiré.",
  );

  useEffect(() => {
    if (!code) return;
    void authentication
      .exchangeCodeForSession(code)
      .then(() => navigate("/app", { replace: true }))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Lien invalide."));
  }, [authentication, code, navigate]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#08090c] px-6 text-zinc-200">
      <p role={error ? "alert" : "status"}>{error ?? "Validation de votre connexion…"}</p>
    </main>
  );
}
