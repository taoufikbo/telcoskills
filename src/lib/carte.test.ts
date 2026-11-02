import { describe, expect, it } from "vitest";
import { competencesParBloc, fluxPhasesBlocs, fluxRolesPhases, formaterSelection, indexer, liensDe, parserSelection } from "./carte";
import { chargerProjets, resoudreProjet } from "./projets";

const projet = resoudreProjet(chargerProjets()[0]).projet;
const index = indexer(projet);

describe("carte du projet : corrélations", () => {
  it("indexe toutes les activités, rôles, phases et compétences", () => {
    expect(index.phases).toHaveLength(projet.phases.length);
    expect(index.activites).toHaveLength(projet.phases.reduce((s, p) => s + p.activites.length, 0));
    expect(index.competences.size).toBeGreaterThan(50);
  });

  it("sans sélection, rien n'est estompé", () => {
    expect(liensDe(index, null)).toBeNull();
  });

  it("un rôle éclaire ses phases, ses jalons et ses compétences, pas toutes", () => {
    const l = liensDe(index, { type: "role", id: "juridique" })!;
    expect(l.roles.has("juridique")).toBe(true);
    expect(l.phases.size).toBeGreaterThan(0);
    expect(l.phases.size).toBeLessThan(index.phases.length);
    expect(l.jalons).toEqual(l.phases);
  });

  it("une compétence éclaire les phases et les rôles qui la mobilisent", () => {
    const l = liensDe(index, { type: "competence", id: "amf" })!;
    expect(l.phases.has("integration")).toBe(true);
    expect(l.roles.has("integrateur-nf")).toBe(true);
    expect(l.roles.has("juridique")).toBe(false);
  });

  it("un jalon est cumulatif : il éclaire les phases précédentes, pas les suivantes", () => {
    const k = 2;
    const l = liensDe(index, { type: "jalon", id: index.phases[k] })!;
    expect([...l.phases].sort()).toEqual(index.phases.slice(0, k + 1).sort());
    expect(l.phases.has(index.phases[k + 1])).toBe(false);
  });

  it("une phase éclaire son jalon, ses rôles et ses compétences", () => {
    const l = liensDe(index, { type: "phase", id: "tests" })!;
    expect([...l.jalons]).toEqual(["tests"]);
    expect(l.roles.size).toBeGreaterThan(1);
  });

  it("une activité éclaire sa phase, ses rôles et ses compétences", () => {
    const a = index.activites[3];
    const l = liensDe(index, { type: "activite", id: a.id })!;
    expect([...l.phases]).toEqual([a.phase]);
    expect(l.roles).toEqual(new Set(a.roles));
    expect(l.competences).toEqual(new Set(a.competences));
  });

  it("sérialise et relit une sélection, et rejette une valeur invalide", () => {
    const s = { type: "competence", id: "k8s-archi" } as const;
    expect(parserSelection(formaterSelection(s))).toEqual(s);
    expect(parserSelection("nimporte")).toBeNull();
    expect(parserSelection("robot:x")).toBeNull();
    expect(parserSelection(null)).toBeNull();
  });

  it("le flux rôles → phases totalise tous les couples (activité, rôle)", () => {
    const total = fluxRolesPhases(index).reduce((s, l) => s + l.valeur, 0);
    expect(total).toBe(index.activites.reduce((s, a) => s + a.roles.length, 0));
  });

  it("le flux phases → domaines compte chaque compétence une fois par phase", () => {
    const attendu = index.phases.reduce((s, p) => s + new Set(index.activites.filter((a) => a.phase === p).flatMap((a) => a.competences)).size, 0);
    expect(fluxPhasesBlocs(index).reduce((s, l) => s + l.valeur, 0)).toBe(attendu);
  });

  it("regroupe toutes les compétences par domaine", () => {
    expect(competencesParBloc(index).flatMap((g) => g.competences)).toHaveLength(index.competences.size);
  });
});
