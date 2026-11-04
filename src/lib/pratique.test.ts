import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { appliquerRelecture, chargerPratique, fusionnerPratique, problemesPratique, retirerBrouillons } from "./pratique";
import { PratiqueSchema, type Pratique } from "./pratique-schema";
import { chargerRoadmaps, getRoadmap } from "./roadmaps";

const entrees = chargerPratique();
const q = (statut: "brouillon" | "valide", id = "q1") => ({ id, enonce: "e", options: ["a", "b", "c", "d"], bonne: 0, explication: "x", source: "s", statut });
const rq = (statut: "brouillon" | "valide", id: string) => ({ ...q(statut, id), mauvaisChoixPlausible: 1 });
const exemple = (): Pratique => ({
  noeud: "obs-metrics",
  questionPrealable: q("brouillon"),
  contenu: { statut: "valide", vocabulaire: [], segments: [{ titre: "t", elements: ["a"] }] },
  lienProjet: { phase: "plateforme", role: "sre" },
  rappel: [rq("valide", "r1"), rq("brouillon", "r2")],
});

describe("pratique : schéma", () => {
  it("refuse un segment de plus de 4 éléments", () => {
    const p = exemple();
    p.contenu!.segments[0].elements = ["1", "2", "3", "4", "5"];
    expect(PratiqueSchema.safeParse(p).success).toBe(false);
  });
  it("refuse un QCM qui n'a pas 4 propositions distinctes", () => {
    expect(PratiqueSchema.safeParse({ ...exemple(), questionPrealable: { ...q("brouillon"), options: ["a", "a", "b", "c"] } }).success).toBe(false);
    expect(PratiqueSchema.safeParse({ ...exemple(), questionPrealable: { ...q("brouillon"), options: ["a", "b", "c"] } }).success).toBe(false);
  });
  it("refuse un mauvais choix plausible identique à la bonne réponse", () => {
    expect(PratiqueSchema.safeParse({ ...exemple(), rappel: [{ ...rq("brouillon", "r"), mauvaisChoixPlausible: 0 }] }).success).toBe(false);
  });
  it("refuse une flèche vers une boîte inexistante", () => {
    const p = exemple();
    p.contenu!.segments[0].schema = { alt: "x", boites: ["a", "b"], fleches: [[0, 5]] };
    expect(PratiqueSchema.safeParse(p).success).toBe(false);
  });
});

describe("pratique : brouillons", () => {
  it("retire en production tout ce qui n'est pas validé, et garde le lien projet", () => {
    const sortie = retirerBrouillons(exemple());
    expect(sortie.questionPrealable).toBeUndefined();
    expect(sortie.contenu).toBeDefined();
    expect(sortie.rappel?.map((x) => x.id)).toEqual(["r1"]);
    expect(sortie.lienProjet).toBeDefined();
  });
  it("n'affiche aucune question quand tout est en brouillon", () => {
    const tout = { ...exemple(), contenu: undefined, rappel: [rq("brouillon", "r1")] };
    expect(retirerBrouillons(tout).rappel).toBeUndefined();
  });
  it("ne publie, dans les roadmaps de production, aucune question en brouillon du contenu livré", () => {
    for (const r of chargerRoadmaps()) {
      const prod = fusionnerPratique(r, entrees, false);
      for (const n of prod.noeuds) {
        const p = n.pratique;
        if (!p) continue;
        expect(p.questionPrealable?.statut ?? "valide").toBe("valide");
        expect(p.pourquoi?.statut ?? "valide").toBe("valide");
        expect(p.contenu?.statut ?? "valide").toBe("valide");
        for (const x of p.rappel ?? []) expect(x.statut).toBe("valide");
      }
    }
  });
  it("ne laisse sortir en production aucun contenu qui serait en brouillon, quel que soit le contenu actuel", () => {
    // Garde-fou de processus, indépendant de ce que l'auteur a validé : on force tout en brouillon et on vérifie que rien ne reste.
    const tousEnBrouillon = entrees.map((e) => ({
      ...e,
      questionPrealable: e.questionPrealable && { ...e.questionPrealable, statut: "brouillon" as const },
      contenu: e.contenu && { ...e.contenu, statut: "brouillon" as const },
      pourquoi: e.pourquoi && { ...e.pourquoi, statut: "brouillon" as const },
      rappel: e.rappel?.map((q) => ({ ...q, statut: "brouillon" as const })),
    }));
    for (const r of chargerRoadmaps()) {
      const prod = fusionnerPratique(r, tousEnBrouillon, false);
      for (const n of prod.noeuds) {
        const p = n.pratique;
        expect(p === undefined || (!p.questionPrealable && !p.contenu && !p.pourquoi && !p.rappel), `${r.id}/${n.id}`).toBe(true);
      }
    }
  });
  it("n'a que des statuts connus (brouillon ou valide)", () => {
    for (const e of entrees) {
      const statuts = [e.questionPrealable?.statut, e.contenu?.statut, e.pourquoi?.statut, ...(e.rappel ?? []).map((x) => x.statut)].filter(Boolean);
      for (const s of statuts) expect(["brouillon", "valide"]).toContain(s);
    }
  });
});

