import { describe, expect, it } from "vitest";
import { chargerProjets } from "./projets";
import { chargerRoadmaps } from "./roadmaps";
import { parcoursMetier, RUBRIQUES_THEMATIQUES, rubriqueThematique } from "./rubriques";
import { chiffresCatalogue } from "@/produits/preuve";

describe("parcours thématiques, à part des parcours métier", () => {
  const roadmaps = chargerRoadmaps();
  it("chaque rubrique thématique correspond à une roadmap de type « competence », et réciproquement", () => {
    for (const id of Object.keys(RUBRIQUES_THEMATIQUES)) expect(roadmaps.find((r) => r.id === id)?.type, id).toBe("competence");
    for (const r of roadmaps.filter((x) => x.type === "competence")) expect(rubriqueThematique(r.id), r.id).not.toBeNull();
  });
  it("les décomptes « par métier » n'incluent pas les parcours thématiques", () => {
    const metier = parcoursMetier(roadmaps).length;
    expect(metier).toBeLessThan(roadmaps.length);
    const c = chiffresCatalogue({ roadmaps, projets: chargerProjets() }).find((x) => x.libelle === "parcours par métier");
    expect(c?.valeur).toBe(metier);
  });
});
