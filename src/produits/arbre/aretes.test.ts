import type { Edge } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { calculerDisposition } from "@/lib/layout";
import { chargerRoadmaps } from "@/lib/roadmaps";
import { aretesArbre, idEntete } from "./aretes";

const roadmap = chargerRoadmaps()[0];
const disposition = calculerDisposition(roadmap);
const parType = (aretes: Edge[], prefixe: string) => aretes.filter((a) => a.id.startsWith(prefixe));

describe("aretesArbre", () => {
  it("sans sélection : un tronc entre blocs successifs, une branche par compétence, aucun prérequis", () => {
    const a = aretesArbre(roadmap, disposition, null, null);
    expect(parType(a, "tronc-")).toHaveLength(roadmap.blocs.length - 1);
    expect(parType(a, "branche-")).toHaveLength(roadmap.noeuds.length);
    expect(parType(a, "prerequis-")).toHaveLength(0);
    for (const b of parType(a, "branche-"))
      expect(b.source).toBe(idEntete(roadmap.noeuds.find((n) => n.id === b.target)!.bloc));
  });
  it("avec une sélection : exactement ses prérequis et ce qui en dépend", () => {
    const sel = roadmap.noeuds.find((n) => n.prerequis.length > 0)!;
    const attendu = roadmap.noeuds.flatMap((n) => n.prerequis.filter((p) => n.id === sel.id || p === sel.id).map((p) => `prerequis-${p}->${n.id}`));
    expect(parType(aretesArbre(roadmap, disposition, sel.id, null), "prerequis-").map((a) => a.id).sort()).toEqual(attendu.sort());
  });
  it("atténue les branches hors du chemin conseillé", () => {
    const id = roadmap.noeuds[0].id;
    const branches = parType(aretesArbre(roadmap, disposition, null, new Set([id])), "branche-");
    for (const b of branches) expect(b.style?.opacity).toBe(b.id === `branche-${id}` ? 1 : 0.2);
  });
});
