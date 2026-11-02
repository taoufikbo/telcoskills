"use client";

import { useState } from "react";
import type { Progression } from "@/produits/progression";
import CarteHeros from "./CarteHeros";
import type { Disposition } from "./disposition";

/** Page d'essai : la carte sans progression, puis avec une progression d'essai (fixe, pas celle du navigateur), et l'événement émis. */
export default function LaboCarteHeros({ disposition }: { disposition: Disposition }) {
  const [evenements, setEvenements] = useState<string[]>([]);
  const [premier, second] = disposition.chemin;
  const essai: Progression = { ...(premier && { [premier.id]: "maitrise" }), ...(second && { [second.id]: "en-cours" }) };
  const ouvrir = (id: string) => setEvenements((e) => [`ouvrir « ${id} »`, ...e].slice(0, 5));
  return (
    <section className="space-y-8">
      <h1 className="text-3xl font-semibold">Carte héros</h1>
      <figure className="space-y-3">
        <figcaption className="mono">Sans progression, chaque compétence est un lien.</figcaption>
        <CarteHeros disposition={disposition} />
      </figure>
      <figure className="space-y-3">
        <figcaption className="mono">Progression d&apos;essai (1re étape acquise, 2e vue) ; les clics émettent l&apos;événement au lieu de naviguer.</figcaption>
        <CarteHeros disposition={disposition} progression={essai} onOuvrir={ouvrir} />
      </figure>
      <p className="mono" aria-live="polite" data-evenements>
        {evenements.length ? evenements.join(" · ") : "Aucun événement."}
      </p>
    </section>
  );
}
