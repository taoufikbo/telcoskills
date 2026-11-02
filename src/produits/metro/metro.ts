import { rangs } from "@/lib/objectif";
import type { Roadmap } from "@/lib/schema";

export const PAS_X = 124;
export const PAS_Y = 124;

export type Station = { x: number; y: number; ligne: number };
export type Ligne = { bloc: string; ids: string[]; y: number };
export type Metro = {
  stations: Map<string, Station>;
  /** Une ligne par bloc ; `ids` dans l'ordre de parcours, de gauche à droite. */
  lignes: Ligne[];
  /** Stations qui ont un prérequis ou un dépendant sur une autre ligne. */
  correspondances: Set<string>;
};

/**
 * Plan de métro : une ligne horizontale par bloc (dans l'ordre de `blocs`). L'abscisse d'une station vient du
 * rang du nœud dans tout le graphe (plus long chemin de prérequis) : un prérequis est donc toujours à gauche de
 * ce qui en dépend, quelle que soit la ligne. Les stations d'une même ligne qui ont le même rang sont décalées
 * dans des colonnes réservées pour ce rang, afin qu'aucune station ne se superpose.
 */
export function calculerMetro(r: Roadmap): Metro {
  const rang = rangs(r.noeuds);
  const maxRang = Math.max(...rang.values());

  const groupes = new Map<string, { ligne: number; rang: number; ids: string[] }>();
  for (const n of r.noeuds) {
    const ligne = r.blocs.indexOf(n.bloc);
    const k = `${ligne}:${rang.get(n.id)}`;
    const g = groupes.get(k) ?? { ligne, rang: rang.get(n.id)!, ids: [] };
    g.ids.push(n.id);
    groupes.set(k, g);
  }

  const largeur = Array<number>(maxRang + 1).fill(0);
  for (const g of groupes.values()) largeur[g.rang] = Math.max(largeur[g.rang], g.ids.length);
  const debut = largeur.map((_, i) => largeur.slice(0, i).reduce((a, b) => a + b, 0));

  const stations = new Map<string, Station>();
  for (const g of groupes.values())
    g.ids.forEach((id, i) => stations.set(id, { x: (debut[g.rang] + i) * PAS_X, y: g.ligne * PAS_Y, ligne: g.ligne }));

  const lignes: Ligne[] = r.blocs.map((bloc, i) => ({
    bloc,
    y: i * PAS_Y,
    ids: r.noeuds
      .filter((n) => n.bloc === bloc)
      .map((n) => n.id)
      .sort((a, b) => stations.get(a)!.x - stations.get(b)!.x),
  }));

  const correspondances = new Set<string>();
  for (const n of r.noeuds)
    for (const p of n.prerequis)
      if (stations.get(p)!.ligne !== stations.get(n.id)!.ligne) {
        correspondances.add(n.id);
        correspondances.add(p);
      }

  return { stations, lignes, correspondances };
}
