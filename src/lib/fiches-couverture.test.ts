import { execFileSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Recette de contenu (EX-02 à EX-07, EX-15) : le script de couverture sort en erreur au moindre écart.
describe("couverture des fiches pédagogiques", () => {
  it("chaque compétence a une fiche conforme à la règle éditoriale", () => {
    const script = path.resolve(__dirname, "../../scripts/couverture-fiches.mjs");
    const sortie = execFileSync("node", [script], { encoding: "utf8" });
    expect(sortie).toContain("Avec fiche : ");
    expect(sortie).toContain("Écarts à la règle éditoriale : 0");
  });
});
