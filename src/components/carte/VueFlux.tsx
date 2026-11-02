"use client";

import { useMemo } from "react";
import { competencesParBloc, fluxPhasesBlocs, fluxRolesPhases } from "@/lib/carte";
import { cheminRuban, disposerFlux } from "@/lib/sankey";
import type { TypeEntite } from "@/lib/carte";
import type { Ctx } from "./types";

const MARGE_G = 190;
const MARGE_D = 270;
const L = 760;
const H = 560;

/** Diagramme de flux : rôles → phases → domaines de compétences. La largeur d'une bande est l'effort (activités, compétences). */
export default function VueFlux({ ctx }: { ctx: Ctx }) {
  const { projet, index, liens, choisir, actif, estSel } = ctx;

  const disposition = useMemo(() => {
    const rp = fluxRolesPhases(index);
    const pb = fluxPhasesBlocs(index);
    const blocs = competencesParBloc(index).map((g) => g.bloc);
    const taille = (m: Map<string, number>, id: string) => m.get(id) ?? 0;
    const tRole = new Map<string, number>();
    const tPhase = new Map<string, number>();
    const tBloc = new Map<string, number>();
    for (const l of rp) tRole.set(l.role, taille(tRole, l.role) + l.valeur);
    for (const a of index.activites) tPhase.set(a.phase, taille(tPhase, a.phase) + 1);
    for (const l of pb) tBloc.set(l.bloc, taille(tBloc, l.bloc) + l.valeur);

    return disposerFlux(
      [
        projet.roles.filter((r) => tRole.has(r.id)).map((r) => ({ id: `role:${r.id}`, label: r.libelle, taille: tRole.get(r.id)! })),
        projet.phases.map((p, i) => ({ id: `phase:${p.id}`, label: `${i + 1} · ${p.titre}`, taille: tPhase.get(p.id) ?? 1 })),
        blocs.filter((b) => tBloc.has(b)).map((b) => ({ id: `bloc:${b}`, label: b, taille: tBloc.get(b)! })),
      ],
      [
        ...rp.map((l) => ({ source: `role:${l.role}`, cible: `phase:${l.phase}`, valeur: l.valeur })),
        ...pb.map((l) => ({ source: `phase:${l.phase}`, cible: `bloc:${l.bloc}`, valeur: l.valeur })),
      ],
      { largeur: L, hauteur: H, largeurNoeud: 14, ecart: 10 },
    );
  }, [index, projet]);

  /** Une bande est éclairée s'il existe une activité liée à la sélection qui l'emprunte. */
  const lienActif = (source: string, cible: string) => {
    if (!liens) return true;
    const [ts, is] = source.split(/:(.*)/s);
    const [, ic] = cible.split(/:(.*)/s);
    return index.activites.some((a) => {
      if (!liens.activites.has(a.id)) return false;
      if (ts === "role") return a.phase === ic && a.roles.includes(is);
      return a.phase === is && a.competences.some((c) => `bloc:${index.competences.get(c)!.bloc}` === cible);
    });
  };

  const noeudActif = (id: string) => {
    const [type, ref] = id.split(/:(.*)/s);
    if (type === "bloc") return !liens || disposition.liens.some((l) => l.cible === id && lienActif(l.source, l.cible));
    return actif(type as TypeEntite, ref);
  };

  return (
    <div className="overflow-x-auto border-2 border-black p-2 [--fond:#fff] dark:border-white dark:[--fond:#141414]">
      <svg
        viewBox={`0 0 ${MARGE_G + L + MARGE_D} ${H + 8}`}
        className="min-w-[900px]"
        role="group"
        aria-label="Diagramme de flux : rôles, phases et domaines de compétences"
      >
        <g transform={`translate(${MARGE_G},4)`}>
          {disposition.liens.map((l) => {
            const a = lienActif(l.source, l.cible);
            return (
              <path
                key={`${l.source}>${l.cible}`}
                d={cheminRuban(l)}
                className={a ? (liens ? "fill-orange" : "fill-slate-400") : "fill-slate-400"}
                style={{ opacity: a ? (liens ? 0.7 : 0.35) : 0.07, transition: "opacity .15s" }}
              >
                <title>{`${l.valeur} ${l.source.startsWith("role") ? "activité(s)" : "compétence(s)"}`}</title>
              </path>
            );
          })}
          {disposition.noeuds.map((n) => {
            const [type, ref] = n.id.split(/:(.*)/s);
            const interactif = type !== "bloc";
            const a = noeudActif(n.id);
            const sel = interactif && estSel(type as TypeEntite, ref);
            const fill = type === "role" ? "fill-black dark:fill-white" : type === "phase" ? "fill-orange" : "fill-slate-500";
            const ancre = n.colonne === 0 ? "end" : "start";
            const tx = n.colonne === 0 ? -8 : n.w + 8;
            return (
              <g
                key={n.id}
                role={interactif ? "button" : undefined}
                tabIndex={interactif ? 0 : undefined}
                aria-pressed={interactif ? sel : undefined}
                aria-label={n.label}
                onClick={interactif ? () => choisir({ type: type as TypeEntite, id: ref }) : undefined}
                onKeyDown={interactif ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), choisir({ type: type as TypeEntite, id: ref })) : undefined}
                className={interactif ? "cursor-pointer focus-visible:outline-none [&:focus-visible>rect]:stroke-[3px]" : ""}
                style={{ opacity: a ? 1 : 0.25, transition: "opacity .15s" }}
                transform={`translate(${n.x},${n.y})`}
              >
                <rect width={n.w} height={n.h} className={`${fill} stroke-black dark:stroke-white`} strokeWidth={sel ? 3 : 0.5} />
                <text
                  x={tx}
                  y={n.h / 2}
                  dy="0.35em"
                  textAnchor={ancre}
                  fontSize={12}
                  fontWeight={interactif ? 700 : 400}
                  className="fill-black dark:fill-white"
                  stroke="var(--fond)"
                  strokeWidth={4}
                  paintOrder="stroke"
                >
                  {n.label.length > 38 ? `${n.label.slice(0, 37)}…` : n.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <p className="px-1 pb-1 text-xs text-slate-500">
        Largeur des bandes : nombre d&apos;activités (rôles → phases) puis de compétences distinctes (phases → domaines). Cliquez un rôle ou une
        phase pour isoler ses flux.
      </p>
    </div>
  );
}
