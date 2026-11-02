/**
 * Produit « Liste » (visualisation) : les compétences par bloc. Contrat commun des visualisations :
 * roadmap et progression en lecture seule en entrée, « ouvrir la compétence X » (`onOuvrir`) en sortie, aucun accès au stockage.
 */
export { default as Liste } from "./Liste";
export { lignesParBloc, type Ligne, type RoadmapListe } from "./lignes";
export { default as LaboListe } from "./Labo";
