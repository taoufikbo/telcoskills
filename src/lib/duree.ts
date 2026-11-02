import type { Orientation } from "./orientation-schema";
import type { Noeud } from "./schema";

/** Heures d'étude estimées : somme des heures supposées par niveau (hypothèse éditoriale de orientation.json, pas une mesure). */
export function heuresEstimees(noeuds: Pick<Noeud, "niveau">[], parNiveau: Orientation["duree_par_niveau_heures"]): number {
  return noeuds.reduce((total, n) => total + parNiveau[n.niveau], 0);
}

/** « environ 12 h » ou « environ 3 semaines à 4 h par semaine » : l'ordre de grandeur, jamais une promesse. Le rythme (h par semaine) est celui choisi par la personne, 4 par défaut. */
export function libelleDuree(heures: number, rythme = 4): string {
  if (heures < 20) return `environ ${Math.round(heures)} h`;
  return `environ ${Math.round(heures)} h, soit ${Math.ceil(heures / rythme)} semaines à ${rythme} h par semaine`;
}
