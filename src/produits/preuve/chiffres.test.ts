import { describe, expect, it } from "vitest";
import { chargerProjets } from "@/lib/projets";
import { chargerRoadmaps } from "@/lib/roadmaps";
import { chiffresCatalogue } from "./chiffres";

describe("chiffresCatalogue", () => {
  it("chaque chiffre a une source et une valeur positive", () => {
    const c = chiffresCatalogue({ roadmaps: chargerRoadmaps(), projets: chargerProjets() });
    expect(c.length).toBeGreaterThan(0);
    for (const x of c) {
      expect(x.valeur).toBeGreaterThan(0);
      expect(x.source.length).toBeGreaterThan(0);
    }
  });
  it("une compétence partagée et une ressource citée deux fois ne comptent qu'une fois", () => {
    const n = (id: string, url: string) => ({ id, ressources: [{ url }, { url: null }] });
    const c = chiffresCatalogue({ roadmaps: [{ noeuds: [n("a", "u1"), n("b", "u1")] }, { noeuds: [n("a", "u2")] }], projets: [] });
    expect(Object.fromEntries(c.map((x) => [x.libelle, x.valeur]))).toEqual({ "parcours par métier": 2, "compétences cartographiées": 2, "ressources avec lien": 2 });
  });
  it("un catalogue vide ne produit aucun chiffre (le bloc se masque)", () => expect(chiffresCatalogue({ roadmaps: [], projets: [] })).toEqual([]));
});
