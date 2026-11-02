import { describe, expect, it } from "vitest";
import { chargerRoadmaps, validerRoadmap } from "./roadmaps";

const noeud = (id: string, prerequis: string[] = []) => ({
  id,
  titre: id,
  bloc: "B",
  niveau: "fondamental",
  prerequis,
  demande: "forte",
  resume: "r",
  ressources: [],
});

const roadmap = (noeuds: ReturnType<typeof noeud>[]) => ({
  id: "test",
  titre: "Test",
  type: "role",
  version: "0.1",
  source: "s",
  legende_demande: { forte: "a", moyenne: "b", faible: "c" },
  blocs: ["B"],
  noeuds,
});

describe("validation des roadmaps", () => {
  it("accepte un graphe valide", () => {
    expect(() => validerRoadmap(roadmap([noeud("a"), noeud("b", ["a"])]))).not.toThrow();
  });

  it("rejette un prérequis inexistant", () => {
    expect(() => validerRoadmap(roadmap([noeud("a", ["fantome"])]))).toThrow(/prérequis inexistant : « fantome »/);
  });

  it("rejette deux nœuds de même id", () => {
    expect(() => validerRoadmap(roadmap([noeud("a"), noeud("a")]))).toThrow(/en double : « a »/);
  });

  it("rejette un cycle de prérequis", () => {
    const r = roadmap([noeud("a", ["c"]), noeud("b", ["a"]), noeud("c", ["b"])]);
    expect(() => validerRoadmap(r)).toThrow(/Cycle dans les prérequis/);
  });

  it("rejette un nœud qui est son propre prérequis", () => {
    expect(() => validerRoadmap(roadmap([noeud("a", ["a"])]))).toThrow(/Cycle|propre prérequis/);
  });

  it("charge et valide tout le contenu de content/roadmaps", () => {
    const roadmaps = chargerRoadmaps();
    expect(roadmaps.length).toBeGreaterThan(0);
    for (const r of roadmaps) expect(r.noeuds.length).toBeGreaterThan(0);
  });

  it("donne à chaque nœud au moins une référence ouverte avec lien", () => {
    for (const r of chargerRoadmaps())
      for (const n of r.noeuds) {
        const ouvertes = n.ressources.filter((x) => (x.type === "opensource" || x.type === "libre") && x.url);
        expect(ouvertes.length, `${r.id}/${n.id}`).toBeGreaterThan(0);
      }
  });
});
