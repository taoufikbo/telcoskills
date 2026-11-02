"use client";

import Link from "next/link";
import { LIBELLE_NIVEAU } from "@/lib/libelles";
import type { Orientation } from "@/lib/orientation-schema";
import type { NoeudProgramme, Programme as DonneesProgramme, StatutProgramme } from "./calcul";

type Props = {
  programme: DonneesProgramme;
  /** Hypothèse éditoriale de heures par niveau (orientation.json), rappelée sous la liste. */
  parNiveau: Orientation["duree_par_niveau_heures"];
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

function Competence({ n, onOuvrir, href }: { n: NoeudProgramme } & Pick<Props, "onOuvrir" | "href">) {
  const s = STATUT[n.statut];
  const contenu = (
    <>
      <span className={n.statut === "hors-parcours" ? "line-through opacity-60" : ""}>{n.titre}</span>
      <span className="mono ml-2 whitespace-nowrap" style={{ color: "var(--muted)" }}>
        {LIBELLE_NIVEAU[n.niveau].toLowerCase()} · {n.heures} h
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

/** Le programme : les blocs dans l'ordre, les compétences de chacun, les heures estimées (indicatives) par bloc et au total. */
export default function Programme({ programme, parNiveau, onOuvrir, href, suivi = false }: Props) {
  return (
    <section aria-labelledby="titre-programme">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="titre-programme" className="text-lg font-semibold">
          Programme
        </h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {programme.blocs.length} blocs · {programme.actifs} compétences · <strong className="font-semibold" style={{ color: "var(--fg)" }}>{programme.heures} h</strong> estimées (estimation indicative)
        </p>
      </div>
      <ol className="mt-3 border-t" style={{ borderColor: "var(--filet)" }}>
        {programme.blocs.map((b, i) => (
          <li key={b.bloc} className="border-b" style={{ borderColor: "var(--filet)" }}>
            <details>
              <summary className={`flex min-h-11 cursor-pointer select-none flex-wrap items-baseline gap-x-4 gap-y-0.5 py-2 text-sm sm:grid sm:items-baseline ${suivi ? "sm:grid-cols-[1.5rem_minmax(0,1fr)_7rem_3.5rem_14rem]" : "sm:grid-cols-[1.5rem_minmax(0,1fr)_7rem_3.5rem]"}`}>
                <span className="mono w-6 shrink-0">{i + 1}</span>
                <span className="min-w-0 flex-1 basis-48 font-semibold sm:basis-auto">{b.bloc}</span>
                <span className="whitespace-nowrap tabular-nums sm:text-right">{b.actifs} compétences</span>
                <span className="whitespace-nowrap text-right font-semibold tabular-nums sm:w-auto">{b.heures} h</span>
                {suivi && (
                  <span className="whitespace-nowrap tabular-nums sm:text-right" style={{ color: "var(--muted)" }}>
                    {b.acquis}/{b.actifs} acquises
                    {b.semaineFin !== undefined ? ` · fin semaine ${b.semaineFin}` : b.actifs > 0 ? " · terminé" : ""}
                  </span>
                )}
              </summary>
              <ul className="pb-3 pl-9">
                {b.noeuds.map((n) => (
                  <Competence key={n.id} n={n} onOuvrir={onOuvrir} href={href} />
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
        Heures : hypothèse éditoriale par niveau de compétence ({LIBELLE_NIVEAU.fondamental.toLowerCase()} {parNiveau.fondamental} h, {LIBELLE_NIVEAU.intermediaire.toLowerCase()} {parNiveau.intermediaire} h, {LIBELLE_NIVEAU.avance.toLowerCase()} {parNiveau.avance} h, {LIBELLE_NIVEAU.transverse.toLowerCase()} {parNiveau.transverse} h), pas une mesure de votre temps réel.
      </p>
    </section>
  );
}
