"use client";

import { useState } from "react";
import { etatVide, marquerVu, retirerVu } from "./etat";
import { encoderLienEtat, nombreDeCompetences } from "./lien-etat";
import { aDeLaProgression } from "./signal";
import { usePratique } from "./usePratique";

type Props = { essai: { id: string; titre: string } };

/** Page d'essai : ce que le produit a stocké dans ce navigateur, et deux actions pour passer d'un état à l'autre. */
export default function LaboProgression({ essai }: Props) {
  const { etat, muter, pret } = usePratique();
  const [lien, setLien] = useState("");
  if (!pret) return <p className="mono">Lecture du stockage local…</p>;

  const vue = !!etat.noeuds[essai.id]?.vu;
  const lignes: [string, string][] = [
    ["Trace enregistrée", aDeLaProgression(etat) ? "oui" : "non"],
    ["Compétences suivies", String(nombreDeCompetences(etat))],
    ["Parcours suivis", etat.parcours.length ? etat.parcours.join(", ") : "aucun"],
    ["État créé le", etat.creeLe],
    ["Anciennes progressions reprises", etat.migre ? "oui" : "non"],
  ];

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Progression</h1>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t pt-4" style={{ borderColor: "var(--filet)" }}>
        {lignes.map(([k, v]) => (
          <div key={k} className="contents">
            <dt style={{ color: "var(--muted)" }}>{k}</dt>
            <dd className="mono">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="bouton" onClick={() => muter((e, n) => (vue ? retirerVu(e, essai.id) : marquerVu(e, essai.id, n)))}>
          {vue ? `Retirer « ${essai.titre} » des compétences vues` : `Marquer « ${essai.titre} » comme vue`}
        </button>
        <button type="button" className="bouton" onClick={() => setLien(encoderLienEtat(etat))}>
          Générer le lien de partage
        </button>
        <button
          type="button"
          className="bouton"
          onClick={() => {
            if (window.confirm("Effacer toute la progression de ce navigateur ?")) muter((_, n) => ({ ...etatVide(n), migre: true, messageMigrationVu: true }));
          }}
        >
          Tout effacer
        </button>
      </div>
      {lien && (
        <p className="mono break-all" aria-live="polite">
          {lien}
        </p>
      )}
    </section>
  );
}
