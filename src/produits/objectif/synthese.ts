import { ancetres, cheminCritique, etats, type Cheminement, type EtatNoeud } from "@/lib/objectif";
import type { Noeud, Roadmap } from "@/lib/schema";
import type { Progression } from "@/produits/progression";

export type SyntheseObjectif = {
  cible: Noeud | undefined;
  /** La cible et tous ses prérequis, transitivement. */
  ids: Set<string>;
  membres: Noeud[];
  etat: Map<string, EtatNoeud>;
  critique: Cheminement | null;
  surCritique: Set<string>;
  parId: Map<string, Noeud>;
  /** Compétences dont rien ne dépend : les objectifs proposés en exemple. */
  puits: Noeud[];
  stats: { total: number; acquis: number; disponibles: Noeud[] };
};

/** Tout ce que la vue « Objectif » affiche, calculé d'un coup à partir de la roadmap, de la cible et de la progression. Pure. */
export function syntheseObjectif(roadmap: Roadmap, cibleId: string | null, progression: Progression): SyntheseObjectif {
  const cible = cibleId ? roadmap.noeuds.find((n) => n.id === cibleId) : undefined;
  const ids = cible ? ancetres(roadmap, cible.id) : new Set<string>();
  const membres = roadmap.noeuds.filter((n) => ids.has(n.id));
  const etat = etats(roadmap, ids, progression);
  const critique = cible ? cheminCritique(roadmap, cible.id, progression) : null;
  const prerequis = new Set(roadmap.noeuds.flatMap((n) => n.prerequis));
  const valeurs = [...etat.values()];
  return {
    cible,
    ids,
    membres,
    etat,
    critique,
    surCritique: new Set(critique?.chemin ?? []),
    parId: new Map(roadmap.noeuds.map((n) => [n.id, n])),
    puits: roadmap.noeuds.filter((n) => !prerequis.has(n.id)),
    stats: { total: valeurs.length, acquis: valeurs.filter((e) => e === "acquis").length, disponibles: membres.filter((n) => etat.get(n.id) === "disponible") },
  };
}
