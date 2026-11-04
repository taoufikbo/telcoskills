import type { Chiffre } from "./chiffres";

/** Bandeau de preuves : des chiffres. Rien à afficher, rien d'affiché. */
export default function Preuve({ chiffres, titre = "Le catalogue en chiffres" }: { chiffres: Chiffre[]; titre?: string }) {
  if (chiffres.length === 0) return null;
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
    </section>
  );
}
