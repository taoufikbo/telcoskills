/**
 * Produit « Objectif » (visualisation) : ce qu'il faut maîtriser avant une compétence cible, et le chemin critique.
 * Contrat commun des visualisations, plus un second événement de sortie : `onChoisirCible`. Aucun accès au stockage.
 * Embarque React Flow : à charger à la demande (`next/dynamic`).
 */
export { default as VueObjectif } from "./VueObjectif";
export { syntheseObjectif, type SyntheseObjectif } from "./synthese";
export { default as LaboObjectif } from "./Labo";
