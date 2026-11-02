import { describe, expect, it } from "vitest";
import { rechercher, type EntreeRecherche } from "./recherche";

const index: EntreeRecherche[] = [
  { genre: "noeud", titre: "Architecture Kubernetes", contexte: "", href: "/a" },
  { genre: "noeud", titre: "Kubernetes : Services", contexte: "", href: "/b" },
  { genre: "roadmap", titre: "Ingénieur CaaS telco", contexte: "", href: "/c" },
];

describe("recherche", () => {
  it("ignore accents et casse", () => {
    expect(rechercher(index, "INGENIEUR")[0].href).toBe("/c");
  });
  it("classe les débuts de titre en premier", () => {
    expect(rechercher(index, "kubernetes").map((e) => e.href)).toEqual(["/b", "/a"]);
  });
  it("renvoie vide pour une requête vide", () => {
    expect(rechercher(index, "  ")).toEqual([]);
  });
});
