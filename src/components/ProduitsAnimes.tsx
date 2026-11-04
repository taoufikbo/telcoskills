import Link from "next/link";
import type { ReactNode } from "react";
import { BASE_PROJET, BASE_ROADMAPS } from "@/lib/urls";
import VignettesVisibles from "./VignettesVisibles";

type Props = {
  nbCompetences: number;
  nbOutils: number;
  /** Noms de quelques outils du landscape. */
  outils: string[];
  /** Titres des phases du projet fil rouge, dans l'ordre. */
  phases: string[];
  nbRoles: number;
  /** Titres de quelques compétences d'un parcours, dans l'ordre d'apprentissage. */
  competences: string[];
  /** Blocs d'un parcours, pour la carte « programme ». */
  blocs: string[];
};

function Carte({ titre, texte, href, large, children }: { titre: string; texte: string; href?: string; large?: boolean; children: ReactNode }) {
  const corps = (
    <>
      <div aria-hidden="true" className="pa-visuel flex h-44 items-center justify-center overflow-hidden rounded-md border p-3" style={{ borderColor: "var(--filet)", background: "var(--bg)" }}>
        {children}
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{titre}</h3>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {texte}
        </p>
      </div>
    </>
  );
  const classes = `panneau flex flex-col gap-4 p-4 ${large ? "lg:col-span-2" : ""}`;
  return href ? (
    <Link href={href} className={classes}>
      {corps}
    </Link>
  ) : (
    <div className={classes}>{corps}</div>
  );
}

/**
 * Les produits du site en petit, animés (CSS seulement, figés si le visiteur demande moins de mouvement).
 * Chaque vignette montre la vraie chose : vrais titres de compétences, vrais outils, vraies phases.
 */
