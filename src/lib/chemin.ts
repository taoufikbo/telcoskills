import type { Roadmap } from "./schema";

/** Nœuds à forte demande, plus tous leurs prérequis (transitivement). */
export function cheminConseille(roadmap: Roadmap): Set<string> {
  const parId = new Map(roadmap.noeuds.map((n) => [n.id, n]));
  const chemin = new Set<string>();
  const pile = roadmap.noeuds.filter((n) => n.demande === "forte").map((n) => n.id);

  while (pile.length > 0) {
    const id = pile.pop()!;
    if (chemin.has(id)) continue;
    chemin.add(id);
    pile.push(...(parId.get(id)?.prerequis ?? []));
  }
  return chemin;
}
