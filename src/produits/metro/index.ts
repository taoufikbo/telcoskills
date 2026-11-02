/**
 * Produit « Métro » (visualisation) : une ligne de métro par bloc. Contrat commun des visualisations :
 * roadmap et progression en lecture seule en entrée, « ouvrir la compétence X » (`onOuvrir`) en sortie, aucun accès au stockage.
 * Embarque React Flow : à charger à la demande (`next/dynamic`).
 */
export { default as CarteMetro } from "./CarteMetro";
export { calculerMetro } from "./metro";
export { default as LaboMetro } from "./Labo";
