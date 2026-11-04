import { describe, expect, it } from "vitest";
import { grouperParEtape } from "./ressources-etapes";

const r = (nom: string, etape?: "commencer" | "approfondir" | "aller-plus-loin") => ({ type: "doc" as const, nom, ...(etape ? { etape } : {}) });

describe("groupes de ressources (EX-08)", () => {
  it("ordonne commencer, approfondir, aller plus loin et omet les groupes vides", () => {
    const g = grouperParEtape([r("c", "aller-plus-loin"), r("a", "commencer"), r("b", "commencer")]);
    expect(g.map((x) => x.libelle)).toEqual(["Pour commencer", "Pour aller plus loin"]);
    expect(g[0].items.map((x) => x.nom)).toEqual(["a", "b"]);
  });
  it("garde ensemble, en dernier, les ressources sans étape", () => {
    const g = grouperParEtape([r("x"), r("y", "approfondir")]);
    expect(g.map((x) => x.etape)).toEqual(["approfondir", null]);
  });
  it("ne rend rien pour une liste vide", () => expect(grouperParEtape([])).toEqual([]));
});
