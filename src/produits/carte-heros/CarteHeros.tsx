"use client";

import { useMemo, useState, type MouseEvent } from "react";
import type { Progression, Statut } from "@/produits/progression";
import { libelleEffort } from "@/lib/palier";
import { urlNoeud, urlRoadmap } from "@/lib/urls";
import { LIGNE_TEXTE, MARGE_TEXTE, type Disposition } from "./disposition";

type Props = {
  disposition: Disposition;
  /** Progression en lecture seule (facultative) : marque les compétences vues et acquises. Jamais lue dans le stockage par ce composant. */
  progression?: Progression;
  /** Événement de sortie « ouvrir la compétence X ». Sans lui, chaque compétence est un lien vers sa page. */
  onOuvrir?: (id: string) => void;
};

const LIBELLE_STATUT: Partial<Record<Statut, string>> = { maitrise: "acquise", "en-cours": "vue" };

/**
 * Carte héros : le graphe de prérequis réel jusqu'à une compétence cible, libellés complets.
 * Survoler (ou atteindre au clavier) une compétence allume tout ce qu'il faut maîtriser avant elle et éteint le reste :
 * le seul mouvement de la carte, parce qu'il répond à une question (« qu'est-ce que ça demande ? »).
 * Écran large : le graphe entier. Écran étroit (où le graphe serait illisible) : le chemin le plus long, en liste.
 */
