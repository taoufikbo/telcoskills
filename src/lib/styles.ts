import type { Demande, Niveau } from "./schema";

/* Couleurs de la charte : vert, bleu ciel, violet, gris ; fond teinté léger, texte toujours noir/blanc. */
export const STYLE_NIVEAU: Record<Niveau, string> = {
  fondamental: "border-brand-green bg-brand-green/10 dark:border-brand-green-light dark:bg-brand-green-light/15",
  intermediaire: "border-brand-cyan bg-brand-cyan/15 dark:bg-brand-cyan/15",
  avance: "border-brand-purple bg-brand-purple/15 dark:bg-brand-purple/20",
  transverse: "border-slate-400 bg-slate-200 dark:bg-slate-700",
};

export const PASTILLE_NIVEAU: Record<Niveau, string> = {
  fondamental: "bg-brand-green dark:bg-brand-green-light",
  intermediaire: "bg-brand-cyan",
  avance: "bg-brand-purple",
  transverse: "bg-slate-400",
};

/** Demande : orange (forte), jaune (moyenne), gris (faible), toujours avec texte noir. */
export const STYLE_DEMANDE: Record<Demande, string> = {
  forte: "bg-orange text-black",
  moyenne: "bg-brand-yellow text-black",
  faible: "bg-slate-300 text-black dark:bg-slate-500 dark:text-white",
};

export const LIBELLE_DEMANDE_COURT: Record<Demande, string> = {
  forte: "Forte",
  moyenne: "Moyenne",
  faible: "Faible",
};

export const STYLE_STATUT = {
  "a-faire": "",
  "en-cours": "bg-brand-cyan text-black",
  maitrise: "bg-brand-green text-white dark:bg-brand-green-light dark:text-black",
  ignore: "bg-slate-500 text-white",
} as const;
