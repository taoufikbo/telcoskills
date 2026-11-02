type Pos = { x: number; y: number };

/**
 * Nœud voisin dans la direction d'une flèche du clavier. Haut/bas : même colonne (même x), le plus proche ;
 * gauche/droite : la colonne la plus proche dans cette direction, puis le nœud le plus proche en hauteur.
 */
export function voisinClavier(positions: Map<string, Pos>, id: string, touche: string): string | null {
  const p = positions.get(id);
  if (!p) return null;
  let meilleur: string | null = null;
  let score = Infinity;
  for (const [autre, q] of positions) {
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const ok = (
      {
        ArrowDown: dx === 0 && dy > 0,
        ArrowUp: dx === 0 && dy < 0,
        ArrowRight: dx > 0,
        ArrowLeft: dx < 0,
      } as Record<string, boolean>
    )[touche];
    if (!ok) continue;
    const d = dx === 0 ? Math.abs(dy) : Math.abs(dx) * 10 + Math.abs(dy);
    if (d < score) [meilleur, score] = [autre, d];
  }
  return meilleur;
}

/**
 * Navigation sur un plan de métro : gauche/droite le long de la ligne (même ordonnée), haut/bas vers la ligne
 * voisine, à la station la plus proche en abscisse.
 */
export function voisinLigne(positions: Map<string, Pos>, id: string, touche: string): string | null {
  const p = positions.get(id);
  if (!p) return null;
  const autres = [...positions].filter(([autre]) => autre !== id);

  if (touche === "ArrowLeft" || touche === "ArrowRight") {
    const sens = touche === "ArrowRight" ? 1 : -1;
    const memeLigne = autres.filter(([, q]) => q.y === p.y && (q.x - p.x) * sens > 0);
    memeLigne.sort((a, b) => Math.abs(a[1].x - p.x) - Math.abs(b[1].x - p.x));
    return memeLigne[0]?.[0] ?? null;
  }

  if (touche === "ArrowUp" || touche === "ArrowDown") {
    const sens = touche === "ArrowDown" ? 1 : -1;
    const lignes = autres.filter(([, q]) => (q.y - p.y) * sens > 0);
    if (lignes.length === 0) return null;
    const yProche = Math.min(...lignes.map(([, q]) => Math.abs(q.y - p.y)));
    const candidats = lignes.filter(([, q]) => Math.abs(q.y - p.y) === yProche);
    candidats.sort((a, b) => Math.abs(a[1].x - p.x) - Math.abs(b[1].x - p.x) || a[1].x - b[1].x);
    return candidats[0][0];
  }
  return null;
}
