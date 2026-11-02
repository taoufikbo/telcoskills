"use client";

import { LIBELLE_NIVEAU, LIBELLE_STATUT } from "@/lib/libelles";
import { LIBELLE_DEMANDE_COURT, PASTILLE_NIVEAU, STYLE_DEMANDE, STYLE_STATUT } from "@/lib/styles";
import type { Progression } from "@/produits/progression";
import { lignesParBloc, type RoadmapListe } from "./lignes";

type Props = {
  roadmap: RoadmapListe;
  /** Compétence ouverte, mise en évidence. */
  selection: string | null;
  /** Progression en lecture seule. */
  progression: Progression;
  /** Chemin conseillé (mode objectif), ou null. */
  chemin: Set<string> | null;
  /** Événement de sortie « ouvrir la compétence X ». */
  onOuvrir: (id: string) => void;
};

/** Visualisation « Liste » : les compétences par bloc, pour les écrans étroits et la lecture linéaire. */
export default function Liste({ roadmap, selection, progression, chemin, onOuvrir }: Props) {
  return (
    <div className="space-y-6 p-4">
      {lignesParBloc(roadmap, progression, chemin).map(({ bloc, lignes }) => (
        <section key={bloc} aria-labelledby={`bloc-${bloc}`}>
          <h2 id={`bloc-${bloc}`} className="text-base font-semibold">
            {bloc}
          </h2>
          <ul className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {lignes.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => onOuvrir(n.id)}
                  aria-current={n.id === selection}
                  className={`flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left aria-[current=true]:bg-slate-100 dark:aria-[current=true]:bg-slate-800 ${n.attenuee ? "opacity-40" : ""}`}
                >
                  <span className={`h-3 w-3 shrink-0 rounded-full ${PASTILLE_NIVEAU[n.niveau]}`} title={LIBELLE_NIVEAU[n.niveau]} aria-label={LIBELLE_NIVEAU[n.niveau]} />
                  <span className={`flex-1 text-sm ${n.statut === "ignore" ? "text-slate-400 line-through" : ""}`}>
                    {n.surChemin && (
                      <>
                        <span aria-hidden>★ </span>
                        <span className="sr-only">Chemin conseillé : </span>
                      </>
                    )}
                    {n.titre}
                  </span>
                  {n.statut !== "a-faire" && <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${STYLE_STATUT[n.statut]}`}>{LIBELLE_STATUT[n.statut]}</span>}
                  {n.demande && <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${STYLE_DEMANDE[n.demande]}`}>{LIBELLE_DEMANDE_COURT[n.demande]}</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
