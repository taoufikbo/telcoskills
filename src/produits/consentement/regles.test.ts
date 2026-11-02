import { describe, expect, it } from "vitest";
import { VALIDITE_JOURS, lireChoix, serialiserChoix } from "./regles";
import { ajouterJours } from "@/lib/jour";

const J = "2026-11-02";

describe("choix de mesure d'audience", () => {
  it("aucun choix tant que rien n'est stocké ou lisible", () => {
    expect(lireChoix(null, J)).toBeNull();
    expect(lireChoix("pas du json", J)).toBeNull();
    expect(lireChoix(JSON.stringify({ choix: "peut-être", jour: J }), J)).toBeNull();
  });
  it("relit un accord et un refus", () => {
    expect(lireChoix(serialiserChoix("accepte", J), J)).toBe("accepte");
    expect(lireChoix(serialiserChoix("refuse", J), J)).toBe("refuse");
  });
  it("redemande après six mois, pas avant", () => {
    const brut = serialiserChoix("accepte", J);
    expect(lireChoix(brut, ajouterJours(J, VALIDITE_JOURS - 1))).toBe("accepte");
    expect(lireChoix(brut, ajouterJours(J, VALIDITE_JOURS))).toBeNull();
  });
});
