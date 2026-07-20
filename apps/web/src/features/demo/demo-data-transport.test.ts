import { describe, expect, it, vi } from "vitest";
import { DemoDataTransport, demoTenant } from "./demo-data-transport";

describe("DemoDataTransport", () => {
  it("fournit un espace de démonstration cohérent sans réseau", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const transport = new DemoDataTransport();

    const me = await transport.request<{ user: { fullName: string }; memberships: unknown[] }>("/v1/me");
    const campaigns = await transport.request<Array<{ id: string }>>("/v1/campaigns", {}, demoTenant);
    const contents = await transport.request<{ items: Array<{ campaignId?: string | null }> }>(
      "/v1/content",
      {},
      demoTenant,
    );
    const director = await transport.request<{ topRecommendations: unknown[] }>(
      "/v1/director/overview",
      {},
      demoTenant,
    );
    const brand = await transport.request<{ productsServices: string[] }>(
      "/v1/brand-profile",
      {},
      demoTenant,
    );

    expect(me.user.fullName).toBe("Alix Martin");
    expect(me.memberships).toHaveLength(1);
    expect(campaigns.length).toBeGreaterThanOrEqual(3);
    expect(contents.items.some((item) => campaigns.some((campaign) => campaign.id === item.campaignId))).toBe(
      true,
    );
    expect(director.topRecommendations.length).toBeGreaterThanOrEqual(3);
    expect(brand.productsServices).not.toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockRestore();
  });

  it("conserve les mutations uniquement dans son store mémoire", async () => {
    const transport = new DemoDataTransport();
    const created = await transport.request<{ id: string; title: string }>(
      "/v1/content",
      { method: "POST", body: JSON.stringify({ title: "Nouveau contenu", body: "Corps" }) },
      demoTenant,
    );
    const loaded = await transport.request<{ id: string; title: string }>(
      `/v1/content/${created.id}`,
      {},
      demoTenant,
    );

    expect(loaded.title).toBe("Nouveau contenu");
  });
});
