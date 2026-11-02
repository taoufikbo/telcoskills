/**
 * Produit « Parcours » : seul propriétaire des réponses au diagnostic stockées dans le navigateur (`tcr:orientation`).
 * Le calcul du parcours recommandé (src/lib/orientation-schema.ts) le rejoindra avec le produit Diagnostic.
 */
export { enregistrerReponses, lireReponses, useReponsesEnregistrees, type ReponsesEnregistrees } from "./stockage";
export { default as LaboParcours } from "./Labo";
