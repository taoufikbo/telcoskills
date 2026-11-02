import { describe, expect, it } from "vitest";
import { voisinClavier } from "./navigation";

const pos = new Map([
  ["a", { x: 0, y: 0 }],
  ["b", { x: 0, y: 100 }],
  ["c", { x: 300, y: 10 }],
  ["d", { x: 300, y: 110 }],
]);

describe("voisinClavier", () => {
  it("descend et monte dans la colonne", () => {
    expect(voisinClavier(pos, "a", "ArrowDown")).toBe("b");
    expect(voisinClavier(pos, "b", "ArrowUp")).toBe("a");
  });
  it("change de colonne en gardant la hauteur la plus proche", () => {
    expect(voisinClavier(pos, "b", "ArrowRight")).toBe("d");
    expect(voisinClavier(pos, "c", "ArrowLeft")).toBe("a");
  });
  it("renvoie null au bord", () => {
    expect(voisinClavier(pos, "a", "ArrowUp")).toBeNull();
    expect(voisinClavier(pos, "d", "ArrowRight")).toBeNull();
  });
});

import { voisinLigne } from "./navigation";

describe("voisinLigne", () => {
  const plan = new Map([
    ["a", { x: 0, y: 0 }],
    ["b", { x: 200, y: 0 }],
    ["c", { x: 90, y: 100 }],
    ["d", { x: 400, y: 100 }],
  ]);
  it("avance le long de la ligne", () => {
    expect(voisinLigne(plan, "a", "ArrowRight")).toBe("b");
    expect(voisinLigne(plan, "b", "ArrowLeft")).toBe("a");
    expect(voisinLigne(plan, "b", "ArrowRight")).toBeNull();
  });
  it("change de ligne vers la station la plus proche en abscisse", () => {
    expect(voisinLigne(plan, "a", "ArrowDown")).toBe("c");
    expect(voisinLigne(plan, "b", "ArrowDown")).toBe("c");
    expect(voisinLigne(plan, "d", "ArrowUp")).toBe("b");
    expect(voisinLigne(plan, "a", "ArrowUp")).toBeNull();
  });
});
