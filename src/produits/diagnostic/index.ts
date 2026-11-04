/**
 * Produit « Diagnostic » : le diagnostic personnel (trois questions, moins d'une minute), qui écrit ses réponses
 * dans le produit Parcours. Entrée : la configuration et les libellés préparés au build (src/lib/orientationProps.ts).
 */
export { default as Diagnostic } from "./Diagnostic";
export { ANCRE as ANCRE_DIAGNOSTIC, PARAM as PARAM_PROFIL, decoderProfil, encoderProfil } from "./profil";
