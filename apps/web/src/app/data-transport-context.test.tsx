import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { DataTransport } from "@/lib/data-transport";
import type { Authentication } from "@/lib/authentication";
import { createHttpDataTransport, DataTransportProvider, useDataTransport } from "./data-transport-context";

describe("DataTransportProvider", () => {
  it("expose le transport injecté aux consommateurs", async () => {
    const request = vi.fn().mockResolvedValue({ ok: true });
    const transport = { request } as DataTransport;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DataTransportProvider transport={transport}>{children}</DataTransportProvider>
    );

    const { result } = renderHook(() => useDataTransport(), { wrapper });
    const tenant = { organizationId: "organization-a", workspaceId: "workspace-a" };

    await expect(result.current.request("/v1/example", { method: "POST" }, tenant)).resolves.toEqual({
      ok: true,
    });
    expect(request).toHaveBeenCalledWith("/v1/example", { method: "POST" }, tenant);
  });

  it("refuse une utilisation hors provider", () => {
    expect(() => renderHook(() => useDataTransport())).toThrow(
      "useDataTransport doit être utilisé dans DataTransportProvider",
    );
  });

  it("obtient le jeton via l’interface d’authentification", async () => {
    const authentication = {
      configured: true,
      getSession: vi.fn().mockResolvedValue({
        accessToken: "injected-token",
        user: { id: "user-a", userMetadata: {} },
      }),
      onAuthStateChange: vi.fn().mockReturnValue(vi.fn()),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      requestPasswordReset: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      updatePassword: vi.fn(),
      signOut: vi.fn(),
    } satisfies Authentication;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: { ok: true } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(createHttpDataTransport(authentication).request("/v1/example")).resolves.toEqual({ ok: true });

    expect(authentication.getSession).toHaveBeenCalledOnce();
    expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get("authorization")).toBe(
      "Bearer injected-token",
    );
    fetchMock.mockRestore();
  });
});
