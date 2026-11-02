"use client";

import Link from "next/link";
import { calculerVisiteur } from "./etat";
import { useSignauxVisiteur } from "./useVisiteur";

const oui = (b: boolean) => (b ? "oui" : "non");

/** Page d'essai : l'état calculé et les signaux qui le justifient. Pour changer d'état : /labo/progression et /labo/parcours. */
export default function LaboVisiteur() {
  const signaux = useSignauxVisiteur();
  const lignes: [string, string][] = [
    ["État", calculerVisiteur(signaux)],
    ["Stockage lu", oui(signaux.pret)],
    ["Progression enregistrée", oui(signaux.progression)],
    ["Réponses au diagnostic enregistrées", oui(signaux.parcours)],
  ];
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Visiteur</h1>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t pt-4" style={{ borderColor: "var(--filet)" }}>
        {lignes.map(([k, v]) => (
          <div key={k} className="contents">
            <dt style={{ color: "var(--muted)" }}>{k}</dt>
            <dd className="mono" data-cle={k}>
              {v}
            </dd>
          </div>
        ))}
      </dl>
      <p style={{ color: "var(--muted)" }}>
        Pour passer d&apos;un état à l&apos;autre : <Link href="/labo/progression">/labo/progression</Link> et <Link href="/labo/parcours">/labo/parcours</Link>.
      </p>
    </section>
  );
}
