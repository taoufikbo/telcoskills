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
import { LIBELLE_NIVEAU, LIBELLE_STATUT } from "@/lib/libelles";
import { calculerMetro, PAS_X } from "./metro";
import { voisinLigne } from "@/lib/navigation";
import { statutDe, type Progression, type Statut } from "@/produits/progression";
import type { Noeud, Roadmap } from "@/lib/schema";
import { useTheme } from "@/lib/useTheme";
import { INSTANCE } from "@/lib/instance";

/** Couleurs de ligne, une par bloc (dans l'ordre, en boucle). */
const COULEURS_LIGNES = [
  INSTANCE.accent, "#4bb4e6", "#228722", "#a885d8", "#4170d8", "#cd3c14", "#ffcc00",
  "#7a7a7a", "#b85c00", "#ffb4e6", "#66cc66", "#1f8fb8", "#8f5fc0", "#b3b3b3",
];
const couleurLigne = (i: number) => COULEURS_LIGNES[i % COULEURS_LIGNES.length];

/** Noir ou blanc, selon le meilleur contraste avec la couleur de fond (la charte met du texte noir sur l'orange). */
function texteSur(hex: string): string {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.179 ? "#000" : "#fff";
}

const LARGEUR_STATION = PAS_X - 12;
const CENTRE_Y = 18;
const X_ETIQUETTE_LIGNE = -230;
const COULEUR_LIEN = "var(--lien-metro)";

type DonneesStation = {
  noeud: Noeud;
  couleur: string;
  statut: Statut;
  grande: boolean;
  correspondance: boolean;
  surChemin: boolean | null;
  selectionne: boolean;
  onOuvrir: (id: string) => void;
};

/** Le point d'attache des lignes est le centre du cercle, pas le bord de la boîte. */
const poignee = { left: LARGEUR_STATION / 2, right: "auto", top: CENTRE_Y, transform: "translate(-50%, -50%)", width: 1, height: 1, opacity: 0, border: 0 } as const;

function fondStation(statut: Statut, couleur: string): React.CSSProperties {
  switch (statut) {
    case "maitrise":
      return { background: couleur, borderColor: couleur };
    case "en-cours":
      return { background: `linear-gradient(90deg, ${couleur} 50%, var(--fond-station) 50%)`, borderColor: couleur };
    case "ignore":
      return { background: "var(--fond-station)", borderColor: "#8f8f8f", borderStyle: "dashed" };
    default:
      return { background: "var(--fond-station)", borderColor: couleur };
  }
}

