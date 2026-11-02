import type { PratiqueNoeud } from "./pratique-schema";

/** Les étapes du parcours d'une compétence, dans l'ordre fixe de DESIGN.md §4. */
export type EtapeId = "question" | "vocabulaire" | "explication" | "projet" | "pourquoi" | "rappel";

export const LIBELLE_ETAPE: Record<EtapeId, string> = {
  question: "Question",
  vocabulaire: "Vocabulaire",
  explication: "Explication",
  projet: "Dans le projet",
  pourquoi: "Pourquoi ?",
  rappel: "Rappel",
};

/**
 * Les étapes à montrer pour cette compétence : on saute ce qui n'existe pas (pas de vocabulaire nouveau, pas de lien projet,
 * pas de « pourquoi » hors des nœuds avancés). Une compétence sans aucune question de rappel n'a pas de parcours.
 */
export function etapesDisponibles(p: PratiqueNoeud, aProjet: boolean): EtapeId[] {
  const etapes: EtapeId[] = [];
  if (p.questionPrealable) etapes.push("question");
  if (p.contenu && p.contenu.vocabulaire.length > 0) etapes.push("vocabulaire");
  if (p.contenu && p.contenu.segments.length > 0) etapes.push("explication");
  if (p.lienProjet && aProjet) etapes.push("projet");
  if (p.pourquoi) etapes.push("pourquoi");
  if (p.rappel && p.rappel.length > 0) etapes.push("rappel");
  return etapes.includes("rappel") ? etapes : [];
}

export type Evaluation = { correctes: number; total: number; reussi: boolean };

/**
 * Le rappel d'une compétence est **réussi quand toutes ses questions le sont du premier coup**.
 * Avec 4 propositions, une seule question se réussit au hasard 1 fois sur 4 ; deux questions, 1 fois sur 16 ; trois, 1 sur 64.
 * Une question sans réponse compte comme fausse.
 */
export function evaluer(bonnes: number[], choix: (number | null)[]): Evaluation {
  const correctes = bonnes.filter((b, i) => choix[i] === b).length;
  return { correctes, total: bonnes.length, reussi: bonnes.length > 0 && correctes === bonnes.length };
}
