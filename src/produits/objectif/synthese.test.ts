import { describe, expect, it } from "vitest";
import { getRoadmap } from "@/lib/roadmaps";
import { syntheseObjectif } from "./synthese";

const roadmap = getRoadmap("ingenieur-caas-telco")!;

describe("syntheseObjectif", () => {
  it("sans cible : rien à couvrir, des exemples d'objectifs", () => {
    const s = syntheseObjectif(roadmap, null, {});
    expect(s.cible).toBeUndefined();
    expect(s.membres).toEqual([]);
    expect(s.critique).toBeNull();
    expect(s.puits.length).toBeGreaterThan(0);
    for (const p of s.puits) expect(roadmap.noeuds.some((n) => n.prerequis.includes(p.id))).toBe(false);
  });
  it("une cible inconnue est traitée comme l'absence de cible", () => expect(syntheseObjectif(roadmap, "inconnue", {}).cible).toBeUndefined());
  it("avec une cible : ses prérequis, un chemin critique qui y mène, des compétences disponibles", () => {
    const s = syntheseObjectif(roadmap, "ocp-rds", {});
    expect(s.ids.has("ocp-rds")).toBe(true);
    expect(s.stats.total).toBe(s.membres.length);
    expect(s.critique?.chemin.at(-1)).toBe("ocp-rds");
    expect(s.stats.acquis).toBe(0);
    expect(s.stats.disponibles.length).toBeGreaterThan(0);
  });
  it("une compétence acquise compte et réduit le chemin critique", () => {
    const avant = syntheseObjectif(roadmap, "ocp-rds", {});
    const premier = avant.critique!.chemin[0];
    const apres = syntheseObjectif(roadmap, "ocp-rds", { [premier]: "maitrise" });
    expect(apres.stats.acquis).toBe(1);
    expect(apres.critique!.etapesRestantes).toBeLessThan(avant.critique!.etapesRestantes);
  });
});
