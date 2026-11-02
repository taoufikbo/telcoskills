import { reponsesValides, type Orientation, type Reponses } from "@/lib/orientation-schema";

/** Paramètre d'adresse du résultat partagé : ?profil=metier.telecom.objectif (identifiants des options). */
export const PARAM = "profil";
/** Ancre de la section du diagnostic sur l'accueil. */
export const ANCRE = "diagnostic";

export const encoderProfil = (r: Reponses) => `${r.metier}.${r.telecom}.${r.objectif}`;

/** Décode un profil partagé ; null s'il ne correspond pas aux options de la configuration. */
export function decoderProfil(config: Orientation, texte: string): Reponses | null {
  const [metier, telecom, objectif] = texte.split(".");
  const r = { metier, telecom, objectif };
  return reponsesValides(config, r) ? r : null;
}
