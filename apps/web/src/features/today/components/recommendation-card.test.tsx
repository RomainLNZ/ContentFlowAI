import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { DirectorRecommendation } from "../today.types";
import { RecommendationCard } from "./recommendation-card";

const recommendation: DirectorRecommendation = {
  id: "recommendation-1",
  type: "EDITORIAL_GAP",
  status: "NEW",
  priority: "HIGH",
  confidence: 0.91,
  title: "Reprendre la parole cette semaine",
  summary: "Vous n’avez rien publié depuis huit jours.",
  rationale: "Votre cadence cible n’est plus respectée.",
  evidence: { facts: ["Dernière publication il y a 8 jours", "Cadence cible : 3 par semaine"] },
  suggestedAction: null,
  campaignId: null,
  contentId: null,
  objectiveType: null,
  suggestedAt: null,
  expiresAt: null,
  createdAt: "2026-07-15T08:00:00.000Z",
};

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe("RecommendationCard", () => {
  it("explique la recommandation et signale sa lecture", () => {
    const onView = vi.fn();
    render(
      <RecommendationCard
        recommendation={recommendation}
        onView={onView}
        onAccept={vi.fn()}
        onDismiss={vi.fn()}
        onAction={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /pourquoi/i }));

    expect(screen.getByText("Dernière publication il y a 8 jours")).toBeInTheDocument();
    expect(screen.getByText("91%")).toBeInTheDocument();
    expect(onView).toHaveBeenCalledWith(recommendation);
  });

  it("rend les actions principales immédiatement accessibles", () => {
    const onAction = vi.fn();
    const onAccept = vi.fn();
    const onDismiss = vi.fn();
    render(
      <RecommendationCard
        recommendation={recommendation}
        onView={vi.fn()}
        onAccept={onAccept}
        onDismiss={onDismiss}
        onAction={onAction}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /traiter maintenant/i }));
    fireEvent.click(screen.getByRole("button", { name: /^accepter$/i }));
    fireEvent.click(screen.getByRole("button", { name: /ignorer cette recommandation/i }));

    expect(onAction).toHaveBeenCalledWith(recommendation);
    expect(onAccept).toHaveBeenCalledWith(recommendation);
    expect(onDismiss).toHaveBeenCalledWith(recommendation);
  });
});