const StationMetro = memo(function StationMetro({ data, positionAbsoluteX, positionAbsoluteY }: NodeProps<Node<DonneesStation>>) {
  const { setCenter, getZoom } = useReactFlow();
  const { noeud, couleur, statut, grande, correspondance, surChemin, selectionne, onOuvrir } = data;
  const taille = grande ? 28 : 20;
  return (
    <>
      <Handle type="target" position={Position.Left} style={poignee} />
      <Handle type="source" position={Position.Right} style={poignee} />
      <button
        type="button"
        data-noeud-id={noeud.id}
        onClick={() => onOuvrir(noeud.id)}
        onFocus={(e) => {
          if (e.currentTarget.matches(":focus-visible"))
            setCenter(positionAbsoluteX + LARGEUR_STATION / 2, positionAbsoluteY + CENTRE_Y, { zoom: Math.max(getZoom(), 0.8), duration: 150 });
        }}
        title={`${noeud.titre} (${LIBELLE_NIVEAU[noeud.niveau]})`}
        aria-label={`${noeud.titre}, ${LIBELLE_NIVEAU[noeud.niveau].toLowerCase()}${noeud.demande ? `, demande ${noeud.demande}` : ""}${correspondance ? ", correspondance" : ""}, statut : ${LIBELLE_STATUT[statut]}`}
        style={{ width: LARGEUR_STATION }}
        className={`flex flex-col items-center text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white ${surChemin === false ? "opacity-25" : ""} ${statut === "ignore" ? "opacity-50" : ""}`}
      >
        <span
          style={{ height: CENTRE_Y * 2, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <span
            style={{ width: taille, height: taille, color: texteSur(couleur), ...fondStation(statut, couleur) }}
            className={`flex items-center justify-center rounded-full border-4 text-[11px] font-bold ${correspondance ? "ring-[3px] ring-slate-900 ring-offset-2 ring-offset-white dark:ring-white dark:ring-offset-slate-950" : ""} ${selectionne ? "outline-[3px] outline-offset-4 outline-black dark:outline-white" : ""}`}
          >
            {statut === "maitrise" ? "✓" : ""}
          </span>
        </span>
        <span className={`mt-1 line-clamp-3 text-xs leading-tight ${statut === "ignore" ? "line-through" : ""}`}>
          {surChemin && <span aria-hidden>★ </span>}
          {noeud.titre}
        </span>
      </button>
    </>
  );
});

type DonneesLigne = { titre: string; couleur: string };

const EtiquetteLigne = memo(function EtiquetteLigne({ data }: NodeProps<Node<DonneesLigne>>) {
  return (
    <>
      <Handle type="source" position={Position.Right} style={{ ...poignee, left: "auto", right: 0, transform: "translate(50%, -50%)" }} />
      <div
        style={{ background: data.couleur, color: texteSur(data.couleur), height: CENTRE_Y * 2, width: 190 }}
        className="flex items-center justify-center rounded-full px-3 text-center text-xs font-bold leading-tight shadow"
      >
        <span className="line-clamp-2">{data.titre}</span>
      </div>
    </>
  );
});

const nodeTypes = { station: StationMetro, ligne: EtiquetteLigne };

export default function CarteMetro({
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
  const [theme] = useTheme();
  const metro = useMemo(() => calculerMetro(roadmap), [roadmap]);
  const aDemande = roadmap.noeuds.some((n) => n.demande);

  const positions = useMemo(
    () => new Map([...metro.stations].map(([id, s]) => [id, { x: s.x, y: s.y }])),
    [metro],
  );

  const nodes: Node[] = useMemo(() => {
    const lignes: Node<DonneesLigne>[] = metro.lignes.map((l, i) => ({
      id: `ligne:${l.bloc}`,
      type: "ligne",
      position: { x: X_ETIQUETTE_LIGNE, y: l.y },
      width: 190,
      height: CENTRE_Y * 2,
      selectable: false,
      data: { titre: l.bloc, couleur: couleurLigne(i) },
    }));
    const stations: Node<DonneesStation>[] = roadmap.noeuds.map((n) => {
      const s = metro.stations.get(n.id)!;
      return {
        id: n.id,
        type: "station",
        position: { x: s.x - LARGEUR_STATION / 2, y: s.y },
        width: LARGEUR_STATION,
        data: {
          noeud: n,
          couleur: couleurLigne(s.ligne),
          statut: statutDe(progression, n.id),
          grande: aDemande && n.demande === "forte",
          correspondance: metro.correspondances.has(n.id),
          surChemin: chemin ? chemin.has(n.id) : null,
          selectionne: n.id === selection,
          onOuvrir,
        },
      };
    });
    return [...lignes, ...stations];
  }, [roadmap, metro, progression, chemin, selection, onOuvrir, aDemande]);

  const edges: Edge[] = useMemo(() => {
    const liens: Edge[] = [];
    // Les lignes : de l'étiquette à la première station, puis de station en station.
    metro.lignes.forEach((l, i) => {
      const suite = [`ligne:${l.bloc}`, ...l.ids];
      suite.slice(1).forEach((cible, k) =>
        liens.push({
          id: `ligne-${i}-${k}`,
          source: suite[k],
          target: cible,
          type: "straight",
          selectable: false,
          style: { stroke: couleurLigne(i), strokeWidth: 8, strokeLinecap: "round" },
        }),
      );
    });
    // Correspondances : les prérequis et dépendants de la station sélectionnée.
    if (selection) {
      for (const n of roadmap.noeuds)
        for (const p of n.prerequis) {
          if (n.id !== selection && p !== selection) continue;
          liens.push({
            id: `lien-${p}->${n.id}`,
            source: p,
            target: n.id,
            type: "smoothstep",
            selectable: false,
            zIndex: 3,
            style: { stroke: COULEUR_LIEN, strokeWidth: 3, strokeDasharray: "8 5" },
          });
        }
    }
    return liens;
  }, [roadmap, metro, selection]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!e.key.startsWith("Arrow")) return;
    const courant = (e.target as HTMLElement).closest<HTMLElement>("[data-noeud-id]");
    if (!courant) return;
    const voisin = voisinLigne(positions, courant.dataset.noeudId!, e.key);
    e.preventDefault();
    if (voisin) document.querySelector<HTMLElement>(`[data-noeud-id="${voisin}"]`)?.focus();
  };

  return (
    <div
      className="relative h-full [--fond-station:#ffffff] [--lien-metro:#000] dark:[--fond-station:#141414] dark:[--lien-metro:#fff]"
      onKeyDown={onKeyDown}
    >
      <details className="absolute left-2 top-2 z-10 rounded-md border border-slate-200 bg-white/90 text-[11px] text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-300">
        <summary className="cursor-pointer select-none px-2 py-1 font-medium">Légende</summary>
        <ul className="space-y-1 px-2 pb-2">
          <li>Une ligne = un bloc ; une station = une compétence</li>
          <li>◎ Correspondance : prérequis dans une autre ligne</li>
          {aDemande && <li>Grande station : forte demande</li>}
          <li>○ à faire · ◐ en cours · ● acquis</li>
          <li>Cliquez une station : ses prérequis apparaissent en pointillés noirs</li>
        </ul>
      </details>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        colorMode={theme}
        defaultViewport={{ x: 270, y: 70, zoom: 0.9 }}
        minZoom={0.15}
        maxZoom={1.5}
        panOnScroll
        zoomOnScroll={false}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        proOptions={{ hideAttribution: true }}
        aria-label={`Plan de métro de la roadmap ${roadmap.titre}`}
      >
        <Background />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          ariaLabel="Aperçu du plan"
          nodeColor={(n) => (n.type === "station" ? (n.data as DonneesStation).couleur : (n.data as DonneesLigne).couleur)}
        />
      </ReactFlow>
    </div>
  );
}
