import { createClient } from "@supabase/supabase-js";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDataTransport } from "@/app/data-transport-context";
import { AppProviders } from "@/app/providers";
import { useAuth } from "@/features/auth/auth-context";
import { DemoProvider } from "./demo-provider";

vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));

function Probe() {
  const auth = useAuth();
  const transport = useDataTransport();
  const [name, setName] = useState("");
  useEffect(() => {
    void transport.request<{ user: { fullName: string } }>("/v1/me").then((me) => setName(me.user.fullName));
  }, [transport]);
  return <p>{auth.loading ? "loading" : `${auth.user?.email} — ${name}`}</p>;
}

describe("DemoProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: true,
        media: "(prefers-color-scheme: dark)",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    );
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("injecte auth et données sans réseau ni initialisation Supabase", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    render(
      <DemoProvider>
        <Probe />
      </DemoProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText("alix@atelier-nova.demo — Alix Martin")).toBeInTheDocument(),
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
    fetchMock.mockRestore();
  });

  it("active la composition Démo complète depuis /demo sans initialiser Supabase", async () => {
    sessionStorage.clear();
    window.history.replaceState({}, "", "/demo");
    const fetchMock = vi.spyOn(globalThis, "fetch");

    render(
      <AppProviders>
        <Probe />
      </AppProviders>,
    );

    await waitFor(() =>
      expect(screen.getByText("alix@atelier-nova.demo — Alix Martin")).toBeInTheDocument(),
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("flowpilot-demo-mode")).toBe("active");
    fetchMock.mockRestore();
  });

  it("guide la découverte et permet de recommencer la visite", async () => {
    window.history.replaceState({}, "", "/app");
    render(
      <DemoProvider>
        <Probe />
      </DemoProvider>,
    );

    expect(screen.getByText("Votre communication, enfin réunie au même endroit.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Commencer$/i }));
    expect(screen.getByText("Commencez chaque journée avec les bonnes priorités.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /recommencer la visite/i }));
    expect(screen.getByText("Votre communication, enfin réunie au même endroit.")).toBeInTheDocument();
  });
});
