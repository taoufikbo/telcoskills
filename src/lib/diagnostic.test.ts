import { describe, expect, it } from "vitest";
import { chargerDiagnostic } from "./diagnostic";
import { calculer, niveauDuBloc, problemesDiagnostic, reponsesCompletes } from "./diagnostic-schema";
import { chargerRoadmaps } from "./roadmaps";

const d = chargerDiagnostic();
const toutesAu = (niveau: number) => Object.fromEntries(d.questions.map((q) => [q.id, niveau]));

describe("diagnostic d'équipe", () => {
  it("est valide : chaque question a quatre options et un bloc connu, chaque bloc a des questions", () => {
    expect(d.questions.length).toBe(12);
    for (const b of d.blocs) expect(d.questions.filter((q) => q.bloc === b.id).length, b.id).toBeGreaterThan(0);
  });

  it("ne cite que des compétences de la roadmap Architecte", () => {
    const architecte = chargerRoadmaps().find((r) => r.id === "architecte-caas-telco")!;
    expect(problemesDiagnostic(d, architecte)).toEqual([]);
  });

  it("donne 0 % sans réponse et 100 % avec les meilleures réponses", () => {
    expect(calculer(d, {}).pourcentage).toBe(0);
    const max = calculer(d, toutesAu(3));
    expect(max.pourcentage).toBe(100);
    expect(max.points).toBe(max.maximum);
  });

  it("ignore les indices hors bornes", () => {
    expect(calculer(d, toutesAu(99)).pourcentage).toBe(100);
    expect(calculer(d, toutesAu(-4)).pourcentage).toBe(0);
  });

  it("classe les blocs selon les seuils", () => {
    expect(niveauDuBloc(0, d.seuils)).toBe("a-consolider");
    expect(niveauDuBloc(d.seuils.enProgres, d.seuils)).toBe("en-progres");
    expect(niveauDuBloc(d.seuils.solide, d.seuils)).toBe("solide");
  });

  it("détecte un questionnaire incomplet", () => {
    expect(reponsesCompletes(d, {})).toBe(false);
    expect(reponsesCompletes(d, toutesAu(1))).toBe(true);
  });

  it("est marqué brouillon tant que l'auteur ne l'a pas relu", () => {
    expect(d.brouillon).toBe(true);
  });
});
