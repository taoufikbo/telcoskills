"use client";

import { memo, useMemo } from "react";
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { calculerDisposition, ENTETE_H, ENTETE_L, NOEUD_H, NOEUD_L } from "@/lib/layout";
import { LIBELLE_STATUT } from "@/lib/libelles";
import { voisinClavier } from "@/lib/navigation";
import { statistiques, statutDe, type Progression, type Statut } from "@/produits/progression";
import type { Noeud, Roadmap } from "@/lib/schema";
import { LIBELLE_DEMANDE_COURT, STYLE_DEMANDE, STYLE_NIVEAU, STYLE_STATUT } from "@/lib/styles";
import { useTheme } from "@/lib/useTheme";
import { aretesArbre, idEntete } from "./aretes";

type DonneesNoeud = {
  noeud: Noeud;
  statut: Statut;
  /** null : filtre inactif ; sinon indique si le nœud fait partie du chemin conseillé. */
  surChemin: boolean | null;
  selectionne: boolean;
  onOuvrir: (id: string) => void;
};

type DonneesEntete = { titre: string; maitrise: number; actifs: number };

const cache = "!h-1 !w-1 !border-0 !bg-transparent";

const Entete = memo(function Entete({ data }: NodeProps<Node<DonneesEntete>>) {
  return (
    <>
      <Handle id="haut" type="target" position={Position.Top} className={cache} />
      <Handle id="bas" type="source" position={Position.Bottom} className={cache} />
      <Handle id="gauche" type="source" position={Position.Left} className={cache} />
      <Handle id="droite" type="source" position={Position.Right} className={cache} />
      <div
        style={{ width: ENTETE_L, height: ENTETE_H }}
        className="flex flex-col items-center justify-center border-2 border-black bg-orange px-2 text-center text-black shadow dark:border-white"
      >
        <span className="text-sm font-bold leading-tight">{data.titre}</span>
        <span className="text-[10px] font-medium">
          {data.maitrise}/{data.actifs} acquis
        </span>
      </div>
    </>
  );
});

const NoeudCarte = memo(function NoeudCarte({ data, positionAbsoluteX, positionAbsoluteY }: NodeProps<Node<DonneesNoeud>>) {
  const { setCenter, getZoom } = useReactFlow();
  const { noeud, statut, surChemin, selectionne, onOuvrir } = data;
  return (
    <>
      <Handle id="haut" type="target" position={Position.Top} className={cache} />
      <Handle id="bas" type="source" position={Position.Bottom} className={cache} />
      <Handle id="haut-s" type="source" position={Position.Top} className={cache} />
      <Handle id="bas-t" type="target" position={Position.Bottom} className={cache} />
      <Handle id="gauche-t" type="target" position={Position.Left} className={cache} />
      <Handle id="droite-t" type="target" position={Position.Right} className={cache} />
      <button
        type="button"
        data-noeud-id={noeud.id}
        onClick={() => onOuvrir(noeud.id)}
        onFocus={(e) => {
          // Focus au clavier : recentre la vue sur le nœud (pas lors d'un clic souris).
          if (e.currentTarget.matches(":focus-visible"))
            setCenter(positionAbsoluteX + NOEUD_L / 2, positionAbsoluteY + NOEUD_H / 2, { zoom: Math.max(getZoom(), 0.8), duration: 150 });
        }}
        aria-label={`${noeud.titre}${noeud.demande ? `, demande ${noeud.demande}` : ""}, statut : ${LIBELLE_STATUT[statut]}`}
        style={{ width: NOEUD_L, height: NOEUD_H }}
        className={`flex flex-col justify-between border-l-4 border-y border-r border-y-slate-300 border-r-slate-300 p-2 text-left text-xs shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white dark:border-y-slate-600 dark:border-r-slate-600 ${STYLE_NIVEAU[noeud.niveau]} ${selectionne ? "ring-[3px] ring-black dark:ring-white" : ""} ${statut === "ignore" ? "opacity-50" : ""} ${surChemin === false ? "opacity-30" : ""}`}
      >
        <span className={`line-clamp-2 font-medium leading-tight ${statut === "ignore" ? "line-through" : ""}`}>
          {surChemin && <span aria-hidden>★ </span>}
          {noeud.titre}
        </span>
        <span className="flex w-full items-center justify-between">
          {noeud.demande && (
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${STYLE_DEMANDE[noeud.demande]}`}>
              {LIBELLE_DEMANDE_COURT[noeud.demande]}
            </span>
          )}
          {statut !== "a-faire" && (
            <span className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold ${STYLE_STATUT[statut]}`}>
              {statut === "maitrise" ? "✓ " : ""}
              {LIBELLE_STATUT[statut]}
            </span>
          )}
        </span>
      </button>
    </>
  );
});

