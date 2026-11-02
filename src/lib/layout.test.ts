import { describe, expect, it } from "vitest";
import { calculerDisposition, calculerDispositionObjectif, X_DROITE, X_GAUCHE } from "./layout";
import { ancetres } from "./objectif";
import { getRoadmap } from "./roadmaps";

describe("calculerDisposition", () => {
  const r = getRoadmap("ingenieur-caas-telco")!;
  const { noeuds, entetes } = calculerDisposition(r);

  it("place tous les nœuds et un en-tête par bloc", () => {
    expect(noeuds.size).toBe(r.noeuds.length);
    expect([...entetes.keys()]).toEqual(r.blocs);
  });

  it("met les nœuds sur l'une des deux branches", () => {
    for (const p of noeuds.values()) expect(p.x).toBe(p.cote === "gauche" ? X_GAUCHE : X_DROITE);
  });

  it("ne superpose aucun nœud", () => {
    const cles = new Set([...noeuds.values()].map((p) => `${p.x}:${p.y}`));
    expect(cles.size).toBe(noeuds.size);
  });

  it("empile les blocs dans l'ordre sur le tronc", () => {
    const ys = r.blocs.map((b) => entetes.get(b)!.y);
    expect([...ys].sort((a, b) => a - b)).toEqual(ys);
  });

  it("place un prérequis du même bloc au même niveau ou au-dessus", () => {
    for (const n of r.noeuds)
      for (const p of n.prerequis) {
        const parent = r.noeuds.find((x) => x.id === p)!;
        if (parent.bloc === n.bloc) expect(noeuds.get(p)!.y).toBeLessThanOrEqual(noeuds.get(n.id)!.y);
      }
  });
});

describe("calculerDispositionObjectif", () => {
  const r = getRoadmap("ingenieur-caas-telco")!;
  const ids = ancetres(r, "dimensionnement");
  const pos = calculerDispositionObjectif(r, ids);

  it("place exactement les nœuds de l'objectif, sans superposition", () => {
    expect(new Set(pos.keys())).toEqual(ids);
    expect(new Set([...pos.values()].map((p) => `${p.x}:${p.y}`)).size).toBe(ids.size);
  });

  it("place chaque prérequis strictement à gauche de son dépendant", () => {
    for (const n of r.noeuds.filter((x) => ids.has(x.id)))
      for (const p of n.prerequis) expect(pos.get(p)!.x).toBeLessThan(pos.get(n.id)!.x);
  });
});
