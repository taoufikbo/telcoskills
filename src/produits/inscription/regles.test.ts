import { describe, expect, it } from "vitest";
import { doitAfficher, lireEtat } from "./regles";

const J = "2026-11-02";

describe("encart d'inscription : quand le proposer", () => {
  it("jamais à l'arrivée sans parcours choisi", () => {
    expect(doitAfficher({ pages: 1 }, false, J)).toBe(false);
    expect(doitAfficher({ pages: 2 }, false, J)).toBe(false);
  });
  it("à partir de la 3e page, ou dès qu'un parcours est choisi", () => {
    expect(doitAfficher({ pages: 3 }, false, J)).toBe(true);
    expect(doitAfficher({ pages: 1 }, true, J)).toBe(true);
  });
  it("pas avant 30 jours après « Plus tard », puis de nouveau", () => {
    expect(doitAfficher({ pages: 9, fermeLe: "2026-10-20" }, true, J)).toBe(false);
    expect(doitAfficher({ pages: 9, fermeLe: "2026-10-01" }, true, J)).toBe(true);
  });
  it("plus jamais après une inscription", () => expect(doitAfficher({ pages: 9, inscritLe: "2025-01-01" }, true, J)).toBe(false));
  it("lit le stockage avec tolérance", () => {
    expect(lireEtat(null)).toEqual({ pages: 0 });
    expect(lireEtat("{")).toEqual({ pages: 0 });
    expect(lireEtat('{"pages":4,"fermeLe":"2026-10-01","autre":1}')).toEqual({ pages: 4, fermeLe: "2026-10-01" });
  });
});
