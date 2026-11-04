"use client";

import { useId } from "react";
import { basculerNotion, notionsCochees, usePratique } from "@/produits/progression";

/**
 * Notions d'une fiche, cochables. C'est une auto-évaluation : elle ne compte ni dans le palier atteint ni dans « acquis (testé) »
 * (docs/SPEC-FICHE-COMPETENCE.md, EX-09), et la page le dit. Les cases sont conservées dans le navigateur et dans le lien de sauvegarde.
 */
export default function NotionsCompetence({ noeudId, notions }: { noeudId: string; notions: string[] }) {
  const { etat, muter, pret } = usePratique();
  const id = useId();
  const cochees = new Set(pret ? notionsCochees(etat, noeudId) : []);
  return (
    <div className="space-y-2">
      <ul className="panneau divide-y" style={{ borderColor: "var(--filet)" }}>
        {notions.map((n, i) => (
          <li key={n} className="p-3" style={{ borderColor: "var(--filet)" }}>
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 accent-[var(--accent)]"
                checked={cochees.has(i)}
                onChange={() => muter((e) => basculerNotion(e, noeudId, i))}
                aria-describedby={`${id}-note`}
              />
              <span className={cochees.has(i) ? "line-through opacity-70" : ""}>{n}</span>
            </label>
          </li>
        ))}
      </ul>
      <p id={`${id}-note`} className="mono text-xs" aria-live="polite">
        {pret ? `${cochees.size} notion${cochees.size > 1 ? "s" : ""} sur ${notions.length}. ` : ""}Auto-évaluation : cocher une notion ne change ni votre palier atteint ni le statut « acquis (testé) ».
      </p>
    </div>
  );
}
