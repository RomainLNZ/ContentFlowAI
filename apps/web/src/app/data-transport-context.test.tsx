import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { DataTransport } from "@/lib/data-transport";
import { DataTransportProvider, useDataTransport } from "./data-transport-context";

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
});
