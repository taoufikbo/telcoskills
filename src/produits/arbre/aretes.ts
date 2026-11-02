import { MarkerType, type Edge } from "@xyflow/react";
import { INSTANCE } from "@/lib/instance";
import type { Disposition } from "@/lib/layout";
import type { Roadmap } from "@/lib/schema";

const COULEUR_LIEN = INSTANCE.accent;
const COULEUR_TRONC = "var(--tronc)";

export const idEntete = (bloc: string) => `bloc:${bloc}`;

/**
 * Arêtes de l'arbre, pures :
 * - tronc : les en-têtes de blocs se suivent de haut en bas ;
 * - branches : de l'en-tête de bloc vers chacune de ses compétences (atténuées hors du chemin conseillé) ;
 * - prérequis : seulement ceux de la compétence sélectionnée (en amont) et ceux qui en dépendent (en aval).
 */
export function aretesArbre(roadmap: Pick<Roadmap, "blocs" | "noeuds">, disposition: Disposition, selection: string | null, chemin: Set<string> | null): Edge[] {
  const liens: Edge[] = [];

  roadmap.blocs.slice(1).forEach((bloc, i) =>
    liens.push({
      id: `tronc-${i}`,
      source: idEntete(roadmap.blocs[i]),
      target: idEntete(bloc),
      sourceHandle: "bas",
      targetHandle: "haut",
      type: "straight",
      selectable: false,
      style: { stroke: COULEUR_TRONC, strokeWidth: 4 },
    }),
  );

  for (const n of roadmap.noeuds) {
    const gauche = disposition.noeuds.get(n.id)!.cote === "gauche";
    liens.push({
      id: `branche-${n.id}`,
      source: idEntete(n.bloc),
      target: n.id,
      sourceHandle: gauche ? "gauche" : "droite",
      targetHandle: gauche ? "droite-t" : "gauche-t",
      type: "smoothstep",
      selectable: false,
      style: { stroke: COULEUR_TRONC, strokeWidth: 1.5, strokeDasharray: "6 4", opacity: chemin && !chemin.has(n.id) ? 0.2 : 1 },
    });
  }

  if (selection) {
    const y = (id: string) => disposition.noeuds.get(id)!.y;
    for (const n of roadmap.noeuds) {
      for (const p of n.prerequis) {
        if (n.id !== selection && p !== selection) continue;
        const descend = y(p) <= y(n.id);
        liens.push({
          id: `prerequis-${p}->${n.id}`,
          source: p,
          target: n.id,
          sourceHandle: descend ? "bas" : "haut-s",
          targetHandle: descend ? "haut" : "bas-t",
          type: "smoothstep",
          selectable: false,
          zIndex: 2,
          markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: COULEUR_LIEN },
          style: { stroke: COULEUR_LIEN, strokeWidth: 2.5 },
        });
      }
    }
  }
  return liens;
}
