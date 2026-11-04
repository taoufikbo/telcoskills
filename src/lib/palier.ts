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

/** Ce que veut dire chaque palier (définitions de l'auteur, reports/paliers-grille.json). Le palier se pose par rôle : c'est le palier visé pour ce métier. */
export const DEFINITION_PALIER: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "Dire à quoi ça sert et situer le composant ou le pattern dans l'architecture",
  2: "Palier 1 + voir comment l'utiliser (lire une configuration, suivre un exemple)",
  3: "Avoir suivi le parcours : le faire soi-même en lab",
  4: "Diagnostiquer et arbitrer : dépanner, choisir entre alternatives, dire quand ne pas l'utiliser",
  5: "Concevoir et transmettre : dimensionner, composer des patterns, écrire la décision",
};

/** Investissement d'une compétence à son palier cible ; undefined sans palier cible ou sans table. */
export function investissementNoeud(table: Table | undefined, n: Pick<Noeud, "niveau" | "cible">): Investissement | undefined {
  return n.cible === undefined ? undefined : investissement(table, n.niveau, n.cible);
}

export type Effort = { legers: number; moyens: number; longs: number };

/** Répartition léger / moyen / long d'un ensemble de compétences au palier cible de chacune (sans palier : non comptée). */
export function effort(noeuds: Pick<Noeud, "niveau" | "cible">[], table: Table | undefined): Effort {
  const { legers, moyens, longs } = repartition(noeuds, table);
  return { legers, moyens, longs };
}

/** « 3 légères · 5 moyennes · 1 longue » ; les catégories vides sont omises, vide si rien à compter. */
export function libelleEffort(e: Effort): string {
  const parties: string[] = [];
  if (e.legers) parties.push(`${e.legers} légère${e.legers > 1 ? "s" : ""}`);
  if (e.moyens) parties.push(`${e.moyens} moyenne${e.moyens > 1 ? "s" : ""}`);
  if (e.longs) parties.push(`${e.longs} longue${e.longs > 1 ? "s" : ""}`);
  return parties.join(" · ");
}

/** Investissement de chaque compétence d'une roadmap, par identifiant : sert aux cartes, qui n'ont que des identifiants. */
export function investissementDe(roadmap: { noeuds: (Pick<Noeud, "id" | "niveau" | "cible">)[] }, table: Table | undefined): (id: string) => Investissement | undefined {
  const parId = new Map(roadmap.noeuds.map((n) => [n.id, n]));
  return (id) => {
    const n = parId.get(id);
    return n ? investissementNoeud(table, n) : undefined;
  };
}

/** Pour chaque point de départ possible du diagnostic : l'investissement de sa première compétence et la répartition de son bloc. */
export type InvestissementsDeparts = { noeuds: Record<string, { noeud?: Investissement; bloc: string; effortBloc: Effort }> };