const nodeTypes = { noeud: NoeudCarte, entete: Entete };

export default function GrapheRoadmap({
  roadmap,
  selection,
  progression,
  chemin,
  onOuvrir,
}: {
  roadmap: Roadmap;
  selection: string | null;
  progression: Progression;
  chemin: Set<string> | null;
  onOuvrir: (id: string) => void;
}) {
  const disposition = useMemo(() => calculerDisposition(roadmap), [roadmap]);
  const [theme] = useTheme();

  // Flèches : haut/bas le long d'une branche, gauche/droite vers l'autre branche (nœud le plus proche en hauteur).
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!e.key.startsWith("Arrow")) return;
    const courant = (e.target as HTMLElement).closest<HTMLElement>("[data-noeud-id]");
    if (!courant) return;
    const meilleur = voisinClavier(disposition.noeuds, courant.dataset.noeudId!, e.key);
    e.preventDefault();
    if (meilleur) document.querySelector<HTMLElement>(`[data-noeud-id="${meilleur}"]`)?.focus();
  };

  const nodes: Node[] = useMemo(() => {
    const entetes: Node<DonneesEntete>[] = roadmap.blocs.map((bloc) => {
      const stats = statistiques(roadmap.noeuds.filter((n) => n.bloc === bloc), progression);
      return {
        id: idEntete(bloc),
        type: "entete",
        position: disposition.entetes.get(bloc)!,
        width: ENTETE_L,
        height: ENTETE_H,
        selectable: false,
        data: { titre: bloc, maitrise: stats.maitrise, actifs: stats.actifs },
      };
    });
    const noeuds: Node<DonneesNoeud>[] = roadmap.noeuds.map((n) => ({
      id: n.id,
      type: "noeud",
      position: disposition.noeuds.get(n.id)!,
      width: NOEUD_L,
      height: NOEUD_H,
      data: { noeud: n, statut: statutDe(progression, n.id), surChemin: chemin ? chemin.has(n.id) : null, selectionne: n.id === selection, onOuvrir },
    }));
    return [...entetes, ...noeuds];
  }, [roadmap, disposition, selection, progression, chemin, onOuvrir]);

  const edges: Edge[] = useMemo(() => aretesArbre(roadmap, disposition, selection, chemin), [roadmap, disposition, selection, chemin]);

  const premierBloc = useMemo(
    () => [{ id: idEntete(roadmap.blocs[0]) }, ...roadmap.noeuds.filter((n) => n.bloc === roadmap.blocs[0]).map((n) => ({ id: n.id }))],
    [roadmap],
  );

  return (
    <div className="h-full [--tronc:#000] dark:[--tronc:#fff]" onKeyDown={onKeyDown}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        colorMode={theme}
        fitView
        fitViewOptions={{ nodes: premierBloc, maxZoom: 1, padding: 0.15 }}
        minZoom={0.15}
        maxZoom={1.5}
        panOnScroll
        zoomOnScroll={false}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        proOptions={{ hideAttribution: true }}
        aria-label={`Arbre de la roadmap ${roadmap.titre}`}
      >
        <Background />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable ariaLabel="Aperçu de l'arbre" />
      </ReactFlow>
    </div>
  );
}
