/** Une question de QCM telle que l'écran la reçoit (sans le statut de relecture, qui sert à filtrer avant). */
export type QuestionAffichee = { id: string; enonce: string; options: string[]; bonne: number; explication: string; source: string; statut: "brouillon" | "valide" };

export type BilanRappel = { repondues: number; justes: number; total: number; termine: boolean; toutJuste: boolean };

/** Bilan d'une série de questions : `reponses` donne l'option choisie et vérifiée, par identifiant de question. Une série n'est réussie que si toutes les réponses sont justes. */
export function bilanRappel(questions: Pick<QuestionAffichee, "id" | "bonne">[], reponses: Record<string, number>): BilanRappel {
  const repondues = questions.filter((q) => reponses[q.id] !== undefined).length;
  const justes = questions.filter((q) => reponses[q.id] === q.bonne).length;
  const termine = questions.length > 0 && repondues === questions.length;
  return { repondues, justes, total: questions.length, termine, toutJuste: termine && justes === questions.length };
}
