// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Dialog } from "./dialog";
import { EmptyState } from "./empty-state";
import { StatusBadge } from "./status-badge";
import { ToastProvider, useToast } from "./toast";

beforeAll(() => {
  window.requestAnimationFrame = (callback) => window.setTimeout(callback, 0);
});

describe("Beta Polish foundations", () => {
  it("rend un état vide qui explique la prochaine étape et son bénéfice", () => {
    render(
      <EmptyState
        title="Votre calendrier est prêt"
        description="Planifiez votre premier contenu."
        benefit="Le Director pourra équilibrer votre cadence."
        primaryAction={<button>Planifier</button>}
      />,
    );
    expect(screen.getByRole("heading", { name: "Votre calendrier est prêt" })).toBeVisible();
    expect(screen.getByText(/équilibrer votre cadence/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Planifier" })).toBeEnabled();
  });

  it("expose le statut sans dépendre d'un contrat métier", () => {
    render(
      <StatusBadge tone="warning" dot>
        À valider
      </StatusBadge>,
    );
    expect(screen.getByText("À valider")).toBeVisible();
  });

  it("ferme le dialogue avec Échap", () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange} title="Archiver">
        <p>Confirmation</p>
      </Dialog>,
    );
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("publie et ferme une notification accessible", () => {
    function Trigger() {
      const { toast } = useToast();
      return (
        <button onClick={() => toast({ title: "Brouillon enregistré", tone: "success" })}>Notifier</button>
      );
    }
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Notifier" }));
    expect(screen.getByRole("status")).toHaveTextContent("Brouillon enregistré");
    fireEvent.click(screen.getByRole("button", { name: "Fermer la notification" }));
    expect(screen.queryByText("Brouillon enregistré")).not.toBeInTheDocument();
  });
});
