import type { Noeud, Roadmap } from "./schema";

export type OccurrenceNoeud = { roadmap: Roadmap; noeud: Noeud };

/**
 * Un nœud est partagé entre plusieurs roadmaps (même identifiant). Retourne toutes ses occurrences,
 * classées selon `ordre` (ordre d'affichage des roadmaps), puis par identifiant de roadmap.
 */
export function occurrencesDuNoeud(roadmaps: Roadmap[], noeudId: string, ordre: string[] = []): OccurrenceNoeud[] {
  const rang = (id: string) => {
    const i = ordre.indexOf(id);
    return i === -1 ? ordre.length : i;
  };
  return roadmaps
    .flatMap((roadmap) => roadmap.noeuds.filter((n) => n.id === noeudId).map((noeud) => ({ roadmap, noeud })))
    .sort((a, b) => rang(a.roadmap.id) - rang(b.roadmap.id) || a.roadmap.id.localeCompare(b.roadmap.id));
}

/** Roadmap de référence d'un nœud partagé : c'est vers elle que pointe la `canonical` des autres pages. */
export function roadmapDeReference(roadmaps: Roadmap[], noeudId: string, ordre: string[] = []): string | undefined {
  return occurrencesDuNoeud(roadmaps, noeudId, ordre)[0]?.roadmap.id;
}

/** Nœuds de la roadmap qui ont `noeudId` pour prérequis. */
export function dependants(roadmap: Roadmap, noeudId: string): Noeud[] {
  return roadmap.noeuds.filter((n) => n.prerequis.includes(noeudId));
}
