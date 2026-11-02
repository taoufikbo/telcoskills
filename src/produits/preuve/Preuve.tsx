import type { Chiffre } from "./chiffres";

/** Bandeau de preuves : des chiffres et leur source. Rien à afficher, rien d'affiché. */
export default function Preuve({ chiffres, titre = "Le catalogue en chiffres" }: { chiffres: Chiffre[]; titre?: string }) {
  if (chiffres.length === 0) return null;
  const sources = [...new Set(chiffres.map((c) => c.source))];
  return (
    <section aria-label={titre} className="border-y" style={{ borderColor: "var(--filet)" }}>
      <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-0 sm:grid-cols-4" style={{ background: "var(--filet)" }}>
        {chiffres.map((c) => (
          <div key={c.libelle} className="space-y-2 px-4 py-6 sm:px-6" style={{ background: "var(--bg)" }}>
            <dd className="chiffre">{c.valeur}</dd>
            <dt className="mono">{c.libelle}</dt>
          </div>
        ))}
      </dl>
      <p className="mono mx-auto max-w-6xl px-4 py-2 text-xs sm:px-6">Source : {sources.join(" ; ")}, calculé à la publication.</p>
    </section>
  );
}
