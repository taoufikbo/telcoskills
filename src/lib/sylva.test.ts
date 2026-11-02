import { describe, expect, it } from "vitest";
import { chargerLandscape } from "@/produits/landscape";
import { chargerRoadmaps, getRoadmap } from "./roadmaps";
import { chargerSylva, problemesSylva } from "./sylva";

describe("rubrique Sylva", () => {
  const { sylva: s, units: u } = chargerSylva();
  it("se charge : roadmap, units et liens vers le landscape cohérents", () => expect(u.units.length).toBeGreaterThan(50));
  it("chaque fait a une source en https", () => {
    for (const f of [...s.faits, ...s.fonctionnement, ...s.suse.faits]) expect(f.source.url).toMatch(/^https:\/\//);
  });
  it("la pile SUSE est repérée à partir de la source des charts", () => {
    const suse = u.units.filter((x) => x.suse).map((x) => x.id);
    for (const id of ["rancher", "longhorn", "neuvector", "cabpr", "rancher-turtles"]) expect(suse, id).toContain(id);
    expect(suse).not.toContain("kyverno");
  });
  it("chaque unit a une fonction déclarée, et les ids sont uniques", () => {
    expect(new Set(u.units.map((x) => x.id)).size).toBe(u.units.length);
    for (const x of u.units) expect(u.fonctions[x.fonction], x.id).toBeDefined();
  });
  it("signale une unit inconnue, un outil absent et une roadmap inconnue", () => {
    const faux = { ...s, roadmap: "inconnue", liensLandscape: { ...s.liensLandscape, "unit-inconnue": "outil-inconnu" } };
    expect(problemesSylva(faux, u, chargerRoadmaps(), chargerLandscape().outils)).toHaveLength(3);
  });
  it("le parcours Sylva est thématique : le diagnostic ne le recommande pas", () => expect(getRoadmap(s.roadmap)?.type).toBe("competence"));
});
