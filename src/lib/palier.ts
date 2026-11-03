import type { Orientation } from "./orientation-schema";
import { PALIERS, type Noeud } from "./schema";

export type Investissement = 1 | 2 | 3;
export const LIBELLE_INVESTISSEMENT: Record<Investissement, string> = { 1: "léger", 2: "moyen", 3: "long" };

type Table = NonNullable<Orientation["investissement_par_palier"]>;

/** Investissement à prévoir pour atteindre `palier` sur une compétence de ce niveau. Échelle ordinale (hypothèse éditoriale de orientation.json), jamais une durée. Undefined sans table ou sans entrée. */
export function investissement(table: Table | undefined, niveau: Noeud["niveau"], palier: number): Investissement | undefined {
  return table?.[niveau]?.[String(palier) as "1"] as Investissement | undefined;
}

/** Palier valide (entier de 1 à 5) ? */
export function estPalier(valeur: unknown): valeur is number {
  return typeof valeur === "number" && PALIERS.includes(valeur as (typeof PALIERS)[number]);
}

export type Repartition = { legers: number; moyens: number; longs: number; /** Compétences sans palier cible posé : non comptées. */ sansCible: number };

/** Répartition léger / moyen / long d'un ensemble de compétences, au palier cible de chacune. */
export function repartition(noeuds: Pick<Noeud, "niveau" | "cible">[], table: Table | undefined): Repartition {
  const r: Repartition = { legers: 0, moyens: 0, longs: 0, sansCible: 0 };
  for (const n of noeuds) {
    const i = n.cible === undefined ? undefined : investissement(table, n.niveau, n.cible);
    if (i === 1) r.legers++;
    else if (i === 2) r.moyens++;
    else if (i === 3) r.longs++;
    else r.sansCible++;
  }
  return r;
}
