import { ecartJours } from "@/lib/jour";

/** Ce que le produit garde dans le navigateur (clé tcr:inscription). */
export type EtatInscription = { pages: number; fermeLe?: string; inscritLe?: string };

export const ETAT_VIDE: EtatInscription = { pages: 0 };
/** Après « Plus tard », l'encart ne revient pas avant ce délai. */
export const DELAI_APRES_FERMETURE_JOURS = 30;
/** Sans parcours choisi, l'encart n'apparaît qu'à partir de cette page vue (jamais à l'arrivée). */
export const PAGES_AVANT_AFFICHAGE = 3;

/**
 * Faut-il proposer l'inscription ? Jamais après une inscription ; pas avant 30 jours après « Plus tard » ;
 * sinon, seulement à un moment utile : le visiteur a choisi un parcours, ou il en est au moins à sa 3e page. Pure.
 */
export function doitAfficher(etat: EtatInscription, aChoisiParcours: boolean, aujourdhui: string): boolean {
  if (etat.inscritLe) return false;
  if (etat.fermeLe && ecartJours(etat.fermeLe, aujourdhui) < DELAI_APRES_FERMETURE_JOURS) return false;
  return aChoisiParcours || etat.pages >= PAGES_AVANT_AFFICHAGE;
}

/** Lecture tolérante du stockage : toute donnée illisible redonne l'état vide. */
export function lireEtat(brut: string | null): EtatInscription {
  try {
    const e = JSON.parse(brut ?? "null") as Partial<EtatInscription> | null;
    if (!e || typeof e.pages !== "number") return ETAT_VIDE;
    return { pages: e.pages, ...(typeof e.fermeLe === "string" && { fermeLe: e.fermeLe }), ...(typeof e.inscritLe === "string" && { inscritLe: e.inscritLe }) };
  } catch {
    return ETAT_VIDE;
  }
}
