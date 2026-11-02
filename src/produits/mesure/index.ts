/**
 * Produit « Mesure » : mesure d'audience sans cookie (Vercel Web Analytics), liste fermée des événements, liens mesurés,
 * et calcul des indicateurs (scripts/indicateurs.ts). Seul propriétaire des clés `tcr:mesure:*` (une mesure par jour et par navigateur). Le script ne se charge qu'avec l'accord de la personne (produit Consentement).
 */
export { EVENEMENTS, premiereFoisAujourdhui, suivre, suivreUnParJour, type Evenement } from "./analytics";
export { default as Analytics } from "./Analytics";
export { mesureActive } from "./active";
export { default as LienSuivi } from "./LienSuivi";
export { default as LaboMesure } from "./Labo";
export { calculerIndicateurs, SEUIL_FIABLE, taux, type EvenementMesure, type Taux } from "./indicateurs";
