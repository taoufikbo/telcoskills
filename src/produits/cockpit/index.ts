/**
 * Produit « Cockpit » (visualisation) : le programme d'un parcours (blocs dans l'ordre, compétences, heures estimées, projection en semaines
 * au rythme choisi) et le tableau de bord de la roadmap (où j'en suis, heures faites et restantes, prochaine étape, révisions dues,
 * objectif et chemin critique, date d'arrivée estimée). Contrat commun des visualisations : tout est reçu en entrée (suivi, rythme, date),
 * « ouvrir la compétence X » et « changer le rythme » sortent en événements ; aucun accès au stockage.
 * Les heures sont l'hypothèse éditoriale de content/orientation.json : toujours présentées comme « estimation indicative ».
 */
export { default as Cockpit } from "./Cockpit";
export { default as Programme } from "./Programme";
export { default as Rythme } from "./Rythme";
export {
  calculerCockpit,
  calculerProgramme,
  placerSemaines,
  projeter,
  type BlocProgramme,
  type Cockpit as DonneesCockpit,
  type NoeudProgramme,
  type ObjectifCockpit,
  type Programme as DonneesProgramme,
  type Projection,
  type RoadmapProgramme,
} from "./calcul";
export { formaterArrivee, libelleSemaines } from "./format";
export { default as LaboCockpit } from "./Labo";
