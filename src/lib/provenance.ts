import type { Provenance } from "./schema";

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** « 2026-10 » → « octobre 2026 ». */
export function moisLisible(aaaamm: string): string {
  const [annee, mois] = aaaamm.split("-");
  return `${MOIS[Number(mois) - 1]} ${annee}`;
}

/** Texte du badge de provenance, tel qu'affiché en tête de roadmap. */
export function libelleProvenance(p: Provenance | undefined): string {
  if (!p || p.type === "editoriale") return "Éditoriale";
  const offres = `${p.approximatif ? "environ " : ""}${p.nombre} offres`;
  return `Offres d'emploi · ${offres} · ${moisLisible(p.date)}`;
}

/** Phrase qui précise ce que le badge garantit (et ce qu'il ne garantit pas). */
export function explicationProvenance(p: Provenance | undefined): string {
  return p?.type === "offres"
    ? "Les compétences viennent d'un échantillon d'offres d'emploi, pas d'une statistique du marché. Les blocs ajoutés ensuite sont signalés dans la source."
    : "Rédigée à partir de sources publiques (spécifications, documentations, textes officiels). Aucune analyse d'offres d'emploi : l'indicateur de demande n'est pas renseigné.";
}
