"use client";

import { useState } from "react";
import type { Roadmap } from "@/lib/schema";
import type { Progression } from "@/produits/progression";
import GrapheRoadmap from "./GrapheRoadmap";

/** Page d'essai : progression d'essai (fixe, pas celle du navigateur), sélection et événement émis. */
export default function LaboArbre({ roadmap }: { roadmap: Roadmap }) {
  const [selection, setSelection] = useState<string | null>(null);
  const [a, b, c] = roadmap.noeuds;
  const progression: Progression = { ...(a && { [a.id]: "maitrise" }), ...(b && { [b.id]: "en-cours" }), ...(c && { [c.id]: "ignore" }) };
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold">Arbre</h1>
      <p className="mono">Progression d&apos;essai : 1re compétence acquise, 2e vue, 3e ignorée.</p>
      <p className="mono" aria-live="polite" data-evenements>
        {selection ? `ouvrir « ${selection} »` : "Aucun événement."}
      </p>
      <div className="h-[640px] border" style={{ borderColor: "var(--filet)" }}>
        <GrapheRoadmap roadmap={roadmap} selection={selection} progression={progression} chemin={null} onOuvrir={setSelection} />
      </div>
    </section>
  );
}
