import { describe, expect, it } from "vitest";
import { cheminRuban, disposerFlux } from "./sankey";

const colonnes = [
  [
    { id: "a", label: "A", taille: 3 },
    { id: "b", label: "B", taille: 1 },
  ],
  [
    { id: "p", label: "P", taille: 2 },
    { id: "q", label: "Q", taille: 2 },
  ],
];
const liens = [
  { source: "a", cible: "p", valeur: 2 },
  { source: "a", cible: "q", valeur: 1 },
  { source: "b", cible: "q", valeur: 1 },
];
const dim = { largeur: 400, hauteur: 200, largeurNoeud: 10, ecart: 10 };

describe("disposerFlux", () => {
  const { noeuds, liens: placés } = disposerFlux(colonnes, liens, dim);

  it("place chaque colonne dans la hauteur, sans chevauchement", () => {
    for (const c of [0, 1]) {
      const col = noeuds.filter((n) => n.colonne === c);
      for (let i = 1; i < col.length; i++) expect(col[i].y).toBeGreaterThanOrEqual(col[i - 1].y + col[i - 1].h);
      const dernier = col[col.length - 1];
      expect(dernier.y + dernier.h).toBeLessThanOrEqual(dim.hauteur + 0.001);
    }
  });

  it("donne aux nœuds une hauteur proportionnelle à leur taille", () => {
    const [a, b] = noeuds.filter((n) => n.colonne === 0);
    expect(a.h / b.h).toBeCloseTo(3, 5);
  });

  it("remplit toute la hauteur d'un nœud avec ses bandes, de chaque côté", () => {
    for (const n of noeuds) {
      const sortantes = placés.filter((l) => l.source === n.id).reduce((s, l) => s + l.h0, 0);
      const entrantes = placés.filter((l) => l.cible === n.id).reduce((s, l) => s + l.h1, 0);
      if (sortantes) expect(sortantes).toBeCloseTo(n.h, 5);
      if (entrantes) expect(entrantes).toBeCloseTo(n.h, 5);
    }
  });

  it("relie la droite du nœud source à la gauche du nœud cible", () => {
    for (const l of placés) {
      expect(l.x0).toBe(dim.largeurNoeud);
      expect(l.x1).toBe(dim.largeur - dim.largeurNoeud);
    }
  });

  it("produit un chemin SVG fermé pour chaque bande", () => {
    for (const l of placés) expect(cheminRuban(l)).toMatch(/^M.*C.*L.*C.*Z$/);
  });
});
