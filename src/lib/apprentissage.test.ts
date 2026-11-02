import { describe, expect, it } from "vitest";
import { chargerApprentissage, fusionnerApprentissage, problemesApprentissage, type EntreeApprentissage } from "./apprentissage";
import { chargerRoadmaps, getRoadmap } from "./roadmaps";

const catalogue = chargerApprentissage();
const roadmaps = chargerRoadmaps();

describe("catalogue d'apprentissage", () => {
  it("est valide : types, liens https, conditions d'accès et langue renseignés", () => {
    expect(catalogue.length).toBeGreaterThan(0);
    for (const e of catalogue) {
      expect(e.url.startsWith("https://"), e.nom).toBe(true);
      expect(["cours", "video", "doc"]).toContain(e.type);
    }
  });

  it("ne cite que des nœuds qui existent, sans doublon", () => {
    expect(problemesApprentissage(catalogue, roadmaps)).toEqual([]);
  });

  it("détecte un nœud inexistant et un doublon", () => {
    const e: EntreeApprentissage = { ...catalogue[0], noeuds: ["fantome"] };
    expect(problemesApprentissage([e], roadmaps)[0]).toMatch(/n'existe dans aucune roadmap/);
    const d = { ...catalogue[0], noeuds: [catalogue[0].noeuds[0]] };
    expect(problemesApprentissage([d, d], roadmaps)[0]).toMatch(/lien en double/);
  });

  it("n'étiquette « payant » que des formations (cours), jamais une playlist", () => {
    for (const e of catalogue.filter((x) => x.acces === "payant")) expect(e.type, e.nom).toBe("cours");
  });

  it("ajoute les ressources aux nœuds des roadmaps : gratuites d'abord, puis en français", () => {
    const r = getRoadmap("ingenieur-caas-telco")!;
    const n = r.noeuds.find((x) => x.id === "k8s-archi")!;
    const appr = n.ressources.filter((x) => x.type === "cours" || x.type === "video");
    expect(appr.length).toBeGreaterThan(2);
    const rang = { gratuit: 0, freemium: 1, payant: 2 } as const;
    const acces = appr.map((x) => rang[x.acces!]);
    expect(acces).toEqual([...acces].sort((a, b) => a - b));
    expect(appr[0].langue).toBe("fr");
  });

  it("conserve les ressources existantes (référence ouverte) quand on fusionne", () => {
    const avant = JSON.parse(JSON.stringify(roadmaps[0]));
    const apres = fusionnerApprentissage(avant, []);
    expect(apres.noeuds[0].ressources).toEqual(avant.noeuds[0].ressources);
  });
});
