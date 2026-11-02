/**
 * Produit « Recherche » : l'index (construit au build, servi par /index-recherche.json), la recherche pure et la palette
 * (Ctrl/Cmd+K). Aucun stockage.
 */
export { default as RecherchePalette, BoutonRecherche, EVENEMENT_RECHERCHE } from "./RecherchePalette";
export { construireIndex, normaliser, rechercher, type EntreeRecherche } from "./recherche";
export { default as LaboRecherche } from "./Labo";
