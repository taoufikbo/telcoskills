"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { TypeEntite } from "@/lib/carte";
import {
  developper,
  disposerGraphe,
  LIBELLE_CATEGORIE,
  LIBELLE_RELATION,
  phrases as construirePhrases,
  rechercher,
  refDe,
  typeDe,
  type Graphe,
  type Position as Pos,
  type ResultatRecherche,
  type TypeRelation,
} from "@/lib/graphe";
import { useTheme } from "@/lib/useTheme";
import type { Ctx, EtatCompetence } from "./types";
import { INSTANCE } from "@/lib/instance";

const CATEGORIES: TypeEntite[] = ["role", "phase", "jalon", "activite", "competence"];

/** Style de chaque catégorie, repris dans la légende : forme et couleur distinctes. */
const STYLE_CATEGORIE: Record<TypeEntite, string> = {
  role: "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white",
  phase: "bg-orange text-black border-black dark:border-white",
  jalon: "bg-brand-yellow text-black border-black dark:border-white",
  activite: "bg-white text-black border-black dark:bg-slate-900 dark:text-white dark:border-white",
  competence: "rounded-full bg-white text-black border-slate-500 dark:bg-slate-900 dark:text-white",
};
const PUCE_CATEGORIE: Record<TypeEntite, string> = {
  role: "bg-black dark:bg-white",
  phase: "bg-orange",
  jalon: "bg-brand-yellow",
  activite: "border border-black bg-white dark:border-white dark:bg-slate-900",
  competence: "rounded-full border border-slate-500 bg-white dark:bg-slate-900",
};
const STYLE_STATUT: Record<NonNullable<EtatCompetence>, string> = {
  "a-faire": "",
  "en-cours": "!bg-brand-cyan !text-black !border-black",
  maitrise: "!bg-brand-green !text-white !border-brand-green dark:!bg-brand-green-light dark:!text-black",
  ignore: "line-through opacity-60",
  hors: "!border-dashed",
};
const MARQUE_STATUT: Partial<Record<NonNullable<EtatCompetence>, string>> = { maitrise: "✓ ", "en-cours": "◐ ", hors: "↗ " };

const MASQUE = "!h-1 !w-1 !border-0 !bg-transparent";
const HANDLES: Record<TypeRelation, { source: string; cible: string }> = {
  PARTICIPE_A: { source: "droite-s", cible: "gauche-t" },
  DANS_LA_PHASE: { source: "haut-s", cible: "bas-t" },
  SE_TERMINE_PAR: { source: "haut-s", cible: "bas-t" },
  PRECEDE: { source: "droite-s", cible: "gauche-t" },
  MOBILISE: { source: "bas-s", cible: "haut-t" },
};

type DonneesNoeud = {
  type: TypeEntite;
  libelle: string;
  actif: boolean;
  selectionne: boolean;
  statut: EtatCompetence;
  caches: number;
  choisir: () => void;
  developper: () => void;
  retirer: () => void;
};

