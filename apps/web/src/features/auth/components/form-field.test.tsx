import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormField } from "./form-field";

describe("FormField", () => {
  it("relie le message d'erreur au champ", () => {
    render(<FormField id="email" label="Email" error="Adresse invalide" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Adresse invalide");
  });
});
