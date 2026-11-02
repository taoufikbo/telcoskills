import type { ReactNode } from "react";

/** Page d'une section pas encore rédigée : titre et présentation neutres, brouillons pour l'auteur, mention publique. */
export default function PageEbauche({ titre, intro, children, enCours = true }: { titre: string; intro: string; children?: ReactNode; enCours?: boolean }) {
  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-14 sm:px-6 sm:py-20">
      <header className="space-y-4">
        <h1 className="text-4xl font-semibold sm:text-5xl">{titre}</h1>
        <p className="max-w-2xl text-lg" style={{ color: "var(--muted)" }}>
          {intro}
        </p>
      </header>
      {children}
      {enCours && (
        <p className="mono border-t pt-4" style={{ borderColor: "var(--filet)" }}>
          Cette section est en cours de rédaction.
        </p>
      )}
    </main>
  );
}
