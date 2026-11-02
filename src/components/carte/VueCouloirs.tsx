"use client";

import { aspect, type Ctx } from "./types";

/** Rôles en lignes, phases en colonnes, jalons en losanges sur la ligne du temps. */
export default function VueCouloirs({ ctx }: { ctx: Ctx }) {
  const { projet, index, choisir, actif, estSel } = ctx;
  const n = projet.phases.length;
  const cellule = "border-b border-r border-slate-300 p-2 dark:border-slate-700";
  const etiquette = "sticky left-0 z-20 border-b border-r border-black bg-white p-2 text-left dark:border-white dark:bg-slate-950";

  return (
    <div className="max-h-[75vh] overflow-auto border-2 border-black dark:border-white">
      <div className="grid min-w-max" style={{ gridTemplateColumns: `11rem repeat(${n}, minmax(14rem, 1fr))` }}>
        <div className={`${etiquette} sticky top-0 z-30 text-[11px] font-bold uppercase tracking-wide text-slate-500`}>Rôles / phases</div>
        {projet.phases.map((p, i) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={estSel("phase", p.id)}
            onClick={() => choisir({ type: "phase", id: p.id })}
            className={`sticky top-0 z-10 border-b border-r border-black bg-white p-2 text-left hover:bg-orange hover:text-black dark:border-white dark:bg-slate-950 ${aspect(actif("phase", p.id), estSel("phase", p.id))}`}
          >
            <span className="mr-1.5 inline-flex h-6 w-6 items-center justify-center bg-orange text-sm font-bold text-black" aria-hidden>
              {i + 1}
            </span>
            <span className="text-sm font-bold">{p.titre}</span>
          </button>
        ))}

        <div className={`${etiquette} text-[11px] font-bold uppercase tracking-wide text-slate-500`}>Jalons</div>
        {projet.phases.map((p, i) => (
          <div key={p.id} className={`relative flex flex-col items-center gap-1 px-2 pb-2 pt-3 ${cellule}`}>
            <div aria-hidden className="absolute left-0 right-0 top-[1.85rem] h-0.5 bg-slate-400" />
            <button
              type="button"
              aria-pressed={estSel("jalon", p.id)}
              aria-label={`Jalon de la phase ${i + 1} : ${p.jalon.titre}`}
              onClick={() => choisir({ type: "jalon", id: p.id })}
              className={`relative z-10 flex h-9 w-9 rotate-45 items-center justify-center border-2 border-black bg-white hover:bg-orange dark:border-white dark:bg-slate-950 dark:hover:bg-orange ${aspect(actif("jalon", p.id), estSel("jalon", p.id))}`}
            >
              <span className="-rotate-45 text-xs font-bold hover:text-black">◆</span>
            </button>
            <span className={`mt-1 text-center text-[11px] leading-tight ${actif("jalon", p.id) ? "" : "opacity-25"}`}>{p.jalon.titre}</span>
          </div>
        ))}

        {projet.roles.map((r) => (
          <div key={r.id} className="contents">
            <button
              type="button"
              aria-pressed={estSel("role", r.id)}
              onClick={() => choisir({ type: "role", id: r.id })}
              className={`${etiquette} hover:bg-orange hover:text-black ${aspect(actif("role", r.id), estSel("role", r.id))}`}
            >
              <span className="block text-sm font-bold leading-tight">{r.libelle}</span>
            </button>
            {projet.phases.map((p) => {
              const activites = index.activites.filter((a) => a.phase === p.id && a.roles.includes(r.id));
              return (
                <div key={p.id} className={`flex flex-col gap-1.5 ${cellule}`}>
                  {activites.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      title={a.titre}
                      aria-pressed={estSel("activite", a.id)}
                      onClick={() => choisir({ type: "activite", id: a.id })}
                      className={`border border-black px-1.5 py-1 text-left text-[11px] leading-tight hover:bg-orange hover:text-black dark:border-white ${estSel("activite", a.id) ? "bg-orange text-black" : ""} ${aspect(actif("activite", a.id), false)}`}
                    >
                      {a.titre}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
