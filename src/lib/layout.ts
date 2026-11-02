import { graphlib, layout } from "@dagrejs/dagre";
import type { Roadmap } from "./schema";

export const NOEUD_L = 224;
export const NOEUD_H = 72;
export const ENTETE_L = 260;
export const ENTETE_H = 56;

const ESPACE_V = 16;
const ESPACE_BLOC = 72;
const ECART_BRANCHE = 64;

export const X_GAUCHE = -ENTETE_L / 2 - ECART_BRANCHE - NOEUD_L;
export const X_DROITE = ENTETE_L / 2 + ECART_BRANCHE;

export type Cote = "gauche" | "droite";
export type Position = { x: number; y: number };
export type Disposition = {
  noeuds: Map<string, Position & { cote: Cote }>;
  entetes: Map<string, Position>;
};

/**
 * Arbre vertical façon roadmap.sh : un tronc central où les blocs se suivent dans l'ordre de `blocs`,
 * et les nœuds de chaque bloc en branches de part et d'autre. Dans un bloc, dagre calcule les rangs à
 * partir des prérequis du bloc ; les nœuds sont rangés dans cet ordre, en alternant gauche et droite.
 */
export function calculerDisposition(r: Roadmap): Disposition {
  const noeuds: Disposition["noeuds"] = new Map();
  const entetes: Disposition["entetes"] = new Map();
  let y0 = 0;

  for (const bloc of r.blocs) {
    const membres = r.noeuds.filter((n) => n.bloc === bloc);
    const ids = new Set(membres.map((n) => n.id));

    const g = new graphlib.Graph();
    g.setGraph({ rankdir: "TB", nodesep: 10, ranksep: 10 });
    g.setDefaultEdgeLabel(() => ({}));
    for (const n of membres) g.setNode(n.id, { width: NOEUD_L, height: NOEUD_H });
    for (const n of membres) for (const p of n.prerequis) if (ids.has(p)) g.setEdge(p, n.id);
    layout(g);

    const ordre = membres
      .map((n) => ({ id: n.id, ...g.node(n.id) }))
      .sort((a, b) => a.y - b.y || a.x - b.x);

    const lignes = Math.max(1, Math.ceil(ordre.length / 2));
    const hauteur = lignes * (NOEUD_H + ESPACE_V) - ESPACE_V;

    ordre.forEach((n, i) => {
      const cote: Cote = i % 2 === 0 ? "gauche" : "droite";
      noeuds.set(n.id, {
        x: cote === "gauche" ? X_GAUCHE : X_DROITE,
        y: y0 + Math.floor(i / 2) * (NOEUD_H + ESPACE_V),
        cote,
      });
    });
    entetes.set(bloc, { x: -ENTETE_L / 2, y: y0 + hauteur / 2 - ENTETE_H / 2 });

    y0 += hauteur + ESPACE_BLOC;
  }

  return { noeuds, entetes };
}

/**
 * Disposition en couches de gauche à droite façon PERT pour le sous-graphe `ids` : chaque nœud est placé
 * dans la colonne de son rang (plus long chemin depuis un nœud sans prérequis), dagre ordonne les nœuds
 * d'une colonne pour limiter les croisements.
 */
export function calculerDispositionObjectif(r: Roadmap, ids: Set<string>): Map<string, Position> {
  const membres = r.noeuds.filter((n) => ids.has(n.id));
  const g = new graphlib.Graph();
  g.setGraph({ rankdir: "LR", ranker: "longest-path", nodesep: 20, ranksep: 56 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const n of membres) g.setNode(n.id, { width: NOEUD_L, height: NOEUD_H });
  for (const n of membres) for (const p of n.prerequis) if (ids.has(p)) g.setEdge(p, n.id);
  layout(g);
  return new Map(
    membres.map((n) => {
      const { x, y } = g.node(n.id);
      return [n.id, { x: x - NOEUD_L / 2, y: y - NOEUD_H / 2 }];
    }),
  );
}
