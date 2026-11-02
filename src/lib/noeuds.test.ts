import { describe, expect, it } from "vitest";
import { chargerOrientation } from "./orientation";
import { dependants, occurrencesDuNoeud, roadmapDeReference } from "./noeuds";
import { chargerRoadmaps } from "./roadmaps";

const roadmaps = chargerRoadmaps();
const ordre = chargerOrientation().ordre;

describe("nœuds partagés entre roadmaps", () => {
  it("trouve toutes les occurrences d'un nœud partagé, dans l'ordre d'affichage", () => {
    const occurrences = occurrencesDuNoeud(roadmaps, "gitops", ordre);
    expect(occurrences.map((o) => o.roadmap.id)).toEqual(ordre.filter((id) => roadmaps.find((r) => r.id === id)?.noeuds.some((n) => n.id === "gitops")));
    expect(occurrences.length).toBeGreaterThan(1);
  });

  it("choisit la première roadmap de l'ordre d'affichage comme référence", () => {
    expect(roadmapDeReference(roadmaps, "gitops", ordre)).toBe(occurrencesDuNoeud(roadmaps, "gitops", ordre)[0].roadmap.id);
  });

  it("donne une référence à chaque nœud de chaque roadmap", () => {
    for (const r of roadmaps) for (const n of r.noeuds) expect(roadmapDeReference(roadmaps, n.id, ordre), `${r.id}/${n.id}`).toBeDefined();
  });

  it("ne renvoie rien pour un nœud inconnu", () => {
    expect(roadmapDeReference(roadmaps, "inconnu", ordre)).toBeUndefined();
  });

  it("retrouve les nœuds qui dépendent d'un autre", () => {
    const r = roadmaps[0];
    const n = r.noeuds.find((x) => x.prerequis.length > 0)!;
    const prerequis = n.prerequis[0];
    expect(dependants(r, prerequis).map((x) => x.id)).toContain(n.id);
  });
});
