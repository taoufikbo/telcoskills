"use client";

import { memo, useMemo } from "react";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { calculerDispositionObjectif, NOEUD_H, NOEUD_L } from "@/lib/layout";
import { voisinClavier } from "@/lib/navigation";
import { rangs, type EtatNoeud } from "@/lib/objectif";
import type { Progression } from "@/produits/progression";
import type { Noeud, Roadmap } from "@/lib/schema";
import { useTheme } from "@/lib/useTheme";
import { INSTANCE } from "@/lib/instance";
import { syntheseObjectif } from "./synthese";

const COULEUR_CRITIQUE = INSTANCE.accent;
const cache = "!h-1 !w-1 !border-0 !bg-transparent";

const LIBELLE_ETAT: Record<EtatNoeud, string> = {
  acquis: "Acquis",
  disponible: "Disponible",
  verrouille: "Verrouillé",
  ignore: "Ignoré",
};

const STYLE_ETAT: Record<EtatNoeud, string> = {
  acquis: "border-brand-green bg-brand-green/10 dark:border-brand-green-light dark:bg-brand-green-light/15",
  disponible: "border-brand-yellow bg-brand-yellow/20 ring-2 ring-brand-yellow",
  verrouille: "border-slate-300 bg-slate-100 opacity-60 dark:border-slate-700 dark:bg-slate-800",
  ignore: "border-slate-300 bg-slate-100 opacity-40 dark:border-slate-700 dark:bg-slate-800",
};

const PASTILLE_ETAT: Record<EtatNoeud, string> = {
  acquis: "bg-brand-green text-white dark:bg-brand-green-light dark:text-black",
  disponible: "bg-brand-yellow text-black",
  verrouille: "bg-slate-300 text-black dark:bg-slate-500 dark:text-white",
  ignore: "bg-slate-300 text-black dark:bg-slate-500 dark:text-white",
};

type DonneesObjectif = {
  noeud: Noeud;
  etat: EtatNoeud;
  cible: boolean;
  critique: boolean;
  selectionne: boolean;
  onOuvrir: (id: string) => void;
};

