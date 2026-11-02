"use client";

import { useState } from "react";
import { ancetres } from "@/lib/objectif";
import type { Roadmap } from "@/lib/schema";
import type { Progression } from "@/produits/progression";
import VueObjectif from "./VueObjectif";

/** Page d'essai : progression d'essai (fixe, pas celle du navigateur), sélection et événement émis. */
export default function LaboObjectif({ roadmap }: { roadmap: Roadmap }) {
  const [selection, setSelection] = useState<string | null>(null);
  const [a, b, c] = roadmap.noeuds;
  const progression: Progression = { ...(a && { [a.id]: "maitrise" }), ...(b && { [b.id]: "en-cours" }), ...(c && { [c.id]: "ignore" }) };
  // Cible d'essai : la compétence qui a le plus de prérequis, pour montrer un chemin critique.
  const [cible, setCible] = useState<string | null>(
    () => [...roadmap.noeuds].sort((x, y) => ancetres(roadmap, y.id).size - ancetres(roadmap, x.id).size)[0]?.id ?? null,
  );
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold">Objectif</h1>
      <p className="mono">Progression d&apos;essai : 1re compétence acquise, 2e vue, 3e ignorée.</p>
      <p className="mono" aria-live="polite" data-evenements>
        {selection ? `ouvrir « ${selection} »` : "Aucun événement."}
      </p>
      <div className="border" style={{ borderColor: "var(--filet)" }}>
        <VueObjectif
          roadmap={roadmap}
          cibleId={cible}
          progression={progression}
          selection={selection}
          large
          onOuvrir={setSelection}
          onChoisirCible={setCible}
        />
      </div>
    </section>
  );
}
