"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { suivre } from "@/produits/mesure";
import { calculer, reponsesCompletes, type Diagnostic as Donnees, type Niveau, type Reponses } from "@/lib/diagnostic-schema";

type Liens = Record<string, { titre: string; href: string }>;

const LIBELLE_NIVEAU: Record<Niveau, string> = { "a-consolider": "À consolider", "en-progres": "En progrès", solide: "Solide" };
const COULEUR_NIVEAU: Record<Niveau, string> = { "a-consolider": "var(--crit)", "en-progres": "var(--accent)", solide: "var(--ok)" };

/**
 * Auto-diagnostic d'une équipe plateforme télécom. Le score est calculé dans le navigateur :
 * les réponses ne sont ni envoyées, ni enregistrées.
 */
export default function Diagnostic({ donnees, liens, contact }: { donnees: Donnees; liens: Liens; /** Un canal de contact existe. */ contact: boolean }) {
  const [reponses, setReponses] = useState<Reponses>({});
  const [termine, setTermine] = useState(false);
  const titreResultat = useRef<HTMLHeadingElement>(null);

  const repondues = donnees.questions.filter((q) => reponses[q.id] !== undefined).length;
  const complet = reponsesCompletes(donnees, reponses);

  const terminer = () => {
    setTermine(true);
    suivre("diagnostic_termine", { score: calculer(donnees, reponses).pourcentage });
    requestAnimationFrame(() => titreResultat.current?.focus());
  };

  if (termine) {
    const resultat = calculer(donnees, reponses);
    const aTravailler = [...resultat.blocs].filter((b) => b.niveau !== "solide").sort((a, b) => a.points / a.maximum - b.points / b.maximum);
    return (
      <section aria-labelledby="titre-resultat" className="space-y-10">
        <header className="space-y-4">
          <h2 id="titre-resultat" ref={titreResultat} tabIndex={-1} className="text-3xl font-semibold outline-none">
            Votre résultat
          </h2>
          <p className="chiffre" aria-label={`Score global : ${resultat.pourcentage} pour cent`}>
            {resultat.pourcentage} %
          </p>
          <p className="mono">
            {resultat.points} points sur {resultat.maximum} · calculé dans votre navigateur, rien n&apos;est envoyé
          </p>
        </header>

        <ul className="space-y-3">
          {resultat.blocs.map((b) => (
            <li key={b.id} className="panneau p-4">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-lg font-semibold">{b.titre}</h3>
                <span className="mono" style={{ color: COULEUR_NIVEAU[b.niveau] }}>
                  {LIBELLE_NIVEAU[b.niveau]} · {b.points}/{b.maximum}
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }} aria-hidden="true">
                <div className="h-full rounded-full" style={{ width: `${(b.points / b.maximum) * 100}%`, background: COULEUR_NIVEAU[b.niveau] }} />
              </div>
            </li>
          ))}
        </ul>

        {aTravailler.length > 0 && (
          <section aria-labelledby="titre-pistes" className="space-y-4">
            <h3 id="titre-pistes" className="text-2xl font-semibold">
              Par où commencer
            </h3>
            {aTravailler.map((b) => (
              <div key={b.id} className="space-y-2">
                <p className="font-medium">{b.titre}</p>
                <ul className="flex flex-wrap gap-2">
                  {b.noeuds
                    .filter((id) => liens[id])
                    .map((id) => (
                      <li key={id}>
                        <Link href={liens[id].href} className="btn btn-ghost btn-sm">
                          {liens[id].titre}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        <div className="no-print flex flex-wrap gap-3">
          {contact && (
            <Link href="/contact" className="btn btn-primary">
              En parler
            </Link>
          )}
          <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
            Imprimer ou enregistrer en PDF
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setReponses({});
              setTermine(false);
              window.scrollTo({ top: 0 });
            }}
          >
            Recommencer
          </button>
        </div>
      </section>
    );
  }

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        if (complet) terminer();
      }}
    >
      <p className="mono" role="status" aria-live="polite">
        {repondues} réponse{repondues > 1 ? "s" : ""} sur {donnees.questions.length}
      </p>
      {donnees.questions.map((q, i) => (
        <fieldset key={q.id} className="panneau space-y-3 p-5">
          <legend className="px-1 text-lg font-medium">
            <span className="mono mr-2">{i + 1}/{donnees.questions.length}</span>
            {q.texte}
          </legend>
          <div className="grid gap-2">
            {q.options.map((option, niveau) => (
              <label
                key={option}
                className="flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition-colors has-[:checked]:border-[var(--fg)] has-[:checked]:bg-[var(--surface-2)]"
                style={{ borderColor: "var(--filet)" }}
              >
                <input
                  type="radio"
                  name={q.id}
                  value={niveau}
                  checked={reponses[q.id] === niveau}
                  onChange={() => setReponses((r) => ({ ...r, [q.id]: niveau }))}
                  className="mt-1 accent-[var(--accent)]"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50" disabled={!complet}>
          Voir mon résultat
        </button>
        {!complet && <span className="mono">Répondez aux {donnees.questions.length} questions pour voir le résultat.</span>}
      </div>
    </form>
  );
}
