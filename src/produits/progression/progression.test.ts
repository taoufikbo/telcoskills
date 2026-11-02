import { describe, expect, it } from "vitest";
import {
  exporterProgression,
  decoderEtat,
  encoderEtat,
  importerProgression,
  lireProgression,
  statistiques,
  statistiquesParBloc,
} from "./progression";
import { getRoadmap } from "@/lib/roadmaps";

const roadmap = getRoadmap("ingenieur-caas-telco")!;

describe("progression", () => {
  it("calcule le pourcentage hors nœuds ignorés", () => {
    const [a, b, c, d] = roadmap.noeuds.slice(0, 4);
    const s = statistiques([a, b, c, d], { [a.id]: "maitrise", [b.id]: "ignore", [c.id]: "en-cours" });
    expect(s).toEqual({ total: 4, maitrise: 1, actifs: 3, pourcentage: 33 });
  });

  it("renvoie 0 % si tout est ignoré", () => {
    const noeuds = roadmap.noeuds.slice(0, 2);
    expect(statistiques(noeuds, Object.fromEntries(noeuds.map((n) => [n.id, "ignore"]))).pourcentage).toBe(0);
  });

  it("calcule une statistique par bloc", () => {
    expect(statistiquesParBloc(roadmap, {}).map((b) => b.bloc)).toEqual(roadmap.blocs);
  });

  it("ignore un localStorage corrompu ou inconnu", () => {
    expect(lireProgression("pas du json", roadmap)).toEqual({});
    expect(lireProgression('{"statuts":{"linux":"nimporte"}}', roadmap)).toEqual({});
    expect(lireProgression('{"statuts":{"fantome":"maitrise","linux":"maitrise"}}', roadmap)).toEqual({ linux: "maitrise" });
  });

  it("fait un aller-retour export/import", () => {
    const prog = { linux: "maitrise", conteneurs: "en-cours" } as const;
    expect(importerProgression(exporterProgression(roadmap, prog), roadmap)).toEqual(prog);
  });

  it("refuse un import d'une autre roadmap ou mal formé", () => {
    expect(() => importerProgression('{"roadmap":"autre","statuts":{}}', roadmap)).toThrow(/autre/);
    expect(() => importerProgression('{"statuts":42}', roadmap)).toThrow(/non reconnu/);
    expect(() => importerProgression("x", roadmap)).toThrow(/JSON/);
  });
});

describe("lien de sauvegarde", () => {
  const [a, b, c] = roadmap.noeuds;

  it("fait l'aller-retour sans perte", () => {
    const prog = { [a.id]: "maitrise", [b.id]: "en-cours", [c.id]: "ignore" } as const;
    expect(decoderEtat(encoderEtat(roadmap, prog), roadmap)).toEqual(prog);
  });

  it("n'encode que des caractères sûrs dans une adresse", () => {
    expect(encoderEtat(roadmap, { [a.id]: "maitrise" })).toMatch(/^[a-z0-9~.-]+$/);
  });

  it("refuse le lien d'une autre roadmap ou un lien illisible", () => {
    expect(() => decoderEtat("autre~x.m", roadmap)).toThrow(/autre/);
    expect(() => decoderEtat(`${roadmap.id}~${a.id}.z`, roadmap)).toThrow(/illisible/);
  });

  it("ignore les nœuds qui n'existent plus", () => {
    expect(decoderEtat(`${roadmap.id}~fantome.m~${a.id}.e`, roadmap)).toEqual({ [a.id]: "en-cours" });
  });
});
