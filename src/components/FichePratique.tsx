import Link from "next/link";
import type { PratiqueNoeud } from "@/lib/pratique-schema";
import { BASE_PROJET } from "@/lib/urls";
import QuizCompetence from "./QuizCompetence";
import SchemaBoites from "./SchemaBoites";

type Props = {
  noeudId: string;
  pratique: PratiqueNoeud;
  /** Libellés de l'activité du projet fil rouge où la compétence sert (si `lienProjet` est renseigné). */
  projet?: { phase: string; role: string };
};

const BROUILLON = (
  <span className="mono ml-2 rounded border px-1.5 py-0.5 align-middle text-xs font-normal" style={{ borderColor: "var(--crit)", color: "var(--crit)" }}>
    brouillon, non relu
  </span>
);

/**
 * Ce que la page de compétence dit au-delà de son résumé : les notions à maîtriser (vocabulaire, segments et schémas),
 * le « pourquoi » d'un choix, l'usage dans le projet fil rouge et un mini-quiz. Tout est facultatif : une section sans contenu
 * validé n'existe pas (en production, les brouillons sont retirés avant d'arriver ici ; en développement, ils sont signalés).
 */
export default function FichePratique({ noeudId, pratique: p, projet }: Props) {
  const { questionPrealable: depart, contenu, pourquoi, rappel } = p;
  return (
    <>
      {depart && <QuizCompetence noeudId={noeudId} mode="depart" titre="Pour démarrer" questions={[depart]} />}

      {contenu && (
        <section aria-labelledby="titre-maitriser" className="space-y-5">
          <h2 id="titre-maitriser" className="text-2xl font-semibold">
            Ce qu&apos;il faut maîtriser
            {contenu.statut === "brouillon" && BROUILLON}
          </h2>
          {contenu.vocabulaire.length > 0 && (
            <dl className="panneau grid gap-x-6 gap-y-3 p-4 sm:grid-cols-[minmax(0,14rem)_1fr]">
              {contenu.vocabulaire.map((v) => (
                <div key={v.terme} className="contents">
                  <dt className="font-semibold">{v.terme}</dt>
                  <dd style={{ color: "var(--muted)" }}>{v.definition}</dd>
                </div>
              ))}
            </dl>
          )}
          <ol className="space-y-6">
            {contenu.segments.map((s, i) => (
              <li key={s.titre} className="space-y-2">
                <h3 className="text-lg font-semibold">
                  <span className="mono mr-2">{String(i + 1).padStart(2, "0")}</span>
                  {s.titre}
                </h3>
                <ul className="list-disc space-y-1 pl-6">
                  {s.elements.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
                {s.schema && <SchemaBoites {...s.schema} />}
              </li>
            ))}
          </ol>
        </section>
      )}

      {pourquoi && (
        <section aria-labelledby="titre-pourquoi" className="space-y-3">
          <h2 id="titre-pourquoi" className="text-2xl font-semibold">
            Pourquoi ce choix ?
            {pourquoi.statut === "brouillon" && BROUILLON}
          </h2>
          <p className="text-lg font-medium">{pourquoi.question}</p>
          <p className="prose-site">{pourquoi.reference}</p>
          <p className="mono text-xs">Source : {pourquoi.source}</p>
        </section>
      )}

      {projet && (
        <section aria-labelledby="titre-projet-competence" className="space-y-2">
          <h2 id="titre-projet-competence" className="text-2xl font-semibold">
            Dans le projet fil rouge
          </h2>
          <p>
            Cette compétence sert pendant la phase « {projet.phase} », pour le rôle « {projet.role} ».{" "}
            <Link href={BASE_PROJET} className="underline underline-offset-4">
              Voir le projet
            </Link>
          </p>
        </section>
      )}

      {rappel && rappel.length > 0 && <QuizCompetence noeudId={noeudId} mode="rappel" titre="Vérifiez vos acquis" questions={rappel} />}
    </>
  );
}
