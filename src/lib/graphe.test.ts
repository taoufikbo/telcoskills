import { describe, expect, it } from "vitest";
import { indexer } from "./carte";
import { amorce, construireGraphe, developper, disposerGraphe, idNoeud, phrases, rechercher, typeDe } from "./graphe";
import { chargerProjets, resoudreProjet } from "./projets";

const projet = resoudreProjet(chargerProjets()[0]).projet;
const index = indexer(projet);
const graphe = construireGraphe(projet, index);
const etat = () => "a-faire" as const;

describe("graphe du projet", () => {
  it("contient un nœud par rôle, phase, jalon, activité et compétence", () => {
    const n = (t: string) => [...graphe.noeuds.values()].filter((x) => x.type === t).length;
    expect(n("role")).toBe(projet.roles.length);
    expect(n("phase")).toBe(projet.phases.length);
    expect(n("jalon")).toBe(projet.phases.length);
    expect(n("activite")).toBe(index.activites.length);
    expect(n("competence")).toBe(index.competences.size);
  });

  it("relie chaque activité à sa phase, à ses rôles et à ses compétences", () => {
    const a = index.activites[4];
    const id = idNoeud("activite", a.id);
    const v = graphe.voisins.get(id)!;
    expect(v.has(idNoeud("phase", a.phase))).toBe(true);
    for (const r of a.roles) expect(v.has(idNoeud("role", r))).toBe(true);
    for (const c of a.competences) expect(v.has(idNoeud("competence", c))).toBe(true);
  });

  it("n'a que des relations entre nœuds existants", () => {
    for (const r of graphe.relations) {
      expect(graphe.noeuds.has(r.source), r.id).toBe(true);
      expect(graphe.noeuds.has(r.cible), r.id).toBe(true);
    }
  });

  it("chaîne les phases et rattache chaque phase à son jalon", () => {
    expect(graphe.relations.filter((r) => r.type === "PRECEDE")).toHaveLength(projet.phases.length - 1);
    expect(graphe.relations.filter((r) => r.type === "SE_TERMINE_PAR")).toHaveLength(projet.phases.length);
  });
});

describe("perspectives", () => {
  it("la vue d'ensemble ne montre que la frise des phases et des jalons", () => {
    const s = amorce(index, null);
    expect(s).toHaveLength(projet.phases.length * 2);
    expect(s.every((id) => ["phase", "jalon"].includes(typeDe(id)))).toBe(true);
  });

  it("la perspective d'un rôle ajoute le rôle et ses activités, sans compétences", () => {
    const s = amorce(index, "securite");
    const types = new Set(s.map(typeDe));
    expect(s).toContain(idNoeud("role", "securite"));
    expect(types.has("activite")).toBe(true);
    expect(types.has("competence")).toBe(false);
    const activites = s.filter((id) => typeDe(id) === "activite");
    expect(activites).toHaveLength(index.activites.filter((a) => a.roles.includes("securite")).length);
  });

  it("développer un nœud renvoie ses voisins, filtrables par catégorie", () => {
    const id = idNoeud("activite", index.activites[0].id);
    expect(developper(graphe, id).length).toBeGreaterThan(1);
    expect(developper(graphe, id, "competence").every((v) => typeDe(v) === "competence")).toBe(true);
  });

  it("« Pour franchir le jalon k » est cumulatif et limité au rôle de la perspective", () => {
    const k = 3;
    const p = phrases(index, "securite", etat).find((x) => x.id === `franchir-${index.phases[k]}`)!;
    expect(p.ids).toContain(idNoeud("jalon", index.phases[k]));
    expect(p.ids).not.toContain(idNoeud("jalon", index.phases[k + 1]));
    const acts = p.ids.filter((id) => typeDe(id) === "activite").map((id) => index.activites.find((a) => idNoeud("activite", a.id) === id)!);
    expect(acts.every((a) => a.indexPhase <= k && a.roles.includes("securite"))).toBe(true);
  });

  it("« Mes compétences à acquérir » exclut ce qui est maîtrisé", () => {
    const toutMaitrise = phrases(index, "securite", () => "maitrise").find((x) => x.id === "a-acquerir")!;
    expect(toutMaitrise.ids).toHaveLength(0);
    const rien = phrases(index, "securite", etat).find((x) => x.id === "a-acquerir")!;
    expect(rien.ids.some((id) => typeDe(id) === "competence")).toBe(true);
  });
});

describe("recherche", () => {
  const liste = phrases(index, "securite", etat);

  it("propose des phrases sans saisie", () => {
    const r = rechercher(graphe, liste, "");
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((x) => x.genre === "phrase")).toBe(true);
  });

  it("trouve des nœuds sans tenir compte des accents ni de la casse", () => {
    const r = rechercher(graphe, liste, "REGLEMENTAIRE");
    expect(r.some((x) => x.genre === "noeud")).toBe(true);
  });

  it("trouve les phrases par mots-clés", () => {
    expect(rechercher(graphe, liste, "franchir").some((x) => x.genre === "phrase")).toBe(true);
  });
});

describe("placement", () => {
  const visibles = new Set(phrases(index, "securite", etat).find((x) => x.id === "mes-competences")!.ids.concat(amorce(index, "securite")));
  const pos = disposerGraphe(visibles, index);

  it("place chaque nœud visible, sans superposition", () => {
    for (const id of visibles) expect(pos.has(id), id).toBe(true);
    const bruts = [...pos.values()].map((p) => `${Math.round(p.x)}:${Math.round(p.y)}`);
    expect(new Set(bruts).size).toBe(bruts.length);
  });

  it("met les jalons au-dessus des phases, et celles-ci au-dessus des activités", () => {
    const y = (type: "jalon" | "phase" | "activite") => Math.min(...[...pos].filter(([id]) => typeDe(id) === type).map(([, p]) => p.y));
    expect(y("jalon")).toBeLessThan(y("phase"));
    expect(y("phase")).toBeLessThan(y("activite"));
  });

  it("aligne une activité dans la colonne de sa phase", () => {
    const a = index.activites.find((x) => visibles.has(idNoeud("activite", x.id)))!;
    expect(pos.get(idNoeud("activite", a.id))!.x).toBe(pos.get(idNoeud("phase", a.phase))!.x);
  });

  it("garde les rôles à gauche de la frise, espacés", () => {
    const roles = [...pos].filter(([id]) => typeDe(id) === "role").map(([, p]) => p);
    for (const r of roles) expect(r.x).toBeLessThan(Math.min(...[...pos].filter(([id]) => typeDe(id) === "phase").map(([, p]) => p.x)));
  });
});
