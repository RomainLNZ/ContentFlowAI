import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { buildDirectorCards } from "../director-card.model";
import type { DirectorRecommendation } from "../today.types";
import { RecommendationCard } from "./recommendation-card";

const recommendation: DirectorRecommendation = {
  id: "recommendation-1",
  type: "CALENDAR_SUGGESTION",
  status: "NEW",
  priority: "HIGH",
  confidence: 0.91,
  title: "Renforcez le milieu de semaine",
  summary: "Aucun contenu n’est prévu mercredi.",
  rationale: "Le calendrier présente un intervalle de cinq jours.",
  evidence: { facts: ["Mercredi est vide"] },
  suggestedAction: { label: "Planifier un contenu" },
  campaignId: null,
  contentId: null,
  objectiveType: null,
  suggestedAt: null,
  expiresAt: null,
  createdAt: new Date().toISOString(),
};

describe("RecommendationCard", () => {
  it("affiche la raison et déclenche l’action contextuelle", () => {
    const onAction = vi.fn();
    const card = buildDirectorCards([recommendation])[0]!;

    render(
      <RecommendationCard
        card={card}
        onAction={onAction}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByText("Pourquoi maintenant")).toBeInTheDocument();
    expect(screen.getByText(recommendation.rationale)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Planifier un contenu" }));
    expect(onAction).toHaveBeenCalledWith(card);
  });

  it("permet d’ignorer le signal sans masquer son explication", () => {
    const onDismiss = vi.fn();
    const card = buildDirectorCards([recommendation])[0]!;

    render(<RecommendationCard card={card} onAction={vi.fn()} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole("button", { name: "Ignorer cette recommandation" }));
    expect(onDismiss).toHaveBeenCalledWith(recommendation.id);
    expect(screen.getByText(recommendation.rationale)).toBeInTheDocument();
  });
});
