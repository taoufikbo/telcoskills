import { analysesPubliees } from "./analyses";
import { diagnosticEquipeVisible } from "./diagnostic";
import { chargerFrameworks } from "./frameworks";
import { INSTANCE } from "./instance";

/**
 * Quelles rubriques peuvent être proposées dans la navigation et dans les appels à l'action.
 * Règle de la spécification (§6, critère 5) : aucun lien de menu ne mène à une page « en cours de rédaction ».
 * En développement et en aperçu (NEXT_PUBLIC_SHOW_DRAFTS=1), tout reste visible pour pouvoir rédiger.
 */
const BROUILLONS_VISIBLES = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SHOW_DRAFTS === "1";

/** Les offres n'ont pas de fichier de données : passer à `true` quand les rubriques de src/app/offres/page.tsx sont rédigées. */
export const OFFRES_REDIGEES = false;

/** Un canal de contact existe (réservation ou e-mail, src/lib/instance.ts). */
export const contactDisponible = () => BROUILLONS_VISIBLES || Boolean(INSTANCE.contact.calendlyUrl || INSTANCE.contact.email);
/** Au moins un framework est rédigé (champ `redige` de content/frameworks.json). */
export const frameworksRediges = () => BROUILLONS_VISIBLES || chargerFrameworks().some((f) => f.redige);

export type Sections = { analyses: boolean; frameworks: boolean; offres: boolean; contact: boolean; newsletter: boolean; diagnosticEquipe: boolean };

export async function sectionsVisibles(): Promise<Sections> {
  return {
    analyses: (await analysesPubliees()).length > 0,
    frameworks: frameworksRediges(),
    offres: BROUILLONS_VISIBLES || OFFRES_REDIGEES,
    contact: contactDisponible(),
    newsletter: BROUILLONS_VISIBLES || Boolean(INSTANCE.newsletterUrl),
    diagnosticEquipe: diagnosticEquipeVisible(),
  };
}

/** Rubrique d'une adresse de premier niveau, ou null si elle est toujours visible. */
export function rubriqueDe(href: string): keyof Sections | null {
  const table: Record<string, keyof Sections> = {
    "/analyses": "analyses",
    "/frameworks": "frameworks",
    "/offres": "offres",
    "/contact": "contact",
    "/newsletter": "newsletter",
    "/diagnostic": "diagnosticEquipe",
  };
  return table[href] ?? null;
}

export const lienVisible = (sections: Sections, href: string) => {
  const r = rubriqueDe(href);
  return r === null || sections[r];
};
