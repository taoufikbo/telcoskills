import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { chargerLandscape, resoudreLandscape, validerLandscape } from "./chargement";
import { usageParRoles } from "./schema";
import { chargerProjets } from "@/lib/projets";

const landscape = chargerLandscape();
const copie = () => JSON.parse(JSON.stringify(landscape));

describe("landscape", () => {
  it("charge et valide content/landscape.json", () => {
    expect(landscape.outils.length).toBeGreaterThan(0);
  });

  it("couvre chaque rôle technique du projet fil rouge", () => {
    const roles = new Set(landscape.outils.flatMap((o) => o.roles));
    for (const r of ["architecte", "ingenieur-caas", "integrateur-nf", "devops", "sre", "ingenieur-ia", "securite", "reseau", "editeur"])
      expect(roles.has(r), r).toBe(true);
  });

  it("résout chaque compétence vers une roadmap qui la contient", () => {
    const { outils } = resoudreLandscape(landscape);
    for (const o of outils) for (const c of o.competences) expect(c.titre.length, `${o.id}/${c.noeud}`).toBeGreaterThan(0);
  });

  it("donne un logo à la majorité des outils, et seulement quand le fichier existe", () => {
    const { outils } = resoudreLandscape(landscape);
    const avecLogo = outils.filter((o) => o.logo);
    expect(avecLogo.length / outils.length).toBeGreaterThan(0.5);
    for (const o of avecLogo) expect(fs.existsSync(path.join(process.cwd(), "public", o.logo!)), o.id).toBe(true);
  });

  it("préfère la roadmap d'un rôle de l'outil quand le nœud y figure", () => {
    const projet = chargerProjets()[0];
    const sre = projet.roles.find((r) => r.id === "sre")!.roadmap;
    const prometheus = resoudreLandscape(landscape).outils.find((o) => o.id === "prometheus")!;
    // obs-metrics existe dans plusieurs roadmaps ; le premier rôle de l'outil avec une roadmap est « sre ».
    expect(prometheus.competences.find((c) => c.noeud === "obs-metrics")?.roadmap).toBe(sre);
  });

  it("n'expose que les rôles qui ont des outils, dans l'ordre du projet", () => {
    const { roles } = resoudreLandscape(landscape);
    const ordre = chargerProjets()[0].roles.map((r) => r.id);
    expect(roles.map((r) => ordre.indexOf(r.id))).toEqual([...roles.map((r) => ordre.indexOf(r.id))].sort((a, b) => a - b));
    expect(roles.some((r) => r.id === "juridique")).toBe(false);
  });

  it.each([
    ["rôle inconnu", (l: ReturnType<typeof copie>) => (l.outils[0].roles = ["inconnu"]), /rôle inconnu/],
    ["compétence inconnue", (l: ReturnType<typeof copie>) => (l.outils[0].noeuds = ["nimporte-quoi"]), /compétence inconnue/],
    ["catégorie inconnue", (l: ReturnType<typeof copie>) => (l.outils[0].categorie = "nulle-part"), /catégorie inconnue/],
    ["sous-catégorie hors catégorie", (l: ReturnType<typeof copie>) => (l.outils[0].sous_categorie = "stockage"), /absente de/],
    ["outil en double", (l: ReturnType<typeof copie>) => l.outils.push({ ...l.outils[0] }), /Outil en double/],
  ])("refuse : %s", (_nom, modifier, message) => {
    const l = copie();
    modifier(l);
    expect(() => validerLandscape(l)).toThrow(message);
  });

  it("refuse une sous-catégorie sans outil", () => {
    const l = copie();
    l.categories[0].sous_categories.push({ id: "vide", libelle: "Vide" });
    expect(() => validerLandscape(l)).toThrow(/sans outil/);
  });
});

describe("usageParRoles", () => {
  const outil = { roles: ["sre", "devops", "securite"] };
  it("compte tous les rôles quand rien n'est sélectionné", () => expect(usageParRoles(outil, [])).toBe(3));
  it("compte les rôles sélectionnés qui utilisent l'outil", () => expect(usageParRoles(outil, ["sre", "devops", "reseau"])).toBe(2));
  it("renvoie 0 pour un outil hors pile", () => expect(usageParRoles(outil, ["reseau"])).toBe(0));
});
