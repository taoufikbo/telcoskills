import { describe, expect, it } from "vitest";
import { calculerVisiteur } from "./etat";

describe("calculerVisiteur", () => {
  it("inconnu tant que le stockage n'est pas lu, même avec des signaux", () =>
    expect(calculerVisiteur({ pret: false, progression: true, parcours: true })).toBe("inconnu"));
  it("nouveau sans aucune trace", () => expect(calculerVisiteur({ pret: true, progression: false, parcours: false })).toBe("nouveau"));
  it("revenant avec de la progression", () => expect(calculerVisiteur({ pret: true, progression: true, parcours: false })).toBe("revenant"));
  it("revenant avec des réponses au diagnostic", () => expect(calculerVisiteur({ pret: true, progression: false, parcours: true })).toBe("revenant"));
});