describe("pratique : contenu livré", () => {
  const roadmaps = chargerRoadmaps();
  it("est cohérent avec les roadmaps", () => expect(problemesPratique(entrees, roadmaps)).toEqual([]));
  it("a un fichier par compétence, nommé d'après elle", () => {
    const fichiers = fs.readdirSync(path.join(process.cwd(), "content", "pratique")).filter((f) => f.endsWith(".json"));
    expect(fichiers.sort()).toEqual(entrees.map((e) => `${e.noeud}.json`).sort());
  });
  it("donne 2 ou 3 questions de rappel à chaque compétence", () => {
    for (const e of entrees.filter((x) => x.rappel)) {
      expect(e.rappel?.length, e.noeud).toBeGreaterThanOrEqual(2);
      expect(e.rappel?.length, e.noeud).toBeLessThanOrEqual(3);
    }
  });
  it("donne aux 5 compétences du bloc pilote le parcours complet", () => {
    for (const id of ["obs-metrics", "obs-logs", "observabilite-design", "ha-geo", "pra-rpo-rto"]) {
      const e = entrees.find((x) => x.noeud === id)!;
      expect(e.questionPrealable, id).toBeDefined();
      expect(e.contenu?.segments.length, id).toBeGreaterThanOrEqual(2);
      expect(e.lienProjet, id).toBeDefined();
    }
  });
  it("réserve « pourquoi » aux nœuds avancés et l'écrit pour les deux nœuds avancés du pilote", () => {
    expect(
      entrees
        .filter((e) => e.pourquoi)
        .map((e) => e.noeud)
        .sort(),
    ).toEqual(["ha-geo", "pra-rpo-rto"]);
  });
  it("fusionne le contenu d'une compétence dans la roadmap qui la contient", () => {
    const ha = getRoadmap("architecte-caas-telco")!.noeuds.find((n) => n.id === "ha-geo")!;
    expect(ha.pratique?.lienProjet).toEqual({ phase: "design", role: "architecte" });
  });
});

describe("relecture", () => {
  it("valide une question de rappel", () => {
    const p = appliquerRelecture(exemple(), { action: "valider", section: "rappel", index: 1 });
    expect(p.rappel?.[1].statut).toBe("valide");
  });
  it("rejette une question et retire la section quand il n'en reste plus", () => {
    const un = { ...exemple(), rappel: [rq("brouillon", "r1")] };
    expect(appliquerRelecture(un, { action: "rejeter", section: "rappel", index: 0 }).rappel).toBeUndefined();
  });
  it("corrige une question et refuse une correction invalide", () => {
    const ok = appliquerRelecture(exemple(), { action: "corriger", section: "questionPrealable", valeur: { ...q("brouillon"), enonce: "nouveau" } });
    expect(ok.questionPrealable?.enonce).toBe("nouveau");
    expect(() => appliquerRelecture(exemple(), { action: "corriger", section: "questionPrealable", valeur: { ...q("brouillon"), bonne: 9 } })).toThrow();
  });
  it("valide le contenu explicatif", () => {
    const p = { ...exemple(), contenu: { statut: "brouillon" as const, vocabulaire: [], segments: [{ titre: "t", elements: ["a"] }] } };
    expect(appliquerRelecture(p, { action: "valider", section: "contenu" }).contenu?.statut).toBe("valide");
  });
});
