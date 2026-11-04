import Link from "next/link";
import { DEFINITION_PALIER } from "@/lib/palier";
import type { PratiqueNoeud } from "@/lib/pratique-schema";
import { BASE_PROJET } from "@/lib/urls";
import NotionsCompetence from "./NotionsCompetence";
import QuizCompetence from "./QuizCompetence";
import SchemaBoites from "./SchemaBoites";

type Props = {
  noeudId: string;
  pratique: PratiqueNoeud;
  /** Libellés de l'activité du projet fil rouge où la compétence sert (si `lienProjet` est renseigné). */
  projet?: { phase: string; role: string };
  /** Palier visé pour ce métier, dans le parcours consulté : la validation n'est montrée que jusqu'à lui. */
  cible?: number;
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
export default function FichePratique({ noeudId, pratique: p, projet, cible }: Props) {
  const { questionPrealable: depart, fiche, contenu, pourquoi, rappel } = p;
  const paliers = fiche?.validation ? (["1", "2", "3", "4", "5"] as const).filter((k) => fiche.validation![k]) : [];
  const jusqua = cible ?? 5;
  const exiges = paliers.filter((k) => Number(k) <= jusqua);
  const auDela = paliers.filter((k) => Number(k) > jusqua);
  return (
    <>
      {fiche && (
        <section aria-labelledby="titre-objectifs" className="space-y-3">
          <h2 id="titre-objectifs" className="text-2xl font-semibold">
            Ce que vous saurez faire
            {fiche.statut === "brouillon" && BROUILLON}
          </h2>
          <ul className="list-disc space-y-1.5 pl-6">
            {fiche.objectifs.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </section>
      )}

      {depart && <QuizCompetence noeudId={noeudId} mode="depart" titre="Pour démarrer" questions={[depart]} />}

      {(fiche || contenu) && (
        <section aria-labelledby="titre-maitriser" className="space-y-5">
          <h2 id="titre-maitriser" className="text-2xl font-semibold">
            Ce qu&apos;il faut maîtriser
            {(contenu?.statut === "brouillon" || (!contenu && fiche?.statut === "brouillon")) && BROUILLON}
          </h2>
          {fiche && <NotionsCompetence noeudId={noeudId} notions={fiche.notions} />}
          {contenu && contenu.vocabulaire.length > 0 && (
            <dl className="panneau grid gap-x-6 gap-y-3 p-4 sm:grid-cols-[minmax(0,14rem)_1fr]">
              {contenu.vocabulaire.map((v) => (
                <div key={v.terme} className="contents">
                  <dt className="font-semibold">{v.terme}</dt>
                  <dd style={{ color: "var(--muted)" }}>{v.definition}</dd>
                </div>
              ))}
            </dl>
          )}
          {contenu && (
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
          )}
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

      {fiche?.situation && (
        <section aria-labelledby="titre-situation" className="space-y-3">
          <h2 id="titre-situation" className="text-2xl font-semibold">
            Mise en situation
          </h2>
          <p>{fiche.situation.contexte}</p>
          <ol className="list-decimal space-y-1.5 pl-6">
            {fiche.situation.etapes.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ol>
        </section>
      )}

      {fiche?.exercice && (
        <section aria-labelledby="titre-exercice" className="space-y-3">
          <h2 id="titre-exercice" className="text-2xl font-semibold">
            Pour s&apos;exercer
          </h2>
          <p>{fiche.exercice.consigne}</p>
          <p>
            <strong>Livrable attendu :</strong> {fiche.exercice.livrable}
          </p>
        </section>
      )}

      {exiges.length > 0 && (
        <section aria-labelledby="titre-validation" className="space-y-3">
          <h2 id="titre-validation" className="text-2xl font-semibold">
            Validation{cible !== undefined ? ` au palier visé (${cible} sur 5)` : ""}
          </h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Les critères sont cumulatifs : chaque palier suppose les précédents. Le palier visé dépend du métier.
          </p>
          <ol className="space-y-3">
            {exiges.map((k) => (
              <li key={k} className="panneau p-4">
                <p className="font-semibold">
                  Palier {k} <span className="font-normal" style={{ color: "var(--muted)" }}>: {DEFINITION_PALIER[Number(k) as 1 | 2 | 3 | 4 | 5]}</span>
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  {fiche!.validation![k]!.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          {auDela.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer select-none py-1 font-semibold">Au-delà du palier visé (non exigé pour ce parcours)</summary>
              <ol className="mt-2 space-y-3">
                {auDela.map((k) => (
                  <li key={k}>
                    <p className="font-semibold">Palier {k}</p>
                    <ul className="list-disc space-y-1 pl-6">
                      {fiche!.validation![k]!.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </details>
          )}
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
