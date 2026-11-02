import type { Demande, Niveau } from "./schema";

export const LIBELLE_TYPE_ROADMAP = { role: "Rôle", competence: "Compétence" } as const;

export const LIBELLE_NIVEAU: Record<Niveau, string> = {
  fondamental: "Fondamental",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
  transverse: "Transverse",
};

export const LIBELLE_DEMANDE: Record<Demande, string> = {
  forte: "Forte demande",
  moyenne: "Demande moyenne",
  faible: "Faible demande",
};

export const LIBELLE_RESSOURCE: Record<string, string> = {
  cours: "Cursus et formations",
  video: "Playlists vidéo",
  opensource: "Référence open source",
  libre: "Texte en accès libre",
  doc: "Documentation",
  certif: "Certifications",
  spec: "Spécifications",
  livre: "Livres",
  modele: "Modèles",
  "retour-experience": "Retours d'expérience",
};

export const LIBELLE_STATUT = {
  "a-faire": "À découvrir",
  "en-cours": "Vu",
  maitrise: "Acquis (testé)",
  ignore: "Hors parcours",
} as const;

/** Statuts de pratique : forme, texte et couleur (jamais la couleur seule). */
export const STATUT_PRATIQUE = {
  "a-decouvrir": { libelle: "À découvrir", icone: "○", detail: "Pas encore vue" },
  vu: { libelle: "Vu", icone: "◐", detail: "Vue, pas encore testée" },
  "acquis-teste": { libelle: "Acquis (testé)", icone: "●", detail: "Rappel réussi" },
  "a-revoir": { libelle: "À revoir", icone: "◔", detail: "Acquise, révision due" },
} as const;
