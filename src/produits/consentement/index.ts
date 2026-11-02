/**
 * Produit « Consentement » : le choix de la personne sur la mesure d'audience (Vercel Web Analytics). Le site ne dépose aucun cookie ;
 * sans accord, le script de mesure n'est pas chargé. Seul propriétaire de la clé `tcr:consentement` ({ choix, jour }, valable six mois).
 * Le bandeau offre « Refuser » et « Accepter » à égalité ; « Gérer mes choix » (pied de page) permet de changer d'avis.
 */
export { default as Bandeau } from "./Bandeau";
export { default as LienChoix } from "./LienChoix";
export { useConsentement } from "./useConsentement";
export { VALIDITE_JOURS, lireChoix, serialiserChoix, type Choix } from "./regles";
export { default as LaboConsentement } from "./Labo";
