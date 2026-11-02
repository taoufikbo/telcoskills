/**
 * Produit « Carte héros » (visualisation). Contrat commun des visualisations :
 * - entrée : la disposition calculée au build (`disposerCarte`, depuis le catalogue) et la progression en lecture seule ;
 * - sortie : l'événement « ouvrir la compétence X » (`onOuvrir`), sinon un lien vers la page de la compétence ;
 * - aucun accès au stockage (vérifié par le linter).
 */
export { default as CarteHeros } from "./CarteHeros";
export { choisirCible, couperLibelle, disposerCarte, TAILLE_MAX_CARTE, type Disposition, type RoadmapCarte } from "./disposition";
export { default as LaboCarteHeros } from "./Labo";
