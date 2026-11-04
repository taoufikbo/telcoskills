import { describe, expect, it } from "vitest";
// @ts-expect-error module JavaScript sans déclaration de types (règles partagées avec le script de classement)
import { MAX_COMMENCER, classerCompetence, etapeInitiale } from "../../scripts/etapes-regles.mjs";
import { chargerRoadmaps, getRoadmap } from "./roadmaps";

describe("ressources en trois temps : règles (EX-08, CD-05)", () => {
  it("classe les certifications, livres, retours d'expérience et spécifications « pour aller plus loin »", () => {
    for (const type of ["certif", "livre", "retour-experience", "spec"]) expect(etapeInitiale({ type, nom: "x" })).toBe("aller-plus-loin");
  });
  it("classe les documentations et projets ouverts « pour approfondir »", () => {
    for (const type of ["doc", "opensource", "libre"]) expect(etapeInitiale({ type, nom: "Introduction to X" })).toBe("approfondir");
  });
  it("classe un cours ou une vidéo « pour commencer » seulement si son titre annonce une introduction", () => {
    expect(etapeInitiale({ type: "video", nom: "Linux Commands for Beginners" })).toBe("commencer");
    expect(etapeInitiale({ type: "cours", nom: "Introduction to Linux (LFS101)" })).toBe("commencer");
    expect(etapeInitiale({ type: "cours", nom: "Débuter en administration système et réseau" })).toBe("commencer");
    expect(etapeInitiale({ type: "video", nom: "Kubernetes : opérateurs avancés" })).toBe("approfondir");
  });
  it("plafonne « commencer » à 3 par compétence, en gardant les gratuites puis les françaises", () => {
    const rs = [
      { type: "video", nom: "Intro A", url: "https://a", acces: "payant", langue: "en" },
      { type: "video", nom: "Intro B", url: "https://b", acces: "gratuit", langue: "en" },
      { type: "video", nom: "Intro C", url: "https://c", acces: "gratuit", langue: "fr" },
      { type: "video", nom: "Intro D", url: "https://d", acces: "freemium", langue: "fr" },
      { type: "video", nom: "Intro E", url: "https://e", acces: "gratuit", langue: "fr" },
    ];
    const c = classerCompetence(rs);
    const commencer = [...c].filter(([, e]) => e === "commencer").map(([k]) => k).sort();
    expect(commencer).toHaveLength(MAX_COMMENCER);
    expect(commencer).toEqual(["https://b", "https://c", "https://e"]);
    expect(c.get("https://a")).toBe("approfondir");
  });
});

describe("ressources en trois temps : contenu livré (EX-08)", () => {
  const roadmaps = chargerRoadmaps();
  it("donne une étape à toutes les ressources de toutes les compétences (toutes ou aucune)", () => {
    for (const r of roadmaps) for (const n of r.noeuds) for (const res of n.ressources) expect(res.etape, `${r.id}/${n.id} : ${res.nom}`).toBeDefined();
  });
  it("n'a jamais plus de 3 ressources « pour commencer » par compétence, après fusion avec le catalogue d'apprentissage", () => {
    for (const r of roadmaps) for (const n of getRoadmap(r.id)!.noeuds) expect(n.ressources.filter((x) => x.etape === "commencer").length, `${r.id}/${n.id}`).toBeLessThanOrEqual(MAX_COMMENCER);
  });
  it("ne met aucune certification ni spécification « pour commencer »", () => {
    for (const r of roadmaps) for (const n of r.noeuds) for (const res of n.ressources.filter((x) => ["certif", "livre", "spec", "retour-experience"].includes(x.type))) expect(res.etape).toBe("aller-plus-loin");
  });
});
