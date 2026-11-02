import { describe, expect, it } from "vitest";
import { cheminConseille } from "./chemin";
import { getRoadmap } from "./roadmaps";

const roadmap = getRoadmap("ingenieur-caas-telco")!;

describe("cheminConseille", () => {
  const chemin = cheminConseille(roadmap);

  it("contient tous les nœuds à forte demande", () => {
    for (const n of roadmap.noeuds.filter((x) => x.demande === "forte")) expect(chemin.has(n.id)).toBe(true);
  });

  it("est fermé par prérequis", () => {
    for (const n of roadmap.noeuds.filter((x) => chemin.has(x.id)))
      for (const p of n.prerequis) expect(chemin.has(p)).toBe(true);
  });

  it("inclut un prérequis à demande plus faible (telco-101 via 5g-sba)", () => {
    expect(roadmap.noeuds.find((n) => n.id === "telco-101")!.demande).not.toBe("forte");
    expect(chemin.has("telco-101")).toBe(true);
  });

  it("exclut un nœud faible qui n'est prérequis d'aucun nœud du chemin", () => {
    expect(chemin.has("operators-dev")).toBe(false);
  });
});
