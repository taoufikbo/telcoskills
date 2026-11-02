import { describe, expect, it } from "vitest";
import { lienVisible, rubriqueDe, type Sections } from "./sections";

const rien: Sections = { analyses: false, frameworks: false, offres: false, contact: false, newsletter: false, diagnosticEquipe: false };

describe("visibilité des rubriques", () => {
  it("masque chaque rubrique non prête, et elle seule", () => {
    for (const href of ["/analyses", "/frameworks", "/offres", "/contact", "/newsletter", "/diagnostic"]) {
      expect(lienVisible(rien, href), href).toBe(false);
      expect(lienVisible({ ...rien, [rubriqueDe(href)!]: true }, href), href).toBe(true);
    }
  });
  it("laisse toujours passer les pages sans condition de contenu", () => {
    for (const href of ["/", "/ressources", "/ressources/roadmaps", "/a-propos", "/mentions-legales", "/confidentialite"]) expect(lienVisible(rien, href), href).toBe(true);
  });
});
