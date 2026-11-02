"use client";

import { useState } from "react";
import type { Progression } from "@/produits/progression";
import Liste from "./Liste";
import type { RoadmapListe } from "./lignes";

/** Page d'essai : progression et chemin d'essai (fixes, pas ceux du navigateur), sélection et événement émis. */
export default function LaboListe({ roadmap }: { roadmap: RoadmapListe }) {
  const [selection, setSelection] = useState<string | null>(null);
  const [avecChemin, setAvecChemin] = useState(false);
  const [a, b, c, d] = roadmap.noeuds;
  const progression: Progression = { ...(a && { [a.id]: "maitrise" }), ...(b && { [b.id]: "en-cours" }), ...(c && { [c.id]: "ignore" }) };
  const chemin = avecChemin ? new Set([a, b, d].filter(Boolean).map((n) => n.id)) : null;
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold">Liste</h1>
      <p className="mono">Progression d&apos;essai : 1re compétence acquise, 2e vue, 3e ignorée.</p>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={avecChemin} onChange={(e) => setAvecChemin(e.target.checked)} /> Chemin d&apos;essai (mode objectif)
        </label>
        <p className="mono" aria-live="polite" data-evenements>
          {selection ? `ouvrir « ${selection} »` : "Aucun événement."}
        </p>
      </div>
      <div className="max-w-md border" style={{ borderColor: "var(--filet)" }}>
        <Liste roadmap={roadmap} selection={selection} progression={progression} chemin={chemin} onOuvrir={setSelection} />
      </div>
    </section>
  );
}
