import { describe, expect, it } from "vitest";
import { competenceLd, filAriane, roadmapLd } from "./donneesStructurees";
import { chargerRoadmaps } from "./roadmaps";

const roadmap = chargerRoadmaps()[0];

describe("données structurées", () => {
  it("numérote le fil d'Ariane à partir de 1 avec des adresses absolues", () => {
    const ld = filAriane([
      { nom: "Accueil", chemin: "/" },
      { nom: "Roadmap", chemin: "/x" },
    ]);
    expect(ld.itemListElement.map((i) => i.position)).toEqual([1, 2]);
    expect(ld.itemListElement[1].item).toMatch(/^https?:\/\/.+\/x$/);
  });

  it("décrit une compétence avec sa roadmap", () => {
    const n = roadmap.noeuds[0];
    const ld = competenceLd(n, roadmap, `/${roadmap.id}/${n.id}`, `/${roadmap.id}`);
    expect(ld.name).toBe(n.titre);
    expect(ld.isPartOf.name).toBe(roadmap.titre);
  });

  it("liste toutes les compétences d'une roadmap", () => {
    const ld = roadmapLd(roadmap, `/${roadmap.id}`, (id) => `/${roadmap.id}/${id}`);
    expect(ld.hasPart).toHaveLength(roadmap.noeuds.length);
  });
});
