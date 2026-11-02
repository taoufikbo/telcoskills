import { describe, expect, it } from "vitest";
import { libelleProvenance, moisLisible } from "./provenance";
import { chargerRoadmaps } from "./roadmaps";

describe("provenance", () => {
  it("formate le mois", () => expect(moisLisible("2026-10")).toBe("octobre 2026"));

  it("affiche effectif approximatif et date pour les offres", () => {
    expect(libelleProvenance({ type: "offres", nombre: 14, approximatif: true, date: "2026-10" })).toBe("Offres d'emploi · environ 14 offres · octobre 2026");
  });

  it("affiche « Éditoriale » sans offres", () => {
    expect(libelleProvenance({ type: "editoriale" })).toBe("Éditoriale");
    expect(libelleProvenance(undefined)).toBe("Éditoriale");
  });

  it("chaque roadmap déclare sa provenance, cohérente avec le champ demande", () => {
    for (const r of chargerRoadmaps()) {
      expect(r.provenance, r.id).toBeDefined();
      const aDemande = r.noeuds.some((n) => n.demande);
      expect(r.provenance?.type === "offres", `${r.id} : provenance et demande divergent`).toBe(aDemande);
    }
  });
});
