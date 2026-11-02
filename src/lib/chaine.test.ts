import { describe, expect, it } from "vitest";
import { chargerChaine, validerChaine } from "./chaine";
import { chargerProjets } from "./projets";

const projets = chargerProjets();
const chaine = chargerChaine();
const copie = () => JSON.parse(JSON.stringify(chaine));

describe("chaîne du projet", () => {
  it("charge et valide content/chaine-projet.json", () => {
    expect(chaine.etapes.length).toBeGreaterThanOrEqual(2);
  });

  it("couvre chaque phase du projet, dans l'ordre", () => {
    const projet = projets.find((p) => p.id === chaine.projet)!;
    const couvertes = [...new Set(chaine.etapes.flatMap((e) => e.phases))];
    expect(couvertes).toEqual(projet.phases.map((p) => p.id));
  });

  it("fait intervenir chaque rôle du projet au moins une fois", () => {
    const projet = projets.find((p) => p.id === chaine.projet)!;
    const actifs = new Set(chaine.etapes.flatMap((e) => Object.keys(e.actions)));
    for (const r of projet.roles) expect(actifs.has(r.id), r.id).toBe(true);
  });

  it("refuse un rôle inconnu", () => {
    const c = copie();
    c.etapes[0].actions["role-fantome"] = "x";
    expect(() => validerChaine(c, projets)).toThrow(/rôle inconnu/);
  });

  it("refuse une phase inconnue", () => {
    const c = copie();
    c.etapes[0].phases = ["phase-fantome"];
    expect(() => validerChaine(c, projets)).toThrow(/phase inconnue/);
  });

  it("refuse une étape en double", () => {
    const c = copie();
    c.etapes[1].id = c.etapes[0].id;
    expect(() => validerChaine(c, projets)).toThrow(/en double/);
  });
});
