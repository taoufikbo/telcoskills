import { describe, expect, it } from "vitest";
import { chargerRoadmaps, getRoadmap } from "@/lib/roadmaps";
import { CARACTERES_PAR_LIGNE, choisirCible, couperLibelle, disposerCarte, TAILLE_MAX_CARTE } from "./disposition";

describe("couperLibelle", () => {
  it("ne retire aucun caractère et respecte la largeur", () => {
    for (const r of chargerRoadmaps())
      for (const n of r.noeuds) {
        const lignes = couperLibelle(n.titre);
        expect(lignes.join(" ").replace(/\s+/g, ""), n.titre).toBe(n.titre.replace(/\s+/g, ""));
        for (const l of lignes) expect(l.length, l).toBeLessThanOrEqual(CARACTERES_PAR_LIGNE);
      }
  });
  it("coupe aux espaces", () => expect(couperLibelle("Installation OpenShift (bare metal, agent, assisted)", 23)).toEqual(["Installation OpenShift", "(bare metal, agent,", "assisted)"]));
  it("coupe net un mot trop long", () => expect(couperLibelle("abcdefghij", 4)).toEqual(["abcd", "efgh", "ij"]));
});

describe("disposerCarte", () => {
  const roadmap = getRoadmap("ingenieur-caas-telco")!;
  const d = disposerCarte(roadmap, ["sriov", "ocp-rds"]);

  it("contient la cible et tous ses prérequis, sans libellé tronqué", () => {
    expect(d.cible.id).toBe("ocp-rds");
    expect(d.noeuds.some((n) => n.id === "sriov")).toBe(true);
    for (const n of d.noeuds) {
      expect(n.lignes.join(" ")).toBe(n.titre.split(/\s+/).join(" "));
      expect(n.titre).not.toContain("…");
    }
  });
  it("le chemin va d'une compétence sans prérequis à la cible, en suivant des arêtes de la carte", () => {
    expect(d.chemin.at(-1)?.id).toBe("ocp-rds");
    const premier = roadmap.noeuds.find((n) => n.id === d.chemin[0].id)!;
    expect(premier.prerequis.filter((p) => d.noeuds.some((n) => n.id === p))).toEqual([]);
    for (let i = 1; i < d.chemin.length; i++) expect(d.aretes.some((a) => a.de === d.chemin[i - 1].id && a.a === d.chemin[i].id && a.surChemin)).toBe(true);
  });
  it("est sérialisable (passée telle quelle du serveur au composant)", () => expect(JSON.parse(JSON.stringify(d))).toEqual(d));
  it("refuse une cible inconnue", () => expect(() => disposerCarte(roadmap, ["inconnue"])).toThrow(/inconnue/));
  it("donne à chaque compétence son amont (prérequis transitifs dans la carte) et, si demandé, la répartition léger / moyen / long cumulée", () => {
    const avecHeures = disposerCarte(roadmap, ["sriov", "ocp-rds"], { investissement: () => 2 });
    const ids = new Set(avecHeures.noeuds.map((n) => n.id));
    for (const n of avecHeures.noeuds) {
      expect(n.amont).not.toContain(n.id);
      for (const a of n.amont) expect(ids.has(a)).toBe(true);
      const directs = roadmap.noeuds.find((x) => x.id === n.id)!.prerequis.filter((p) => ids.has(p));
      for (const p of directs) expect(n.amont).toContain(p);
      expect(n.effort).toEqual({ legers: 0, moyens: n.amont.length + 1, longs: 0 });
    }
    expect(d.noeuds.every((n) => n.effort === undefined)).toBe(true);
  });
});

describe("choisirCible", () => {
  const roadmap = getRoadmap("ingenieur-caas-telco")!;
  it("choisit une compétence qui s'appuie sur le départ, dans la limite de taille", () => {
    for (const depart of ["telco-101", "k8s-archi", "ocp-install"]) {
      const cible = choisirCible(roadmap, depart);
      const d = disposerCarte(roadmap, [cible]);
      expect(d.noeuds.some((n) => n.id === depart), depart).toBe(true);
      expect(d.noeuds.length).toBeLessThanOrEqual(TAILLE_MAX_CARTE);
    }
  });
  it("retombe sur le départ quand rien ne s'appuie dessus", () => {
    const r = { id: "r", noeuds: [{ id: "a", titre: "A", prerequis: [] }, { id: "b", titre: "B", prerequis: [] }] };
    expect(choisirCible(r, "a")).toBe("a");
  });
  it("prend la plus avancée possible", () => {
    const r = { id: "r", noeuds: [{ id: "a", titre: "A", prerequis: [] }, { id: "b", titre: "B", prerequis: ["a"] }, { id: "c", titre: "C", prerequis: ["b"] }] };
    expect(choisirCible(r, "a")).toBe("c");
    expect(choisirCible(r, "a", 2)).toBe("b");
  });
});