export default function ProduitsAnimes({ nbCompetences, nbOutils, outils, phases, nbRoles, competences, blocs }: Props) {
  // Mini-graphe : trois colonnes de prérequis qui convergent vers une cible. Les cinq nœuds du chemin s'allument l'un après l'autre.
  const noeuds = [
    { x: 14, y: 20, chemin: 0 },
    { x: 14, y: 70, chemin: -1 },
    { x: 74, y: 45, chemin: 1 },
    { x: 134, y: 20, chemin: 2 },
    { x: 134, y: 70, chemin: -1 },
    { x: 194, y: 45, chemin: 3 },
  ];
  const aretes: [number, number][] = [[0, 2], [1, 2], [2, 3], [2, 4], [3, 5], [4, 5]];

  return (
    <section aria-labelledby="titre-produits" className="mx-auto max-w-6xl space-y-6 px-4 py-14 sm:px-6">
      <h2 id="titre-produits" className="text-2xl font-semibold sm:text-3xl">
        Ce que vous trouvez ici
      </h2>
      <VignettesVisibles>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Carte large titre="La carte des prérequis" texte={`${nbCompetences} compétences, chacune reliée à ce qu'il faut maîtriser avant. Survolez-en une : son chemin s'allume.`} href={BASE_ROADMAPS}>
          <svg viewBox="0 0 240 110" className="h-full w-full max-w-md">
            {aretes.map(([a, b]) => (
              <line key={`${a}${b}`} x1={noeuds[a].x + 30} y1={noeuds[a].y + 9} x2={noeuds[b].x} y2={noeuds[b].y + 9} stroke="var(--bord)" strokeWidth="1.2" />
            ))}
            {noeuds.map((n, i) => (
              <rect key={i} x={n.x} y={n.y} width="40" height="18" rx="4" className={n.chemin >= 0 ? "pa-noeud" : ""} style={{ ["--i" as string]: Math.max(0, n.chemin) }} fill={n.chemin >= 0 ? "var(--halo)" : "var(--surface)"} stroke={n.chemin >= 0 ? "var(--accent)" : "var(--bord)"} strokeWidth="1.2" />
            ))}
          </svg>
        </Carte>

        <Carte titre="La recherche" texte="Une compétence, un outil, un parcours : ⌘K, depuis n'importe quelle page.">
          <div className="w-full max-w-[16rem] space-y-2">
            <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm" style={{ borderColor: "var(--bord)", background: "var(--surface)" }}>
              <span style={{ color: "var(--muted)" }}>⌕</span>
              <span className="pa-saisie mono">SR-IOV</span>
            </div>
            {["Compétence : SR-IOV", "Compétence : Multus et réseaux secondaires"].map((r, i) => (
              <div key={r} className="pa-resultat mono truncate rounded border px-3 py-1.5" style={{ borderColor: "var(--filet)", background: "var(--surface)", fontSize: "0.75rem", ["--i" as string]: i }}>
                {r}
              </div>
            ))}
          </div>
        </Carte>

        <Carte titre="Un programme, avec le palier visé" texte="Pour chaque parcours : un programme par bloc, le palier visé pour votre métier, léger, moyen ou long, et un rythme que vous réglez." href={BASE_ROADMAPS}>
          <div className="w-full max-w-[16rem] space-y-3">
            {blocs.slice(0, 3).map((b, i) => (
              <div key={b} className="space-y-1">
                <p className="mono truncate" style={{ fontSize: "0.75rem" }}>
                  {b}
                </p>
                <div className="h-2 rounded-full" style={{ background: "var(--surface-2)" }}>
                  <div className="pa-barre h-2 rounded-full" style={{ background: "var(--accent)", ["--p" as string]: [0.85, 0.55, 0.3][i], ["--i" as string]: i }} />
                </div>
              </div>
            ))}
          </div>
        </Carte>

        <Carte titre="Le landscape des outils" texte={`${nbOutils} outils de la pile, par rôle, reliés aux compétences qui les demandent.`} href="/ressources/landscape">
          <div className="flex max-w-[17rem] flex-wrap justify-center gap-1.5">
            {outils.slice(0, 9).map((o, i) => (
              <span key={o} className="pa-puce mono rounded border px-2 py-1" style={{ borderColor: "var(--bord)", background: "var(--surface)", fontSize: "0.75rem", ["--i" as string]: i }}>
                {o}
              </span>
            ))}
          </div>
        </Carte>

        <Carte titre="Le projet fil rouge" texte={`${phases.length} phases et ${nbRoles} rôles, de la conception à la mise en production d'un cœur 5G.`} href={BASE_PROJET}>
          <ol className="flex w-full max-w-[17rem] items-center justify-between">
            {phases.map((p, i) => (
              <li key={p} className="flex flex-1 items-center last:flex-none">
                <span className="pa-phase mono flex h-6 w-6 items-center justify-center rounded-full border" style={{ borderColor: "var(--accent)", fontSize: "0.7rem", ["--i" as string]: i }}>
                  {i + 1}
                </span>
                {i < phases.length - 1 && <span className="h-px flex-1" style={{ background: "var(--bord)" }} />}
              </li>
            ))}
          </ol>
        </Carte>

        <Carte titre="Votre progression" texte="Cochez ce que vous maîtrisez. Elle reste dans votre navigateur : pas de compte.">
          <ul className="w-full max-w-[16rem] space-y-2">
            {competences.slice(0, 3).map((c, i) => (
              <li key={c} className="flex items-center gap-2 text-sm">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border" style={{ borderColor: "var(--bord)" }}>
                  <svg viewBox="0 0 12 12" className="pa-coche h-3 w-3" style={{ ["--i" as string]: i }}>
                    <path d="M2 6.5l2.5 2.5L10 3" fill="none" stroke="var(--ok)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="truncate">{c.replace(/\s*\(.*\)\s*$/, "")}</span>
              </li>
            ))}
          </ul>
        </Carte>
      </div>
      </VignettesVisibles>
    </section>
  );
}