const NoeudObjectif = memo(function NoeudObjectif({ data, positionAbsoluteX, positionAbsoluteY }: NodeProps<Node<DonneesObjectif>>) {
  const { setCenter, getZoom } = useReactFlow();
  const { noeud, etat, cible, critique, selectionne, onOuvrir } = data;
  return (
    <>
      <Handle type="target" position={Position.Left} className={cache} />
      <Handle type="source" position={Position.Right} className={cache} />
      <button
        type="button"
        data-noeud-id={noeud.id}
        onClick={() => onOuvrir(noeud.id)}
        onFocus={(e) => {
          if (e.currentTarget.matches(":focus-visible"))
            setCenter(positionAbsoluteX + NOEUD_L / 2, positionAbsoluteY + NOEUD_H / 2, { zoom: Math.max(getZoom(), 0.8), duration: 150 });
        }}
        aria-label={`${noeud.titre}, ${LIBELLE_ETAT[etat].toLowerCase()}${cible ? ", objectif" : ""}${critique ? ", sur le chemin critique" : ""}`}
        style={{ width: NOEUD_L, height: NOEUD_H }}
        className={`flex flex-col justify-between border p-2 text-left text-xs shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white ${STYLE_ETAT[etat]} ${cible ? "border-2 border-slate-900 dark:border-slate-100" : ""} ${selectionne ? "outline-[3px] outline-black dark:outline-white" : ""}`}
      >
        <span className={`line-clamp-2 font-medium leading-tight ${etat === "ignore" ? "line-through" : ""}`}>
          {cible && <span aria-hidden>⚑ </span>}
          {noeud.titre}
        </span>
        <span className="flex w-full items-center justify-between">
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${PASTILLE_ETAT[etat]}`}>
            {etat === "acquis" ? "✓ " : etat === "verrouille" ? "🔒 " : ""}
            {LIBELLE_ETAT[etat]}
          </span>
          {critique && <span className="text-[10px] font-bold text-black dark:text-orange">◆ critique</span>}
        </span>
      </button>
    </>
  );
});

const nodeTypes = { noeud: NoeudObjectif };

export default function VueObjectif({
  roadmap,
  cibleId,
  progression,
  selection,
  large,
  onOuvrir,
  onChoisirCible,
}: {
  roadmap: Roadmap;
  cibleId: string | null;
  progression: Progression;
  selection: string | null;
  large: boolean;
  onOuvrir: (id: string) => void;
  onChoisirCible: (id: string | null) => void;
}) {
  const { cible, ids, membres, etat, critique, surCritique, parId, puits, stats } = useMemo(
    () => syntheseObjectif(roadmap, cibleId, progression),
    [roadmap, cibleId, progression],
  );

  return (
    <div>
      <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">Objectif</span>
          <select
            value={cible?.id ?? ""}
            onChange={(e) => onChoisirCible(e.target.value || null)}
            className="min-w-0 max-w-full border-2 border-black bg-white px-2 py-1.5 dark:border-white dark:bg-slate-950"
          >
            <option value="">Choisir une compétence à atteindre…</option>
            {roadmap.blocs.map((bloc) => (
              <optgroup key={bloc} label={bloc}>
                {roadmap.noeuds
                  .filter((n) => n.bloc === bloc)
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.titre}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>

        {cible && critique ? (
          <div className="mt-3 space-y-2 text-sm">
            <p>
              Pour atteindre <strong>{cible.titre}</strong> : {stats.total} compétences, dont {stats.acquis} acquises.{" "}
              {critique.etapesRestantes === 0 ? (
                <strong>Objectif atteint.</strong>
              ) : (
                <>
                  Chemin critique : <strong>{critique.etapesRestantes} étape{critique.etapesRestantes > 1 ? "s" : ""} à enchaîner</strong>,
                  sans compter ce qui se fait en parallèle.
                </>
              )}
            </p>
            {stats.disponibles.length > 0 && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">À faire maintenant</span>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {stats.disponibles.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => onOuvrir(n.id)}
                        className="puce border-brand-yellow bg-brand-yellow/30 dark:border-brand-yellow"
                      >
                        {n.titre}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400" aria-label="Légende">
              <li>● Disponible : prérequis acquis</li>
              <li>🔒 Verrouillé : prérequis manquants</li>
              <li>✓ Acquis</li>
              <li className="font-bold text-black dark:text-orange">◆ Chemin critique</li>
            </ul>
          </div>
        ) : (
          <div className="mt-3 text-sm">
            <p className="text-slate-600 dark:text-slate-400">
              Choisissez une compétence : seules celles qu&apos;il faut maîtriser avant elle restent affichées, de gauche à droite.
              Des exemples d&apos;objectifs :
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {puits.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => onChoisirCible(n.id)}
                    className="puce"
                  >
                    {n.titre}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {cible &&
        (large ? (
          <div className="h-[calc(100dvh-27rem)] min-h-[360px]">
            <CarteObjectif
              roadmap={roadmap}
              cibleId={cible.id}
              ids={ids}
              etat={etat}
              surCritique={surCritique}
              selection={selection}
              onOuvrir={onOuvrir}
            />
          </div>
        ) : (
          <EtapesMobile
            membres={membres}
            parId={parId}
            etat={etat}
            surCritique={surCritique}
            cibleId={cible.id}
            selection={selection}
            onOuvrir={onOuvrir}
          />
        ))}
    </div>
  );
}

function CarteObjectif({
  roadmap,
  cibleId,
  ids,
  etat,
  surCritique,
  selection,
  onOuvrir,
}: {
  roadmap: Roadmap;
  cibleId: string;
  ids: Set<string>;
  etat: Map<string, EtatNoeud>;
  surCritique: Set<string>;
  selection: string | null;
  onOuvrir: (id: string) => void;
}) {
  const [theme] = useTheme();
  const positions = useMemo(() => calculerDispositionObjectif(roadmap, ids), [roadmap, ids]);

  const nodes: Node<DonneesObjectif>[] = useMemo(
    () =>
      roadmap.noeuds
        .filter((n) => ids.has(n.id))
        .map((n) => ({
          id: n.id,
          type: "noeud",
          position: positions.get(n.id)!,
          width: NOEUD_L,
          height: NOEUD_H,
          data: {
            noeud: n,
            etat: etat.get(n.id)!,
            cible: n.id === cibleId,
            critique: surCritique.has(n.id),
            selectionne: n.id === selection,
            onOuvrir,
          },
        })),
    [roadmap, ids, positions, etat, cibleId, surCritique, selection, onOuvrir],
  );

  const edges: Edge[] = useMemo(() => {
    const chemin = [...surCritique];
    const sur = (p: string, n: string) => surCritique.has(p) && surCritique.has(n) && chemin.length > 1;
    return roadmap.noeuds
      .filter((n) => ids.has(n.id))
      .flatMap((n) =>
        n.prerequis.map((p) => {
          const critiqueEdge = sur(p, n.id);
          return {
            id: `${p}->${n.id}`,
            source: p,
            target: n.id,
            type: "smoothstep",
            zIndex: critiqueEdge ? 2 : 0,
            markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, ...(critiqueEdge ? { color: COULEUR_CRITIQUE } : {}) },
            style: critiqueEdge
              ? { stroke: COULEUR_CRITIQUE, strokeWidth: 3 }
              : { opacity: etat.get(p) === "acquis" ? 0.35 : 0.8 },
          };
        }),
      );
  }, [roadmap, ids, surCritique, etat]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!e.key.startsWith("Arrow")) return;
    const courant = (e.target as HTMLElement).closest<HTMLElement>("[data-noeud-id]");
    if (!courant) return;
    const voisin = voisinClavier(positions, courant.dataset.noeudId!, e.key);
    e.preventDefault();
    if (voisin) document.querySelector<HTMLElement>(`[data-noeud-id="${voisin}"]`)?.focus();
  };

  return (
    <div className="h-full" onKeyDown={onKeyDown}>
      <ReactFlow
        key={cibleId}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        colorMode={theme}
        fitView
        fitViewOptions={{ maxZoom: 1, padding: 0.12 }}
        minZoom={0.15}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        proOptions={{ hideAttribution: true }}
        aria-label="Carte des prérequis de l'objectif"
      >
        <Background />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable ariaLabel="Aperçu de la carte" />
      </ReactFlow>
    </div>
  );
}

function EtapesMobile({
  membres,
  parId,
  etat,
  surCritique,
  cibleId,
  selection,
  onOuvrir,
}: {
  membres: Noeud[];
  parId: Map<string, Noeud>;
  etat: Map<string, EtatNoeud>;
  surCritique: Set<string>;
  cibleId: string;
  selection: string | null;
  onOuvrir: (id: string) => void;
}) {
  const rang = useMemo(() => rangs(membres), [membres]);
  const nbEtapes = Math.max(...rang.values()) + 1;
  return (
    <ol className="space-y-5 p-4">
      {Array.from({ length: nbEtapes }, (_, r) => (
        <li key={r}>
          <h2 className="text-base font-semibold">Étape {r + 1}</h2>
          <ul className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {membres
              .filter((n) => rang.get(n.id) === r)
              .map((n) => {
                const e = etat.get(n.id)!;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => onOuvrir(n.id)}
                      aria-current={n.id === selection}
                      className={`flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left aria-[current=true]:bg-slate-100 dark:aria-[current=true]:bg-slate-800 ${e === "verrouille" || e === "ignore" ? "opacity-60" : ""}`}
                    >
                      <span className={`flex-1 text-sm ${e === "ignore" ? "line-through" : ""}`}>
                        {n.id === cibleId && <span aria-hidden>⚑ </span>}
                        {surCritique.has(n.id) && (
                          <>
                            <span aria-hidden className="text-orange">◆ </span>
                            <span className="sr-only">Sur le chemin critique : </span>
                          </>
                        )}
                        {parId.get(n.id)!.titre}
                      </span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${PASTILLE_ETAT[e]}`}>
                        {e === "acquis" ? "✓ " : e === "verrouille" ? "🔒 " : ""}
                        {LIBELLE_ETAT[e]}
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </li>
      ))}
    </ol>
  );
}