const NoeudGraphe = memo(function NoeudGraphe({ data }: NodeProps<Node<DonneesNoeud>>) {
  const { type, libelle, actif, selectionne, statut, caches, choisir, developper: ouvrir, retirer } = data;
  const prefixe = type === "jalon" ? "◆ " : type === "competence" && statut ? (MARQUE_STATUT[statut] ?? "") : "";
  return (
    <>
      {["haut", "bas", "gauche", "droite"].flatMap((c) => [
        <Handle key={`${c}-t`} id={`${c}-t`} type="target" position={c === "haut" ? Position.Top : c === "bas" ? Position.Bottom : c === "gauche" ? Position.Left : Position.Right} className={MASQUE} />,
        <Handle key={`${c}-s`} id={`${c}-s`} type="source" position={c === "haut" ? Position.Top : c === "bas" ? Position.Bottom : c === "gauche" ? Position.Left : Position.Right} className={MASQUE} />,
      ])}
      <div
        role="button"
        tabIndex={0}
        aria-pressed={selectionne}
        aria-label={`${LIBELLE_CATEGORIE[type]} : ${libelle}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            choisir();
          } else if (e.key === "+") ouvrir();
          else if (e.key === "Delete" || e.key === "Backspace") retirer();
        }}
        style={{ width: 210, opacity: actif ? 1 : 0.22, transition: "opacity .15s" }}
        className={`relative flex min-h-12 items-center border-2 px-2.5 py-1.5 text-xs font-bold leading-tight shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white ${STYLE_CATEGORIE[type]} ${statut ? STYLE_STATUT[statut] : ""} ${selectionne ? "outline outline-[3px] outline-offset-2 outline-orange" : ""}`}
      >
        <span className="line-clamp-2">
          {prefixe}
          {libelle}
        </span>
        {caches > 0 && (
          <button
            type="button"
            aria-label={`Développer : ${caches} voisin${caches > 1 ? "s" : ""} masqué${caches > 1 ? "s" : ""}`}
            title={`Développer (${caches} voisin${caches > 1 ? "s" : ""} masqué${caches > 1 ? "s" : ""})`}
            onClick={(e) => {
              e.stopPropagation();
              ouvrir();
            }}
            className="absolute -right-2.5 -top-2.5 flex h-6 min-w-6 items-center justify-center border-2 border-black bg-white px-1 text-[10px] font-bold text-black hover:bg-orange dark:border-white"
          >
            +{caches}
          </button>
        )}
      </div>
    </>
  );
});

const nodeTypes = { noeud: NoeudGraphe };

type Scene = { visibles: string[]; ajouter: (ids: string[]) => void; retirer: (id: string) => void; reinitialiser: () => void };

function Canvas({ ctx, graphe, scene }: { ctx: Ctx; graphe: Graphe; scene: Scene }) {
  const { index, sel, choisir, actif, estSel, etatCompetence, profil } = ctx;
  const [theme] = useTheme();
  const { setViewport } = useReactFlow();
  const conteneur = useRef<HTMLDivElement>(null);
  const [masques, setMasques] = useState<Set<TypeEntite>>(new Set());
  const [manuel, setManuel] = useState<Record<string, Pos>>({});
  const [requete, setRequete] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const [courant, setCourant] = useState(0);
  const refChamp = useRef<HTMLInputElement>(null);

  const visibles = useMemo(() => new Set(scene.visibles.filter((id) => !masques.has(typeDe(id)))), [scene.visibles, masques]);
  const positions = useMemo(() => disposerGraphe(visibles, index), [visibles, index]);
  const listePhrases = useMemo(() => construirePhrases(index, profil?.id ?? null, etatCompetence), [index, profil, etatCompetence]);
  const resultats = useMemo(() => rechercher(graphe, listePhrases, requete), [graphe, listePhrases, requete]);

  const developperId = (id: string) => scene.ajouter(developper(graphe, id));

  const nodes: Node<DonneesNoeud>[] = useMemo(
    () =>
      [...visibles].map((id) => {
        const type = typeDe(id);
        const ref = refDe(id);
        const n = graphe.noeuds.get(id)!;
        const caches = [...(graphe.voisins.get(id) ?? [])].filter((v) => !scene.visibles.includes(v) && !masques.has(typeDe(v))).length;
        return {
          id,
          type: "noeud",
          position: manuel[id] ?? positions.get(id) ?? { x: 0, y: 0 },
          data: {
            type,
            libelle: n.libelle,
            actif: actif(type, ref),
            selectionne: estSel(type, ref),
            statut: type === "competence" ? etatCompetence(ref) : null,
            caches,
            choisir: () => choisir({ type, id: ref }),
            developper: () => developperId(id),
            retirer: () => scene.retirer(id),
          },
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibles, positions, manuel, graphe, scene.visibles, masques, sel, ctx.liens, profil, ctx.etatCompetence],
  );

  const edges: Edge[] = useMemo(
    () =>
      graphe.relations
        .filter((r) => visibles.has(r.source) && visibles.has(r.cible))
        .map((r) => {
          const lie = !!sel && (estSel(typeDe(r.source), refDe(r.source)) || estSel(typeDe(r.cible), refDe(r.cible)));
          const eclaire = !ctx.liens || (actif(typeDe(r.source), refDe(r.source)) && actif(typeDe(r.cible), refDe(r.cible)));
          return {
            id: r.id,
            source: r.source,
            target: r.cible,
            sourceHandle: HANDLES[r.type].source,
            targetHandle: HANDLES[r.type].cible,
            type: r.type === "PRECEDE" ? "straight" : "default",
            label: lie ? LIBELLE_RELATION[r.type] : undefined,
            labelStyle: { fontSize: 11, fontWeight: 700 },
            labelBgStyle: { fill: "var(--fond-graphe)" },
            zIndex: lie ? 5 : 0,
            style: {
              stroke: lie ? INSTANCE.accent : r.type === "PRECEDE" ? "var(--trait-graphe)" : "#8f8f8f",
              strokeWidth: lie ? 3 : r.type === "PRECEDE" ? 4 : 1.5,
              opacity: eclaire ? (lie ? 1 : 0.7) : 0.08,
            },
          };
        }),
    [graphe, visibles, sel, ctx.liens, actif, estSel],
  );

  // Recadrage quand la scène change : tout voir si le zoom reste lisible, sinon un zoom lisible aligné à gauche (la minimap sert à parcourir la frise).
  useEffect(() => {
    const t = setTimeout(() => {
      const zone = conteneur.current;
      if (!zone || positions.size === 0) return;
      const xs = [...positions.values()].map((p) => p.x);
      const ys = [...positions.values()].map((p) => p.y);
      const largeur = Math.max(...xs) + 210 - Math.min(...xs);
      const hauteur = Math.max(...ys) + 60 - Math.min(...ys);
      const ajuste = Math.min((zone.clientWidth - 40) / largeur, (zone.clientHeight - 40) / hauteur);
      const zoom = Math.max(0.72, Math.min(1, ajuste));
      setViewport({ x: 20 - Math.min(...xs) * zoom, y: 20 - Math.min(...ys) * zoom, zoom }, { duration: 350 });
    }, 80);
    return () => clearTimeout(t);
    // positions change avec la scène ; zone et setViewport sont stables
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibles.size, profil?.id]);

  const appliquer = (r: ResultatRecherche) => {
    if (r.genre === "phrase") scene.ajouter(r.ids);
    else {
      const voisins = developper(graphe, r.id);
      scene.ajouter([r.id, ...(voisins.length <= 14 ? voisins : [])]);
      choisir({ type: typeDe(r.id), id: refDe(r.id) });
    }
    setRequete("");
    setOuvert(false);
  };

  const noeudSelectionne = sel ? `${sel.type}:${sel.id}` : null;
  const selDansScene = !!noeudSelectionne && visibles.has(noeudSelectionne);

  return (
    <div className="space-y-2 [--fond-graphe:#fff] [--trait-graphe:#000] dark:[--fond-graphe:#141414] dark:[--trait-graphe:#fff]">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        <div className="relative min-w-64 flex-1">
          <label htmlFor="recherche-graphe" className="sr-only">
            Rechercher dans le graphe
          </label>
          <input
            id="recherche-graphe"
            ref={refChamp}
            role="combobox"
            aria-expanded={ouvert}
            aria-controls="resultats-graphe"
            autoComplete="off"
            value={requete}
            placeholder="Rechercher un rôle, une compétence, ou poser une question…"
            onFocus={() => setOuvert(true)}
            onBlur={() => setTimeout(() => setOuvert(false), 150)}
            onChange={(e) => {
              setRequete(e.target.value);
              setCourant(0);
              setOuvert(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") (e.preventDefault(), setCourant((c) => Math.min(c + 1, resultats.length - 1)));
              else if (e.key === "ArrowUp") (e.preventDefault(), setCourant((c) => Math.max(c - 1, 0)));
              else if (e.key === "Enter" && resultats[courant]) (e.preventDefault(), appliquer(resultats[courant]));
              else if (e.key === "Escape") setOuvert(false);
            }}
            className="w-full border-2 border-black bg-white px-3 py-2 text-sm dark:border-white dark:bg-slate-950"
          />
          {ouvert && resultats.length > 0 && (
            <ul id="resultats-graphe" role="listbox" className="absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-y-auto border-2 border-black bg-white shadow-lg dark:border-white dark:bg-slate-950">
              {resultats.map((r, i) => (
                <li key={`${r.genre}-${r.id}`} role="option" aria-selected={i === courant}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => appliquer(r)}
                    onMouseEnter={() => setCourant(i)}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${i === courant ? "bg-orange text-black" : ""}`}
                  >
                    {r.genre === "phrase" ? (
                      <>
                        <span aria-hidden className="text-xs font-bold">?</span>
                        <span>{r.libelle}</span>
                      </>
                    ) : (
                      <>
                        <span aria-hidden className={`h-2.5 w-2.5 shrink-0 ${PUCE_CATEGORIE[r.categorie]}`} />
                        <span className="min-w-0 flex-1 truncate">{r.libelle}</span>
                        <span className="text-[11px] opacity-70">{LIBELLE_CATEGORIE[r.categorie]}</span>
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" className="bouton !py-1.5 !text-xs" onClick={scene.reinitialiser} title="Revenir à la scène de départ de cette perspective">
          Réinitialiser la scène
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1" role="group" aria-label="Légende et filtres par catégorie">
        {CATEGORIES.map((c) => {
          const compte = scene.visibles.filter((id) => typeDe(id) === c).length;
          const cache = masques.has(c);
          return (
            <label key={c} className="flex cursor-pointer items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={!cache}
                onChange={() => setMasques((m) => (m.has(c) ? new Set([...m].filter((x) => x !== c)) : new Set([...m, c])))}
                className="accent-orange"
              />
              <span aria-hidden className={`h-3 w-3 ${PUCE_CATEGORIE[c]}`} />
              <span className={cache ? "line-through opacity-60" : ""}>
                {LIBELLE_CATEGORIE[c]}s <span className="text-slate-500">({compte})</span>
              </span>
            </label>
          );
        })}
        {noeudSelectionne && (
          <span className="ml-auto flex items-center gap-2 text-xs">
            {selDansScene ? (
              <>
                <button type="button" className="bouton !px-2 !py-1 !text-xs" onClick={() => developperId(noeudSelectionne)}>
                  Développer la sélection
                </button>
                <button type="button" className="bouton !px-2 !py-1 !text-xs" onClick={() => scene.retirer(noeudSelectionne)}>
                  Retirer de la scène
                </button>
              </>
            ) : (
              <button type="button" className="bouton !px-2 !py-1 !text-xs" onClick={() => scene.ajouter([noeudSelectionne, ...developper(graphe, noeudSelectionne)])}>
                Ajouter la sélection à la scène
              </button>
            )}
          </span>
        )}
      </div>

      <div ref={conteneur} className="h-[68vh] min-h-[460px] border-2 border-black dark:border-white" role="region" aria-label="Scène du graphe">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          colorMode={theme}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          minZoom={0.15}
          maxZoom={1.6}
          deleteKeyCode={null}
          onNodeClick={(_, n) => choisir({ type: typeDe(n.id), id: refDe(n.id) })}
          onNodeDoubleClick={(_, n) => developperId(n.id)}
          onNodeDragStop={(_, n) => setManuel((m) => ({ ...m, [n.id]: n.position }))}
          onPaneClick={() => sel && choisir(sel)}
          proOptions={{ hideAttribution: true }}
          aria-label="Graphe du projet"
        >
          <Background />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable ariaLabel="Aperçu du graphe" />
        </ReactFlow>
      </div>
      <p className="text-xs text-slate-500">
        {visibles.size} nœuds. Cliquez un nœud pour l&apos;inspecter, double-cliquez (ou « +n ») pour développer ses voisins, Suppr au clavier pour le retirer.
        Les nœuds se déplacent à la souris ; la sélection éclaire ses liens.
      </p>
    </div>
  );
}

export default function VueGraphe({ ctx, graphe, scene }: { ctx: Ctx; graphe: Graphe; scene: Scene }) {
  return (
    <ReactFlowProvider>
      <Canvas ctx={ctx} graphe={graphe} scene={scene} />
    </ReactFlowProvider>
  );
}
