import { describe, expect, it } from "vitest";
import { investissement, repartition } from "./palier";

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
