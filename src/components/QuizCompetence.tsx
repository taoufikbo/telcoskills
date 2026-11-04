"use client";

import { useRef, useState } from "react";
import { bilanRappel, type QuestionAffichee } from "@/lib/quiz";
import { usePratique } from "@/produits/progression";

type Props = {
  noeudId: string;
  /** « rappel » : une série qui, réussie en entier, enregistre un rappel (acquis testé). « depart » : une question de mise en route, sans effet sur la progression. */
  mode: "rappel" | "depart";
  questions: QuestionAffichee[];
  titre: string;
};

/**
 * Mini-quiz d'une compétence. Une réponse est vérifiée une fois : on voit la bonne réponse, l'explication et la source.
 * En mode « rappel », la série n'est réussie que si toutes les réponses sont justes ; c'est alors, et alors seulement,
 * que la compétence devient « acquise (testé) » (jamais sur simple déclaration).
 */
export default function QuizCompetence({ noeudId, mode, questions, titre }: Props) {
  const { enregistrerRappel } = usePratique();
  const [choix, setChoix] = useState<Record<string, number>>({});
  const [verifiees, setVerifiees] = useState<Record<string, number>>({});
  const enregistre = useRef(false);

  const bilan = bilanRappel(questions, verifiees);

  const verifier = (q: QuestionAffichee) => {
    if (choix[q.id] === undefined || verifiees[q.id] !== undefined) return;
    const suite = { ...verifiees, [q.id]: choix[q.id] };
    setVerifiees(suite);
    const b = bilanRappel(questions, suite);
    if (mode === "rappel" && b.termine && !enregistre.current) {
      enregistre.current = true;
      enregistrerRappel(noeudId, b.toutJuste);
    }
  };
  const recommencer = () => {
    setChoix({});
    setVerifiees({});
    enregistre.current = false;
  };

  return (
    <section aria-labelledby={`quiz-${mode}-${noeudId}`} className="space-y-4">
      <h2 id={`quiz-${mode}-${noeudId}`} className="text-2xl font-semibold">
        {titre}
      </h2>
      <div className="space-y-4">
        {questions.map((q, i) => {
          const vue = verifiees[q.id] !== undefined;
          const juste = vue && verifiees[q.id] === q.bonne;
          return (
            <fieldset key={q.id} className="panneau space-y-3 p-4" disabled={vue}>
              <legend className="float-left mb-3 w-full text-base font-medium">
                {questions.length > 1 && <span className="mono mr-2">{i + 1}/{questions.length}</span>}
                {q.enonce}
                {q.statut === "brouillon" && (
                  <span className="mono ml-2 rounded border px-1.5 py-0.5 text-xs" style={{ borderColor: "var(--crit)", color: "var(--crit)" }}>
                    brouillon, non relu
                  </span>
                )}
              </legend>
              <div className="clear-both grid gap-2">
                {q.options.map((o, k) => {
                  const estBonne = vue && k === q.bonne;
                  const estMauvaiseChoisie = vue && k === verifiees[q.id] && k !== q.bonne;
                  return (
                    <label
                      key={o}
                      className="flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--halo)] has-[:disabled]:cursor-default"
                      style={{ borderColor: estBonne ? "var(--ok)" : estMauvaiseChoisie ? "var(--crit)" : "var(--filet)" }}
                    >
                      <input type="radio" name={q.id} value={k} checked={choix[q.id] === k} onChange={() => setChoix((c) => ({ ...c, [q.id]: k }))} className="mt-1 accent-[var(--accent)]" />
                      <span>
                        {o}
                        {estBonne && <span className="sr-only"> (bonne réponse)</span>}
                        {estMauvaiseChoisie && <span className="sr-only"> (votre réponse, incorrecte)</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
              {!vue && (
                <button type="button" className="btn btn-ghost btn-sm" disabled={choix[q.id] === undefined} onClick={() => verifier(q)}>
                  Vérifier ma réponse
                </button>
              )}
              <div aria-live="polite">
                {vue && (
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold" style={{ color: juste ? "var(--ok)" : "var(--crit)" }}>
                      {juste ? "Bonne réponse." : `Pas tout à fait : la bonne réponse est « ${q.options[q.bonne]} ».`}
                    </p>
                    <p>{q.explication}</p>
                    <p className="mono text-xs">Source : {q.source}</p>
                  </div>
                )}
              </div>
            </fieldset>
          );
        })}
      </div>
      {mode === "rappel" && bilan.termine && (
        <div className="space-y-2" aria-live="polite">
          <p className="font-semibold">
            {bilan.justes} sur {bilan.total}.{" "}
            {bilan.toutJuste ? "Série réussie : cette compétence est acquise (testé) et sera à revoir dans quelques jours." : "Pour qu'une compétence soit acquise, toute la série doit être juste."}
          </p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={recommencer}>
            Recommencer la série
          </button>
        </div>
      )}
    </section>
  );
}
