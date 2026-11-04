import { describe, expect, it } from "vitest";
import { TEXTES_ACCUEIL } from "./accueil-textes";

describe("textes de l'accueil", () => {
  it("sont tous renseignés", () => {
    for (const [nom, texte] of Object.entries(TEXTES_ACCUEIL)) expect(texte.length, nom).toBeGreaterThan(8);
  });
});
