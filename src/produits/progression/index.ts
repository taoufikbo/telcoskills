/**
 * Produit « Progression » : seul propriétaire de l'état de progression stocké dans le navigateur
 * (`tcr:pratique`, et en lecture seule, pour la migration, les anciennes clés `tcr:progression:*`).
 * Il fournit aussi l'export / import de fichier et le lien de partage. Aucun autre module ne lit ou n'écrit ces clés :
 * ils passent par les hooks et les fonctions pures ci-dessous.
 */

// Hooks (composants clients)
export { usePratique, useDues, useCalendrier, useEcheances, useRythme } from "./usePratique";
export { useProgression, type StatutDeclarable } from "./useProgression";

// Modèle et opérations pures sur l'état partagé
export {
  INTERVALLES_JOURS,
  RYTHME_DEFAUT,
  RYTHME_MAX,
  RYTHME_MIN,
  definirRythme,
  rythmeDe,
  palierAtteint,
  definirPalier,
  compterPaliers,
  type DecomptePaliers,
  compter,
  definirHorsParcours,
  echues,
  enregistrerRappel,
  etatVide,
  lireEtat,
  marquerVu,
  migrer,
  prochainesEcheances,
  suiviNoeud,
  suivreParcours,
  vueProgression,
  type Boite,
  type Decompte,
  type EtatPratique,
  type StatutPratique,
  type SuiviNoeud,
} from "./etat";

// Vue à quatre statuts par roadmap, fichier d'export, ancien lien `?etat=`
export {
  STATUTS,
  decoderEtat,
  encoderEtat,
  exporterProgression,
  importerProgression,
  statistiques,
  statistiquesParBloc,
  statutDe,
  type Progression,
  type Stats,
  type Statut,
} from "./progression";

// Lien de partage de l'état complet (`p1.…`)
export { PREFIXE_LIEN, decoderLienEtat, encoderLienEtat, estLienEtat, fusionnerEtats, nombreDeCompetences } from "./lien-etat";

// Page d'essai (/labo/progression)
export { default as LaboProgression } from "./Labo";

// Signal pour le produit Visiteur
export { aDeLaProgression } from "./signal";
