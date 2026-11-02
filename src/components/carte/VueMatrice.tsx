"use client";

import { Fragment, useEffect, useMemo } from "react";
import { competencesParBloc } from "@/lib/carte";
import { LIBELLE_NIVEAU } from "@/lib/libelles";
import { PASTILLE_NIVEAU } from "@/lib/styles";
import { aspect, type Ctx } from "./types";

const STYLE_CELLULE = {
  neutre: "bg-black text-white dark:bg-white dark:text-black",
  "a-faire": "border-2 border-black bg-white text-black dark:border-white dark:bg-slate-950 dark:text-white",
  "en-cours": "bg-brand-cyan text-black",
  maitrise: "bg-brand-green text-white dark:bg-brand-green-light dark:text-black",
  ignore: "bg-slate-400 text-black",
  hors: "border-2 border-dashed border-slate-500 bg-transparent text-slate-600 dark:text-slate-300",
} as const;

/** Compétences (par domaine) × phases. Avec un profil, la couleur indique ce qui est acquis (testé) ou à acquérir. */
export default function VueMatrice({ ctx }: { ctx: Ctx }) {
  const { projet, index, liens, choisir, actif, estSel, etatCompetence, profil } = ctx;
  const groupes = useMemo(() => competencesParBloc(index), [index]);

  // Une compétence sélectionnée ailleurs (panneau, autre vue) est amenée à l'écran dans la matrice.
  const idSelectionne = ctx.sel?.type === "competence" ? ctx.sel.id : null;
  useEffect(() => {
    if (idSelectionne) document.getElementById(`matrice-${idSelectionne}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [idSelectionne]);

  const usages = (competence: string, phase: string) => index.activites.filter((a) => a.phase === phase && a.competences.includes(competence));
  const cellActive = (competence: string, phase: string) =>
    !liens || usages(competence, phase).some((a) => liens.activites.has(a.id));

  return (
    <div className="space-y-2">
      <div className="max-h-[75vh] overflow-auto border-2 border-black dark:border-white">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">Compétences nécessaires à chaque phase du projet, regroupées par domaine</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 top-0 z-30 border-b border-r border-black bg-white p-2 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:border-white dark:bg-slate-950">
                Compétence
              </th>
              {projet.phases.map((p, i) => (
                <th key={p.id} scope="col" className="sticky top-0 z-10 border-b border-r border-black bg-white p-0 dark:border-white dark:bg-slate-950">
                  <button
                    type="button"
                    title={p.titre}
                    aria-label={`Phase ${i + 1} : ${p.titre}`}
                    aria-pressed={estSel("phase", p.id)}
                    onClick={() => choisir({ type: "phase", id: p.id })}
                    className={`h-full w-full min-w-11 p-2 text-center font-bold hover:bg-orange hover:text-black ${aspect(actif("phase", p.id), estSel("phase", p.id))}`}
                  >
                    {i + 1}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupes.map((g) => (
              <Fragment key={g.bloc}>
                <tr>
                  <th colSpan={projet.phases.length + 1} scope="colgroup" className="bg-slate-100 p-1.5 text-left text-xs font-bold uppercase tracking-wide dark:bg-slate-900">
                    {g.bloc}
                  </th>
                </tr>
                {g.competences.map((c) => {
                  const etat = etatCompetence(c.id);
                  return (
                    <tr key={c.id} id={`matrice-${c.id}`}>
                      <th scope="row" className="sticky left-0 z-10 border-b border-r border-slate-300 bg-white p-0 text-left font-normal dark:border-slate-700 dark:bg-slate-950">
                        <button
                          type="button"
                          aria-pressed={estSel("competence", c.id)}
                          onClick={() => choisir({ type: "competence", id: c.id })}
                          className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-orange hover:text-black ${aspect(actif("competence", c.id), estSel("competence", c.id))}`}
                          title={`${c.titre} · ${LIBELLE_NIVEAU[c.niveau]}`}
                        >
                          <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${PASTILLE_NIVEAU[c.niveau]}`} />
                          <span className="min-w-0 flex-1">{c.titre}</span>
                          {etat === "hors" && <span className="shrink-0 text-[10px] text-slate-500" title="Absente de la roadmap de votre rôle">↗</span>}
                        </button>
                      </th>
                      {projet.phases.map((p) => {
                        const nb = usages(c.id, p.id).length;
                        const a = cellActive(c.id, p.id);
                        return (
                          <td key={p.id} className="border-b border-r border-slate-300 p-1 text-center dark:border-slate-700">
                            {nb > 0 && (
                              <span
                                title={`${c.titre} · phase ${index.phases.indexOf(p.id) + 1} · ${nb} activité${nb > 1 ? "s" : ""}`}
                                className={`mx-auto flex h-5 w-5 items-center justify-center text-[10px] font-bold transition-opacity ${STYLE_CELLULE[etat ?? "neutre"]} ${a ? "" : "opacity-15"}`}
                              >
                                {nb}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        Le chiffre est le nombre d&apos;activités de la phase qui mobilisent la compétence.
        {profil?.roadmapId ? " Couleurs : vert acquise (testée), bleu vue, contour noir à découvrir, pointillés absente de la roadmap de votre rôle." : " Choisissez un profil pour colorer selon votre progression."}
      </p>
    </div>
  );
}
