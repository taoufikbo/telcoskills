import { describe, expect, it } from "vitest";
import { aConfirmer, blocsTestables, NE_SAIT_PAS, resultatTest, slugBloc, type NoeudTest } from "./positionnement";
import { fusionnerPratique } from "./pratique";
import { chargerPratique } from "./pratique";
import type { Rappel } from "./pratique-schema";
import { getRoadmap } from "./roadmaps";

const q = (id: string, bonne = 0): Rappel => ({ id, enonce: "e", options: ["a", "b", "c", "d"], bonne, explication: "x", source: "s", statut: "valide", mauvaisChoixPlausible: bonne === 0 ? 1 : 0 });
const noeud = (id: string): NoeudTest => ({ id, titre: id, niveau: "intermediaire", q1: q(`${id}-1`, 1), q2: q(`${id}-2`, 2) });
const noeuds = ["a", "b", "c", "d", "e"].map(noeud);

describe("test de positionnement", () => {
  it("ne confirme que les compétences dont la première question est juste", () => {
    const premieres = { a: 1, b: 0, c: NE_SAIT_PAS, d: 1, e: null };
    expect(aConfirmer(noeuds, premieres).map((n) => n.id)).toEqual(["a", "d"]);
  });
  it("une personne qui ne sait pas répond à une question par compétence, aucune seconde", () => {
    const rien = Object.fromEntries(noeuds.map((n) => [n.id, NE_SAIT_PAS]));
    expect(aConfirmer(noeuds, rien)).toEqual([]);
  });
  it("n'acquiert qu'avec les deux questions justes", () => {
    const premieres = { a: 1, b: 1, c: 1, d: 0, e: NE_SAIT_PAS };
    const secondes = { a: 2, b: 0, c: NE_SAIT_PAS };
    const r = resultatTest(noeuds, premieres, secondes);
    expect(r.acquis).toEqual(["a"]);
    expect(r.aTravailler).toEqual(["b", "c", "d", "e"]);
  });
  it("« je ne sais pas » ne donne jamais d'acquis, même si la seconde est juste", () => {
    expect(resultatTest(noeuds, { a: NE_SAIT_PAS }, { a: 2 }).acquis).toEqual([]);
  });
  it("une réponse manquante compte comme non acquise", () => {
    expect(resultatTest(noeuds, {}, {}).acquis).toEqual([]);
  });
  it("partitionne : chaque compétence est soit acquise soit à travailler", () => {
    const r = resultatTest(noeuds, { a: 1, b: 1 }, { a: 2, b: 2 });
    expect([...r.acquis, ...r.aTravailler].sort()).toEqual(noeuds.map((n) => n.id).sort());
  });
});

describe("adresses de bloc", () => {
  it("fabrique un identifiant sans accent ni espace", () => {
    expect(slugBloc("Résilience et exploitabilité")).toBe("resilience-et-exploitabilite");
    expect(slugBloc("Cœur 5G et CNF")).toBe("c-ur-5g-et-cnf");
  });
});

describe("blocs testables du contenu livré", () => {
  const entrees = chargerPratique();
  const architecte = fusionnerPratique(getRoadmap("architecte-caas-telco")!, entrees, true);
  it("le bloc pilote est testable, avec ses 5 compétences", () => {
    const b = blocsTestables([architecte]).find((x) => x.bloc === "Résilience et exploitabilité")!;
    expect(b.noeuds.map((n) => n.id).sort()).toEqual(["ha-geo", "obs-logs", "obs-metrics", "observabilite-design", "pra-rpo-rto"]);
    expect(b.slug).toBe("resilience-et-exploitabilite");
  });
  it("les deux questions d'une compétence sont distinctes", () => {
    for (const b of blocsTestables([architecte])) for (const n of b.noeuds) expect(n.q1.id).not.toBe(n.q2.id);
  });
  it("un bloc dont une seule compétence a des questions n'est pas testable", () => {
    const seul = { ...architecte, blocs: ["Fondations"], noeuds: architecte.noeuds.filter((n) => n.bloc === "Fondations") };
    expect(blocsTestables([seul])).toEqual([]);
  });
  it("en production, des questions en brouillon ne rendent jamais un bloc testable, quel que soit le contenu actuel", () => {
    const tousEnBrouillon = entrees.map((e) => ({ ...e, rappel: e.rappel?.map((q) => ({ ...q, statut: "brouillon" as const })), questionPrealable: e.questionPrealable && { ...e.questionPrealable, statut: "brouillon" as const } }));
    const prod = fusionnerPratique(getRoadmap("architecte-caas-telco")!, tousEnBrouillon, false);
    expect(blocsTestables([prod])).toEqual([]);
  });
});
