/**
 * Placement d'un diagramme de flux (alluvial) à colonnes. Chaque nœud a une taille propre ; les bandes occupent
 * toute la hauteur du nœud de chaque côté, proportionnellement à leur valeur. On n'impose donc pas que les
 * unités soient les mêmes d'une colonne à l'autre (activités d'un côté, compétences de l'autre).
 */
export type EntreeNoeud = { id: string; label: string; taille: number };
export type EntreeLien = { source: string; cible: string; valeur: number };

export type NoeudPlace = EntreeNoeud & { colonne: number; x: number; y: number; h: number; w: number };
export type LienPlace = EntreeLien & {
  x0: number;
  x1: number;
  /** Ordonnée du haut de la bande à chaque extrémité, et épaisseur de la bande à chaque extrémité. */
  y0: number;
  y1: number;
  h0: number;
  h1: number;
};

export function disposerFlux(
  colonnes: EntreeNoeud[][],
  liens: EntreeLien[],
  { largeur, hauteur, largeurNoeud, ecart }: { largeur: number; hauteur: number; largeurNoeud: number; ecart: number },
): { noeuds: NoeudPlace[]; liens: LienPlace[] } {
  const noeuds: NoeudPlace[] = [];
  const pas = colonnes.length > 1 ? (largeur - largeurNoeud) / (colonnes.length - 1) : 0;

  colonnes.forEach((col, c) => {
    const total = col.reduce((s, n) => s + n.taille, 0) || 1;
    const echelle = (hauteur - ecart * Math.max(0, col.length - 1)) / total;
    let y = 0;
    for (const n of col) {
      const h = Math.max(n.taille * echelle, 2);
      noeuds.push({ ...n, colonne: c, x: c * pas, y, h, w: largeurNoeud });
      y += h + ecart;
    }
  });

  const parId = new Map(noeuds.map((n) => [n.id, n]));
  const centre = (id: string) => parId.get(id)!.y + parId.get(id)!.h / 2;

  // Position des bandes le long de chaque nœud : triées selon le centre du nœud à l'autre bout, pour limiter les croisements.
  const sortants = new Map<string, EntreeLien[]>();
  const entrants = new Map<string, EntreeLien[]>();
  for (const l of liens) {
    sortants.set(l.source, [...(sortants.get(l.source) ?? []), l]);
    entrants.set(l.cible, [...(entrants.get(l.cible) ?? []), l]);
  }
  const place = new Map<EntreeLien, Partial<LienPlace>>();
  const remplir = (groupe: Map<string, EntreeLien[]>, cote: 0 | 1) => {
    for (const [id, ls] of groupe) {
      const n = parId.get(id)!;
      const tri = [...ls].sort((a, b) => centre(cote === 0 ? a.cible : a.source) - centre(cote === 0 ? b.cible : b.source));
      const somme = tri.reduce((s, l) => s + l.valeur, 0) || 1;
      let y = n.y;
      for (const l of tri) {
        const h = (l.valeur / somme) * n.h;
        place.set(l, { ...place.get(l), ...(cote === 0 ? { y0: y, h0: h } : { y1: y, h1: h }) });
        y += h;
      }
    }
  };
  remplir(sortants, 0);
  remplir(entrants, 1);

  return {
    noeuds,
    liens: liens.map((l) => ({
      ...l,
      x0: parId.get(l.source)!.x + largeurNoeud,
      x1: parId.get(l.cible)!.x,
      ...(place.get(l) as Pick<LienPlace, "y0" | "y1" | "h0" | "h1">),
    })),
  };
}

/** Ruban à épaisseur variable entre deux extrémités (courbes de Bézier haute et basse). */
export function cheminRuban(l: LienPlace): string {
  const xm = (l.x0 + l.x1) / 2;
  return [
    `M${l.x0},${l.y0}`,
    `C${xm},${l.y0} ${xm},${l.y1} ${l.x1},${l.y1}`,
    `L${l.x1},${l.y1 + l.h1}`,
    `C${xm},${l.y1 + l.h1} ${xm},${l.y0 + l.h0} ${l.x0},${l.y0 + l.h0}`,
    "Z",
  ].join(" ");
}
