import type { Noeud, Roadmap } from "./schema";
import { statutDe, type Progression } from "@/produits/progression";

/** Ce dont le calcul du prochain pas a besoin : permet de l'appliquer à une liste allégée (page « Mon espace »). */
export type NoeudLeger = Pick<Noeud, "id" | "titre" | "bloc" | "niveau" | "prerequis"> & { resume?: string };
export type RoadmapLegere = { id: string; noeuds: NoeudLeger[] };

export type EtatNoeud = "acquis" | "disponible" | "verrouille" | "ignore";

/** L'objectif et tous ses prérequis, transitivement. */
export function ancetres(roadmap: Roadmap, cibleId: string): Set<string> {
  const parId = new Map(roadmap.noeuds.map((n) => [n.id, n]));
  const vus = new Set<string>();
  const pile = [cibleId];
  while (pile.length > 0) {
    const id = pile.pop()!;
    if (vus.has(id) || !parId.has(id)) continue;
    vus.add(id);
    pile.push(...parId.get(id)!.prerequis);
  }
  return vus;
}

/** Rang de chaque nœud : 0 sans prérequis, sinon 1 + le plus grand rang de ses prérequis (plus long chemin). */
export function rangs(noeuds: NoeudLeger[]): Map<string, number> {
  const parId = new Map(noeuds.map((n) => [n.id, n]));
  const rang = new Map<string, number>();
  const calc = (id: string): number => {
    const connu = rang.get(id);
    if (connu !== undefined) return connu;
    const r = Math.max(-1, ...parId.get(id)!.prerequis.filter((p) => parId.has(p)).map(calc)) + 1;
    rang.set(id, r);
    return r;
  };
  for (const n of noeuds) calc(n.id);
  return rang;
}

/** Acquis, disponible (tous les prérequis acquis ou ignorés), verrouillé, ou ignoré. */
export function etats(roadmap: RoadmapLegere, ids: Set<string>, prog: Progression): Map<string, EtatNoeud> {
  const res = new Map<string, EtatNoeud>();
  const resolu = (id: string) => ["maitrise", "ignore"].includes(statutDe(prog, id));
  for (const n of roadmap.noeuds) {
    if (!ids.has(n.id)) continue;
    const s = statutDe(prog, n.id);
    res.set(n.id, s === "maitrise" ? "acquis" : s === "ignore" ? "ignore" : n.prerequis.every(resolu) ? "disponible" : "verrouille");
  }
  return res;
}

export type Cheminement = {
  /** Du premier prérequis à l'objectif. */
  chemin: string[];
  /** Nombre d'étapes restantes à parcourir en séquence sur ce chemin (acquis et ignorés comptent pour 0). */
  etapesRestantes: number;
};

/** Chemin critique : la chaîne de prérequis qui compte le plus d'étapes restantes jusqu'à l'objectif. */
export function cheminCritique(roadmap: Roadmap, cibleId: string, prog: Progression): Cheminement {
  const parId = new Map(roadmap.noeuds.map((n) => [n.id, n]));
  const poids = (id: string) => (["maitrise", "ignore"].includes(statutDe(prog, id)) ? 0 : 1);
  const meilleur = new Map<string, { total: number; via: string | null }>();

  const calc = (id: string): number => {
    const connu = meilleur.get(id);
    if (connu) return connu.total;
    let via: string | null = null;
    let max = 0;
    for (const p of parId.get(id)!.prerequis) {
      if (!parId.has(p)) continue;
      const t = calc(p);
      if (via === null || t > max) [via, max] = [p, t];
    }
    const total = poids(id) + (via === null ? 0 : max);
    meilleur.set(id, { total, via });
    return total;
  };

  const etapesRestantes = calc(cibleId);
  const chemin: string[] = [];
  for (let id: string | null = cibleId; id; id = meilleur.get(id)!.via) chemin.unshift(id);
  return { chemin, etapesRestantes };
}

export type Suite = { type: "debut" | "suite" | "termine"; noeud?: NoeudLeger; enCours: boolean };

/**
 * Où reprendre : une compétence « en cours » d'abord, sinon la première disponible (prérequis acquis ou ignorés),
 * de rang le plus bas, dans l'ordre de la roadmap. `debut` quand rien n'est encore renseigné, `termine` quand il ne reste rien.
 */
export function prochaineEtape(roadmap: RoadmapLegere, prog: Progression): Suite {
  const ids = new Set(roadmap.noeuds.map((n) => n.id));
  const etat = etats(roadmap, ids, prog);
  const rang = rangs(roadmap.noeuds);
  const parRang = (a: NoeudLeger, b: NoeudLeger) => rang.get(a.id)! - rang.get(b.id)!;

  const enCours = roadmap.noeuds.filter((n) => statutDe(prog, n.id) === "en-cours").sort(parRang)[0];
  if (enCours) return { type: "suite", noeud: enCours, enCours: true };

  const disponible = roadmap.noeuds.filter((n) => etat.get(n.id) === "disponible").sort(parRang)[0];
  if (!disponible) return { type: "termine", enCours: false };
  const rienRenseigne = Object.keys(prog).length === 0;
  return { type: rienRenseigne ? "debut" : "suite", noeud: disponible, enCours: false };
}
