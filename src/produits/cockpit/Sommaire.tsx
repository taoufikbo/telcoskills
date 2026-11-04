"use client";

import Link from "next/link";
import type { Programme } from "./calcul";

type Props = {
  programme: Programme;
  /** Titre du parcours et lien vers sa page (le cockpit). */
  titre: string;
  hrefParcours: string;
  /** Compétence en cours de lecture. */
  courant: string;
  href: (id: string) => string;
  /** Sans suivi (rendu serveur, avant lecture du navigateur) : pas de statuts ni d'avancement. */
  suivi?: boolean;
};

const MARQUE = { "a-decouvrir": "○", vu: "◐", "acquis-teste": "●", "a-revoir": "●", "hors-parcours": "–" } as const;
const TEXTE = { "a-decouvrir": "", vu: "vue", "acquis-teste": "acquise", "a-revoir": "à revoir", "hors-parcours": "sortie du parcours" } as const;

/** La barre de gauche du mode apprentissage : le programme du parcours, la compétence en cours, l'avancement par bloc. Lien partout, rien à stocker. */
export default function Sommaire({ programme: p, titre, hrefParcours, courant, href, suivi = false }: Props) {
  const lien = "underline decoration-[var(--bord)] underline-offset-4 hover:decoration-[var(--fg)]";
  return (
    <nav aria-label="Programme du parcours" className="text-sm">
      <p className="mono">Parcours</p>
      <Link href={hrefParcours} className={`mt-1 block font-semibold ${lien}`}>
        {titre}
      </Link>
      {suivi && (
        <>
          <div role="progressbar" aria-label="Compétences acquises par un test" aria-valuemin={0} aria-valuemax={p.actifs} aria-valuenow={p.acquis} className="mt-3 h-1.5 w-full" style={{ background: "var(--filet)" }}>
            <div className="h-full" style={{ width: `${p.actifs ? (p.acquis / p.actifs) * 100 : 0}%`, background: "var(--fg)" }} />
          </div>
          <p className="mt-1.5 tabular-nums" style={{ color: "var(--muted)" }}>
            {p.acquis}/{p.actifs} acquises · {p.restantes} restantes
          </p>
        </>
      )}
      <ol className="mt-4 border-t" style={{ borderColor: "var(--filet)" }}>
        {p.blocs.map((b) => {
          const contientCourant = b.noeuds.some((n) => n.id === courant);
          return (
            <li key={b.bloc} className="border-b" style={{ borderColor: "var(--filet)" }}>
              <details open={contientCourant}>
                <summary className="flex min-h-10 cursor-pointer select-none items-baseline justify-between gap-3 py-2">
                  <span className={contientCourant ? "font-semibold" : ""}>{b.bloc}</span>
                  <span className="mono whitespace-nowrap">{suivi ? `${b.acquis}/${b.actifs}` : b.actifs}</span>
                </summary>
                <ul className="pb-2">
                  {b.noeuds.map((n) => {
                    const actuel = n.id === courant;
                    return (
                      <li key={n.id}>
                        <Link
                          href={href(n.id)}
                          aria-current={actuel ? "page" : undefined}
                          className="flex items-baseline gap-2 border-l-2 py-1 pl-2 hover:underline aria-[current=page]:font-semibold"
                          style={{ borderColor: actuel ? "var(--fg)" : "transparent" }}
                        >
                          <span aria-hidden className="w-3 shrink-0 text-center">
                            {suivi ? MARQUE[n.statut] : "○"}
                          </span>
                          <span className={`min-w-0 flex-1 ${n.statut === "hors-parcours" ? "line-through opacity-60" : ""}`}>{n.titre}</span>
                          {suivi && TEXTE[n.statut] && <span className="sr-only">{TEXTE[n.statut]}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </details>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
