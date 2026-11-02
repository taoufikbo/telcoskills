"use client";

import Bandeau from "./Bandeau";
import LienChoix from "./LienChoix";
import { useConsentement } from "./useConsentement";

/** Page d'essai : état du choix, bandeau forcé, lien de réouverture. Le script de mesure n'est pas chargé ici. */
export default function LaboConsentement() {
  const { choix, pret } = useConsentement();
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold">Consentement</h1>
      <p className="mono" data-choix>
        {pret ? `Choix mémorisé : ${choix ?? "aucun"}` : "Lecture du stockage…"}
      </p>
      <p>
        <LienChoix />
      </p>
      <Bandeau forcer />
    </section>
  );
}
