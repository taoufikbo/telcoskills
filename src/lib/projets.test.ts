import { describe, expect, it } from "vitest";
import { chargerProjets, resoudreProjet, validerProjet } from "./projets";
import { chargerRoadmaps } from "./roadmaps";

const roadmaps = chargerRoadmaps();
const projets = chargerProjets();

/** Copie profonde modifiable d'un projet valide. */
const copie = () => JSON.parse(JSON.stringify(projets[0]));

describe("projets", () => {
  it("charge et valide les projets du dossier content/projets", () => {
    expect(projets.length).toBeGreaterThan(0);
  });

  it("résout chaque compétence vers un nœud réel", () => {
    for (const p of projets) {
      const { projet } = resoudreProjet(p);
      for (const phase of projet.phases)
        for (const a of phase.activites) for (const c of a.competences) expect(c.titre.length, `${c.roadmap}/${c.noeud}`).toBeGreaterThan(0);
    }
  });

  it("donne à chaque phase un jalon, des livrables et au moins une activité", () => {
    for (const p of projets)
      for (const phase of p.phases) {
        expect(phase.jalon.criteres.length, phase.id).toBeGreaterThan(0);
        expect(phase.livrables.length, phase.id).toBeGreaterThan(0);
      }
  });

  it("rejette une compétence qui n'existe pas dans sa roadmap", () => {
    const p = copie();
    p.phases[0].activites[0].competences.push({ roadmap: "ingenieur-caas-telco", noeud: "fantome" });
    expect(() => validerProjet(p, roadmaps)).toThrow(/le nœud « fantome » n'existe pas/);
  });

  it("rejette une roadmap inconnue, dans une compétence comme dans un rôle", () => {
    const a = copie();
    a.phases[0].activites[0].competences.push({ roadmap: "inconnue", noeud: "linux" });
    expect(() => validerProjet(a, roadmaps)).toThrow(/roadmap inconnue « inconnue »/);
    const b = copie();
    b.roles[1].roadmap = "inconnue";
    expect(() => validerProjet(b, roadmaps)).toThrow(/roadmap inexistante/);
  });

  it("rejette un rôle inconnu dans une activité", () => {
    const p = copie();
    p.phases[0].activites[0].roles.push("fantome");
    expect(() => validerProjet(p, roadmaps)).toThrow(/rôle inconnu « fantome »/);
  });

  it("rejette un rôle qui n'intervient nulle part et les identifiants en double", () => {
    const a = copie();
    a.roles.push({ id: "figurant", libelle: "Figurant", description: "n'intervient jamais" });
    expect(() => validerProjet(a, roadmaps)).toThrow(/n'intervient dans aucune activité/);
    const b = copie();
    b.phases.push(b.phases[0]);
    expect(() => validerProjet(b, roadmaps)).toThrow(/Phase en double/);
  });
});
