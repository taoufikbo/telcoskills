import { describe, expect, it } from "vitest";
import { TEXTES_ACCUEIL } from "./accueil-textes";

describe("textes de l'accueil", () => {
  it("sont tous renseignés", () => {
    const { contact, ...autres } = TEXTES_ACCUEIL;
    for (const [nom, texte] of Object.entries({ ...autres, ...contact })) expect(texte.length, nom).toBeGreaterThan(8);
  });
});