export default function CarteHeros({ disposition: d, progression = {}, onOuvrir }: Props) {
  const ouvrir = (id: string) => (e: MouseEvent) => {
    if (!onOuvrir || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    onOuvrir(id);
  };
  const statut = (id: string) => LIBELLE_STATUT[progression[id] ?? "a-faire"];
  const [focus, setFocus] = useState<string | null>(null);
  // Rang le long du chemin (du premier pas à la cible) : sert au tracé quand la carte se redessine.
  const rang = useMemo(() => new Map(d.chemin.map((n, i) => [n.id, i])), [d]);
  const parId = useMemo(() => new Map(d.noeuds.map((n) => [n.id, n])), [d]);
  const actif = focus ? parId.get(focus) : undefined;
  const allumes = useMemo(() => (actif ? new Set([actif.id, ...actif.amont]) : null), [actif]);
  const etat = (id: string) => (allumes ? (allumes.has(id) ? "allume" : "eteint") : "");

  return (
    <div className="carte-heros">
      <svg
        className="mx-auto hidden h-auto w-full sm:block"
        // Ni démesurée (une carte étroite agrandie à toute la largeur) ni plus haute que l'écran.
        style={{ maxWidth: Math.round(d.largeur * 1.3), maxHeight: "80vh" }}
        viewBox={`0 0 ${d.largeur} ${d.hauteur}`}
        role="group"
        aria-label={`Graphe des prérequis de « ${d.cible.titre} » : ${d.noeuds.length} compétences`}
        data-focus={focus ?? undefined}
        onMouseLeave={() => setFocus(null)}
      >
        {d.aretes.map((a) => (
          <path
            key={`${a.de}-${a.a}`}
            d={a.d}
            className={["arete", !allumes && a.surChemin && "chemin", allumes && (allumes.has(a.de) && allumes.has(a.a) ? "allume" : "eteint")].filter(Boolean).join(" ")}
            style={rang.has(a.a) ? ({ "--i": rang.get(a.a) } as React.CSSProperties) : undefined}
          />
        ))}
        {d.noeuds.map((n) => {
          const s = statut(n.id);
          const x0 = n.x - n.largeur / 2;
          const y0 = n.y - n.hauteur / 2;
          return (
            <a
              key={n.id}
              href={urlNoeud(d.roadmapId, n.id)}
              onClick={ouvrir(n.id)}
              onMouseEnter={() => setFocus(n.id)}
              onFocus={() => setFocus(n.id)}
              onBlur={() => setFocus(null)}
              style={rang.has(n.id) ? ({ "--i": rang.get(n.id) } as React.CSSProperties) : undefined}
              className={["noeud", !allumes && n.surChemin && "chemin", n.cible && "cible", n.id === d.depart?.id && "depart", s && `statut-${progression[n.id]}`, etat(n.id)].filter(Boolean).join(" ")}
            >
              <title>{s ? `${n.titre} (${s})` : n.titre}</title>
              <rect x={x0} y={y0} width={n.largeur} height={n.hauteur} rx={4} />
              <text x={x0 + MARGE_TEXTE.x} y={y0 + MARGE_TEXTE.y}>
                {n.lignes.map((l, i) => (
                  <tspan key={i} x={x0 + MARGE_TEXTE.x} dy={i === 0 ? LIGNE_TEXTE - 3 : LIGNE_TEXTE}>
                    {l}
                  </tspan>
                ))}
              </text>
              {s && <circle cx={x0 + n.largeur - 8} cy={y0 + 8} r={3.5} className="pastille" />}
              {n.id === d.depart?.id && (
                <text x={x0} y={y0 - 5} className="etiquette-depart">
                  Vous commencez ici
                </text>
              )}
            </a>
          );
        })}
      </svg>
      <p className="mono mt-3 hidden min-h-[2.5em] sm:block" aria-live="polite" data-info-carte>
        {actif ? (
          actif.amont.length === 0 ? (
            <>
              <strong style={{ color: "var(--fg)" }}>{actif.titre}</strong> : aucun prérequis, c&apos;est un point de départ.
            </>
          ) : (
            <>
              <strong style={{ color: "var(--fg)" }}>{actif.titre}</strong> : {actif.amont.length} compétence{actif.amont.length > 1 ? "s" : ""} à maîtriser
              avant{actif.effort && libelleEffort(actif.effort) && <>, dont {libelleEffort(actif.effort)}</>}.
            </>
          )
        ) : (
          d.depart ? (
            <>
              Votre chemin : de <strong style={{ color: "var(--fg)" }}>{d.depart.titre}</strong> à <strong style={{ color: "var(--fg)" }}>{d.cible.titre}</strong>,{" "}
              {d.noeuds.length} compétences
              {(() => {
                const e = parId.get(d.cible.id)?.effort;
                return e && libelleEffort(e) ? <> ({libelleEffort(e)})</> : null;
              })()}.
              Survolez une compétence pour voir ce qu&apos;elle demande.
            </>
          ) : (
            <>Survolez une compétence : tout ce qu&apos;elle demande avant elle s&apos;allume.</>
          )
        )}
      </p>
      {d.noeuds.some((n) => statut(n.id)) && (
        <p className="mono mt-2 hidden items-center gap-4 sm:flex" aria-hidden>
          <span className="inline-flex items-center gap-1.5">
            <svg width="9" height="9" viewBox="0 0 9 9" className="pastille-legende acquise">
              <circle cx="4.5" cy="4.5" r="3.5" />
            </svg>
            acquise
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg width="9" height="9" viewBox="0 0 9 9" className="pastille-legende">
              <circle cx="4.5" cy="4.5" r="3.5" />
            </svg>
            vue
          </span>
        </p>
      )}

      <ol className="sm:hidden" aria-label={`Chemin vers « ${d.cible.titre} »`}>
        {d.chemin.map((n, i) => {
          const s = statut(n.id);
          return (
            <li key={n.id} className={["etape", n.id === d.cible.id && "cible", n.id === d.depart?.id && "depart"].filter(Boolean).join(" ")}>
              <span className="mono numero" aria-hidden>
                {i + 1}
              </span>
              <a href={urlNoeud(d.roadmapId, n.id)} onClick={ouvrir(n.id)}>
                {n.titre}
              </a>
              {s && <span className="mono statut"> · {s}</span>}
              {n.id === d.depart?.id && <span className="mono statut"> · votre départ</span>}
            </li>
          );
        })}
      </ol>
      <p className="mono mt-3 sm:hidden">
        {d.chemin.length} étapes sur {d.noeuds.length} compétences.{" "}
        <a href={urlRoadmap(d.roadmapId)} className="underline">
          Voir la carte complète
        </a>
      </p>
    </div>
  );
}
