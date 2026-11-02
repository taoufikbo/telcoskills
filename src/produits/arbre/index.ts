/**
 * Produit « Arbre » (visualisation) : les blocs en tronc, les compétences en branches, les prérequis de la compétence sélectionnée.
 * Contrat commun des visualisations : roadmap et progression en lecture seule en entrée, `onOuvrir` en sortie, aucun accès au stockage.
 * Embarque React Flow : à charger à la demande (`next/dynamic`).
 */
export { default as GrapheRoadmap } from "./GrapheRoadmap";
export { aretesArbre } from "./aretes";
export { default as LaboArbre } from "./Labo";
