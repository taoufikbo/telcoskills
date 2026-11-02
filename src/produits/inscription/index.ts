/**
 * Produit « Inscription » : l'encart d'inscription aux mises à jour. Seul propriétaire de la clé tcr:inscription
 * (pages vues, date de fermeture, date d'inscription). N'apparaît que si un service d'envoi est configuré (INSTANCE.inscription).
 */
export { default as EncartInscription } from "./EncartInscription";
export { doitAfficher, DELAI_APRES_FERMETURE_JOURS, PAGES_AVANT_AFFICHAGE } from "./regles";
