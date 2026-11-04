"use client";

import Link from "next/link";
import { LIBELLE_NIVEAU } from "@/lib/libelles";
import { DEFINITION_PALIER, LIBELLE_INVESTISSEMENT, libelleEffort } from "@/lib/palier";
import type { NoeudProgramme, Programme as DonneesProgramme, StatutProgramme } from "./calcul";

type Props = {
  programme: DonneesProgramme;
  /** Événement de sortie « ouvrir la compétence X ». Sans lui, chaque compétence est un lien (`href`). */
  onOuvrir?: (id: string) => void;
  href?: (id: string) => string;
  /** Afficher l'acquis par bloc et les semaines de fin (programme suivi) ; sinon seulement le programme. */
  suivi?: boolean;
};

const STATUT: Record<StatutProgramme, { marque: string; texte: string } | null> = {
  "a-decouvrir": null,
  vu: { marque: "◐", texte: "vu" },
  "acquis-teste": { marque: "●", texte: "acquis" },
  "a-revoir": { marque: "●", texte: "à revoir" },
  "hors-parcours": { marque: "–", texte: "sorti du parcours" },
};

function Competence({ n, onOuvrir, href, suivi }: { n: NoeudProgramme; suivi: boolean } & Pick<Props, "onOuvrir" | "href">) {
  const s = STATUT[n.statut];
  const contenu = (
    <>
      <span className={n.statut === "hors-parcours" ? "line-through opacity-60" : ""}>{n.titre}</span>
      <span className="mono ml-2 whitespace-nowrap" style={{ color: "var(--muted)" }}>
        {LIBELLE_NIVEAU[n.niveau].toLowerCase()}
        {n.cible !== undefined && (suivi && n.palier !== undefined ? ` · palier ${n.palier}/${n.cible}` : ` · palier ${n.cible}`)}
        {n.investissement !== undefined && ` · ${LIBELLE_INVESTISSEMENT[n.investissement]}`}
      </span>
    </>
  );
  const lien = "underline decoration-[var(--bord)] underline-offset-4 hover:decoration-[var(--fg)]";
  return (
    <li className="flex items-baseline gap-2 py-1 text-sm">
      <span aria-hidden className="w-3 shrink-0 text-center">
        {s?.marque ?? "○"}
      </span>
      {onOuvrir ? (
        <button type="button" className={`text-left ${lien}`} onClick={() => onOuvrir(n.id)}>
          {contenu}
        </button>
      ) : href ? (
        <Link href={href(n.id)} className={lien}>
          {contenu}
        </Link>
      ) : (
        <span>{contenu}</span>
      )}
      {s && <span className="mono ml-auto whitespace-nowrap">{s.texte}</span>}
    </li>
  );
}

/** Le programme : les blocs dans l'ordre, les compétences de chacun, le palier visé et l'investissement (léger, moyen, long) par bloc et au total. */
export default function Programme({ programme, onOuvrir, href, suivi = false }: Props) {
  return (
    <section aria-labelledby="titre-programme">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="titre-programme" className="text-lg font-semibold">
          Programme
        </h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {programme.blocs.length} blocs · {programme.actifs} compétences{libelleEffort(programme.effort) && <> · <strong className="font-semibold" style={{ color: "var(--fg)" }}>{libelleEffort(programme.effort)}</strong></>}
        </p>
      </div>
      <ol className="mt-3 border-t" style={{ borderColor: "var(--filet)" }}>
        {programme.blocs.map((b, i) => (
          <li key={b.bloc} className="border-b" style={{ borderColor: "var(--filet)" }}>
            <details>
              <summary className={`flex min-h-11 cursor-pointer select-none flex-wrap items-baseline gap-x-4 gap-y-0.5 py-2 text-sm sm:grid sm:items-baseline ${suivi ? "sm:grid-cols-[1.5rem_minmax(0,1fr)_7rem_13rem_14rem]" : "sm:grid-cols-[1.5rem_minmax(0,1fr)_7rem_13rem]"}`}>
                <span className="mono w-6 shrink-0">{i + 1}</span>
                <span className="min-w-0 flex-1 basis-48 font-semibold sm:basis-auto">{b.bloc}</span>
                <span className="whitespace-nowrap tabular-nums sm:text-right">{b.actifs} compétences</span>
                <span className="whitespace-nowrap text-right tabular-nums sm:w-auto" style={{ color: "var(--muted)" }}>
                  {libelleEffort(b.effort)}
                </span>
                {suivi && (
                  <span className="whitespace-nowrap tabular-nums sm:text-right" style={{ color: "var(--muted)" }}>
                    {b.acquis}/{b.actifs} acquises
                    {b.semaineFin !== undefined ? ` · fin semaine ${b.semaineFin}` : b.actifs > 0 ? " · terminé" : ""}
                  </span>
                )}
              </summary>
              <ul className="pb-3 pl-9">
                {b.noeuds.map((n) => (
                  <Competence key={n.id} n={n} onOuvrir={onOuvrir} href={href} suivi={suivi} />
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ol>
      <details className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
        <summary className="cursor-pointer select-none py-1">Que veulent dire « palier » et « léger, moyen, long » ?</summary>
        <div className="space-y-2 pt-1">
          <p>
            Le palier est ce qu&apos;il faut savoir faire pour ce métier. Il se pose compétence par compétence, et change d&apos;un métier à l&apos;autre. L&apos;investissement (léger, moyen, long) dépend du niveau de la
            compétence et du palier visé : c&apos;est une échelle, pas une durée.
          </p>
          <ol className="space-y-0.5">
            {([1, 2, 3, 4, 5] as const).map((p) => (
              <li key={p}>
                <strong className="font-semibold">Palier {p}</strong> : {DEFINITION_PALIER[p]}
              </li>
            ))}
          </ol>
        </div>
      </details>
    </section>
  );
}
