import { describe, expect, it } from "vitest";
import { bilanRappel } from "./quiz";

const q = [
  { id: "a", bonne: 1 },
  { id: "b", bonne: 0 },
];

describe("bilan d'une série de rappel", () => {
  it("n'est pas terminé tant que toutes les questions n'ont pas de réponse", () => {
    expect(bilanRappel(q, {})).toEqual({ repondues: 0, justes: 0, total: 2, termine: false, toutJuste: false });
    expect(bilanRappel(q, { a: 1 })).toMatchObject({ repondues: 1, justes: 1, termine: false, toutJuste: false });
  });
  it("n'est réussi que si toutes les réponses sont justes", () => {
    expect(bilanRappel(q, { a: 1, b: 0 })).toMatchObject({ termine: true, toutJuste: true });
    expect(bilanRappel(q, { a: 1, b: 3 })).toMatchObject({ termine: true, toutJuste: false, justes: 1 });
  });
  it("ne réussit jamais une série vide", () => {
    expect(bilanRappel([], {})).toMatchObject({ termine: false, toutJuste: false });
  });
});
