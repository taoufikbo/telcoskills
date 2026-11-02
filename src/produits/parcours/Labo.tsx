"use client";

import { enregistrerReponses, useReponsesEnregistrees } from "./stockage";

/** Page d'essai : les réponses au diagnostic enregistrées dans ce navigateur. */
export default function LaboParcours() {
  const { reponses, pret } = useReponsesEnregistrees();
  if (!pret) return <p className="mono">Lecture du stockage local…</p>;
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Parcours</h1>
      {reponses ? (
        <>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t pt-4" style={{ borderColor: "var(--filet)" }}>
            {Object.entries(reponses).map(([k, v]) => (
              <div key={k} className="contents">
                <dt style={{ color: "var(--muted)" }}>{k}</dt>
                <dd className="mono">{v}</dd>
              </div>
            ))}
          </dl>
          <button type="button" className="bouton" onClick={() => enregistrerReponses(null)}>
            Oublier les réponses
          </button>
        </>
      ) : (
        <p>Aucune réponse au diagnostic n&apos;est enregistrée dans ce navigateur.</p>
      )}
    </section>
  );
}
