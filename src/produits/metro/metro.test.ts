import { describe, expect, it } from "vitest";
import { calculerMetro } from "./metro";
import { chargerRoadmaps } from "@/lib/roadmaps";

describe.each(chargerRoadmaps().map((r) => [r.id, r] as const))("calculerMetro (%s)", (_id, r) => {
  const m = calculerMetro(r);

  it("place chaque nœud une fois, sans superposition", () => {
    expect(m.stations.size).toBe(r.noeuds.length);
    expect(new Set([...m.stations.values()].map((s) => `${s.x}:${s.y}`)).size).toBe(r.noeuds.length);
  });

  it("met chaque station sur la ligne de son bloc", () => {
    for (const n of r.noeuds) expect(m.stations.get(n.id)!.ligne).toBe(r.blocs.indexOf(n.bloc));
    expect(m.lignes.map((l) => l.bloc)).toEqual(r.blocs);
    expect(m.lignes.flatMap((l) => l.ids).length).toBe(r.noeuds.length);
  });

  it("place un prérequis strictement à gauche de son dépendant, sur toutes les lignes", () => {
    for (const n of r.noeuds) for (const p of n.prerequis) expect(m.stations.get(p)!.x).toBeLessThan(m.stations.get(n.id)!.x);
  });

  it("marque comme correspondance les deux bouts d'un prérequis entre lignes", () => {
    for (const n of r.noeuds)
      for (const p of n.prerequis)
        if (p && r.noeuds.find((x) => x.id === p)!.bloc !== n.bloc) {
          expect(m.correspondances.has(p)).toBe(true);
          expect(m.correspondances.has(n.id)).toBe(true);
        }
  });
});
