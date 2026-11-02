import type { ReactNode } from "react";

/**
 * Texte que l'auteur doit écrire lui-même (opinion, expérience, offre). Visible en développement et avec
 * NEXT_PUBLIC_SHOW_DRAFTS=1 (aperçus), masqué en production : on n'y publie jamais un texte inventé.
 */
export const BROUILLONS_VISIBLES = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SHOW_DRAFTS === "1";

export default function Draft({ titre, children }: { titre: string; children?: ReactNode }) {
  if (!BROUILLONS_VISIBLES) return null;
  return (
    <aside data-draft className="p-3 text-sm">
      <p className="mono" style={{ color: "var(--crit)" }}>
        À écrire par l&apos;auteur
      </p>
      <p className="font-medium">{titre}</p>
      {children && <div className="mt-1" style={{ color: "var(--muted)" }}>{children}</div>}
    </aside>
  );
}
