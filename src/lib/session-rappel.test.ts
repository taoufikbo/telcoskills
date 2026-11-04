import { describe, expect, it } from "vitest";
import { chargerPratique } from "./pratique";
import type { PratiqueNoeud } from "./pratique-schema";
import { etapesDisponibles, evaluer } from "./session-rappel";

const q = (id: string) => ({ id, enonce: "e", options: ["a", "b", "c", "d"], bonne: 0, explication: "x", source: "s", statut: "valide" as const, mauvaisChoixPlausible: 1 });
const contenu = (vocabulaire = true): PratiqueNoeud["contenu"] => ({
  statut: "valide",
  vocabulaire: vocabulaire ? [{ terme: "t", definition: "d" }] : [],
  segments: [{ titre: "s", elements: ["a"] }],
});

describe("étapes d'une compétence", () => {
  it("suit l'ordre fixe : question, vocabulaire, explication, projet, pourquoi, rappel", () => {
    const p: PratiqueNoeud = { questionPrealable: { ...q("p"), statut: "valide" }, contenu: contenu(), lienProjet: { phase: "design", role: "architecte" }, pourquoi: { question: "q", reference: "r", source: "s", statut: "valide" }, rappel: [q("r1"), q("r2")] };
    expect(etapesDisponibles(p, true)).toEqual(["question", "vocabulaire", "explication", "projet", "pourquoi", "rappel"]);
  });
  it("saute le vocabulaire s'il n'y a pas de terme nouveau, et le projet sans lien", () => {
    const p: PratiqueNoeud = { questionPrealable: q("p"), contenu: contenu(false), rappel: [q("r1"), q("r2")] };
    expect(etapesDisponibles(p, true)).toEqual(["question", "explication", "rappel"]);
    expect(etapesDisponibles({ ...p, lienProjet: { phase: "x", role: "y" } }, false)).not.toContain("projet");
  });
  it("n'a pas de parcours sans question de rappel", () => {
    expect(etapesDisponibles({ questionPrealable: q("p"), contenu: contenu() }, true)).toEqual([]);
    expect(etapesDisponibles({}, true)).toEqual([]);
  });
  it("propose un parcours à chaque compétence du pilote une fois son contenu validé", () => {
    for (const e of chargerPratique().filter((x) => x.rappel)) {
      const valide = {
        ...e,
        questionPrealable: e.questionPrealable && { ...e.questionPrealable, statut: "valide" as const },
        contenu: e.contenu && { ...e.contenu, statut: "valide" as const },
        rappel: e.rappel?.map((x) => ({ ...x, statut: "valide" as const })),
      };
      expect(etapesDisponibles(valide, true).at(-1), e.noeud).toBe("rappel");
    }
  });
});

describe("évaluation du rappel", () => {
  it("réussit seulement si toutes les réponses sont justes", () => {
    expect(evaluer([0, 2, 1], [0, 2, 1])).toEqual({ correctes: 3, total: 3, reussi: true });
    expect(evaluer([0, 2, 1], [0, 2, 3])).toEqual({ correctes: 2, total: 3, reussi: false });
  });
  it("compte une question sans réponse comme fausse", () => {
    expect(evaluer([0, 1], [0, null]).reussi).toBe(false);
  });
  it("ne réussit pas sans question", () => {
    expect(evaluer([], []).reussi).toBe(false);
  });
});
