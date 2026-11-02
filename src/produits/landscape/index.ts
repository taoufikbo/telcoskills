/**
 * Produit « Landscape » : les outils d'une pile cloud télécom, groupés par fonction (comme landscape.cncf.io),
 * recomposés selon les rôles du projet fil rouge et reliés aux compétences des roadmaps.
 * Données : content/landscape.json (validé au build) ; logos : public/logos (licences dans public/logos/LICENCES.md).
 * Repris de la branche interne `interne-v3`, où il avait été conçu ; il n'avait jamais été fusionné.
 */
export { default as LandscapeView } from "./LandscapeView";
export { chargerLandscape, resoudreLandscape, validerLandscape, type LandscapeResolu, type OutilResolu } from "./chargement";
