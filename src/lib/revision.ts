import { echues, type EtatPratique } from "@/produits/progression";
import type { Rappel } from "./pratique-schema";

/** Une compétence qu'on peut réviser : elle a au moins une question de rappel. */
export type NoeudRevisable = { id: string; titre: string; bloc: string; roadmapId: string; questions: Rappel[] };
export type ElementRevision = { id: string; titre: string; bloc: string; roadmapId: string; question: Rappel };

/** Plafond d'une session : assez court pour se faire dans la foulée (une question par compétence). */
export const PLAFOND_SESSION = 8;

/** Fait tourner les questions d'une compétence d'une révision à l'autre, pour ne pas toujours poser la même. */
export function choisirQuestion(n: NoeudRevisable, tentatives: number): Rappel {
  return n.questions[tentatives % n.questions.length];
}

/**
 * Mélange entre blocs (principe 5) : on garde l'ordre de priorité (le plus en retard d'abord), mais on évite deux
 * questions de suite du même bloc quand un autre bloc est disponible.
 */
export function melanger<T extends { bloc: string }>(elements: T[]): T[] {
  const reste = [...elements];
  const sortie: T[] = [];
  while (reste.length > 0) {
    const precedent = sortie.at(-1)?.bloc;
    const k = reste.findIndex((e) => e.bloc !== precedent);
    sortie.push(...reste.splice(k === -1 ? 0 : k, 1));
  }
  return sortie;
}

export type FileRevision = {
  file: ElementRevision[];
  /** Révisions dues mais au-delà du plafond de la session. */
  restantes: number;
  /** Compétences dues qui n'ont aucune question disponible (elles ne peuvent pas être révisées ici). */
  sansQuestion: string[];
};

/** La session du jour : les révisions dues, une question par compétence, mélangées entre blocs. */
export function construireFile(etat: EtatPratique, now: Date, noeuds: Map<string, NoeudRevisable>, plafond = PLAFOND_SESSION): FileRevision {
  const dues = echues(etat, now);
  const revisables = dues.filter((id) => (noeuds.get(id)?.questions.length ?? 0) > 0);
  const sansQuestion = dues.filter((id) => !revisables.includes(id));
  const retenues = revisables.slice(0, plafond).map((id) => {
    const n = noeuds.get(id)!;
    return { id, titre: n.titre, bloc: n.bloc, roadmapId: n.roadmapId, question: choisirQuestion(n, etat.noeuds[id]?.tentatives ?? 0) };
  });
  return { file: melanger(retenues), restantes: revisables.length - retenues.length, sansQuestion };
}
