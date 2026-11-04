import { describe, expect, it } from "vitest";
import { effort, investissement, investissementNoeud, libelleEffort, repartition } from "./palier";

const table = {
  fondamental: { "1": 1, "2": 1, "3": 1, "4": 2, "5": 3 },
  intermediaire: { "1": 1, "2": 1, "3": 2, "4": 3, "5": 3 },
  avance: { "1": 1, "2": 2, "3": 3, "4": 3, "5": 3 },
  transverse: { "1": 1, "2": 1, "3": 1, "4": 2, "5": 3 },
};

describe("investissement par palier", () => {
  it("lit l'investissement selon le niveau et le palier", () => {
    expect(investissement(table, "avance", 3)).toBe(3);
    expect(investissement(table, "fondamental", 3)).toBe(1);
  });
  it("ne déduit rien sans table", () => {
    expect(investissement(undefined, "avance", 3)).toBeUndefined();
  });
  it("répartit léger / moyen / long et ignore les compétences sans palier cible", () => {
    const r = repartition([{ niveau: "avance", cible: 3 }, { niveau: "avance", cible: 1 }, { niveau: "intermediaire", cible: 3 }, { niveau: "avance" }], table);
    expect(r).toEqual({ legers: 1, moyens: 1, longs: 1, sansCible: 1 });
  });
});

describe("effort d'un parcours", () => {
  it("lit l'investissement d'une compétence à son palier cible", () => {
    expect(investissementNoeud(table, { niveau: "avance", cible: 3 })).toBe(3);
    expect(investissementNoeud(table, { niveau: "avance" })).toBeUndefined();
  });
  it("compte léger, moyen et long sans les compétences sans palier", () => {
    expect(effort([{ niveau: "avance", cible: 3 }, { niveau: "avance", cible: 1 }, { niveau: "avance" }], table)).toEqual({ legers: 1, moyens: 0, longs: 1 });
  });
  it("se lit en français, accords compris, catégories vides omises", () => {
    expect(libelleEffort({ legers: 3, moyens: 5, longs: 1 })).toBe("3 légères · 5 moyennes · 1 longue");
    expect(libelleEffort({ legers: 1, moyens: 0, longs: 2 })).toBe("1 légère · 2 longues");
    expect(libelleEffort({ legers: 0, moyens: 0, longs: 0 })).toBe("");
  });
});
