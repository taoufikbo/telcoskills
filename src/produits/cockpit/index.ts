/**
 * Produit « Cockpit » (visualisation) : la barre de gauche du mode apprentissage (Sommaire : programme, compétence en cours, avancement), le programme d'un parcours (blocs dans l'ordre, compétences, heures estimées, projection en semaines
 * au rythme choisi) et le tableau de bord de la roadmap (où j'en suis, compétences acquises et restantes, prochaine étape, révisions dues,
 * objectif et chemin critique, date d'arrivée estimée). Contrat commun des visualisations : tout est reçu en entrée (suivi, rythme, date),
 * « ouvrir la compétence X » et « changer le rythme » sortent en événements ; aucun accès au stockage.
 * Pas d'heures : le palier visé par compétence (champ `cible`) et l'investissement léger, moyen ou long (content/orientation.json) ; le rythme se compte en compétences par semaine.
 */
export { default as Cockpit } from "./Cockpit";
export { default as Programme } from "./Programme";
export { default as Rythme } from "./Rythme";
export { default as Sommaire } from "./Sommaire";
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
  type TableInvestissement,
} from "./calcul";
export { formaterArrivee, libelleSemaines } from "./format";
export { default as LaboCockpit } from "./Labo";
