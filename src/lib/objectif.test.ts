import { describe, expect, it } from "vitest";
import { ancetres, cheminCritique, etats, prochaineEtape, rangs } from "./objectif";
import { getRoadmap } from "./roadmaps";

const roadmap = getRoadmap("ingenieur-caas-telco")!;
const CIBLE = "dimensionnement";

describe("mode objectif", () => {
  const ids = ancetres(roadmap, CIBLE);

  it("contient l'objectif et ses prérequis, et eux seuls", () => {
    expect(ids.has(CIBLE)).toBe(true);
    expect(ids.has("linux")).toBe(true); // via perf-profile
    expect(ids.has("operators-dev")).toBe(false);
    for (const n of roadmap.noeuds.filter((x) => ids.has(x.id))) for (const p of n.prerequis) expect(ids.has(p)).toBe(true);
  });

  it("donne à chaque nœud un rang strictement supérieur à celui de ses prérequis", () => {
    const sous = roadmap.noeuds.filter((n) => ids.has(n.id));
    const r = rangs(sous);
    for (const n of sous) for (const p of n.prerequis) expect(r.get(n.id)!).toBeGreaterThan(r.get(p)!);
    expect(r.get("linux")).toBe(0);
  });

  it("marque disponibles les nœuds sans prérequis, verrouille les autres", () => {
    const e = etats(roadmap, ids, {});
    expect(e.get("linux")).toBe("disponible");
    expect(e.get("multus")).toBe("verrouille");
    expect(e.get(CIBLE)).toBe("verrouille");
  });

  it("débloque un nœud quand ses prérequis sont acquis ou ignorés", () => {
    const e = etats(roadmap, ids, { linux: "maitrise", "reseau-ip": "ignore", conteneurs: "maitrise", "k8s-archi": "maitrise" });
    expect(e.get("linux")).toBe("acquis");
    expect(e.get("reseau-ip")).toBe("ignore");
    expect(e.get("k8s-services")).toBe("disponible");
  });

  it("calcule un chemin critique qui finit à l'objectif et suit les prérequis", () => {
    const { chemin, etapesRestantes } = cheminCritique(roadmap, CIBLE, {});
    expect(chemin.at(-1)).toBe(CIBLE);
    expect(etapesRestantes).toBe(chemin.length);
    for (let i = 1; i < chemin.length; i++)
      expect(roadmap.noeuds.find((n) => n.id === chemin[i])!.prerequis).toContain(chemin[i - 1]);
  });

  it("diminue les étapes restantes quand des nœuds du chemin sont acquis", () => {
    const avant = cheminCritique(roadmap, CIBLE, {});
    const apres = cheminCritique(roadmap, CIBLE, { [avant.chemin[0]]: "maitrise" });
    expect(apres.etapesRestantes).toBeLessThanOrEqual(avant.etapesRestantes);
  });

  it("renvoie 0 étape restante si tout est acquis", () => {
    const prog = Object.fromEntries([...ids].map((id) => [id, "maitrise" as const]));
    expect(cheminCritique(roadmap, CIBLE, prog).etapesRestantes).toBe(0);
  });
});

describe("prochaineEtape", () => {
  const n = (id: string, prerequis: string[] = []) => ({ id, titre: id, bloc: "B", niveau: "fondamental" as const, prerequis, resume: "r", ressources: [] });
  const r = { id: "t", titre: "T", type: "role" as const, version: "1", source: "s", legende_demande: { forte: "", moyenne: "", faible: "" }, blocs: ["B"], noeuds: [n("a"), n("b", ["a"]), n("c", ["b"])] };

  it("propose le premier nœud quand rien n'est renseigné", () => {
    expect(prochaineEtape(r, {})).toMatchObject({ type: "debut", noeud: { id: "a" } });
  });
  it("avance au nœud débloqué", () => {
    expect(prochaineEtape(r, { a: "maitrise" })).toMatchObject({ type: "suite", noeud: { id: "b" }, enCours: false });
  });
  it("reprend d'abord ce qui est en cours", () => {
    expect(prochaineEtape(r, { a: "maitrise", b: "en-cours" })).toMatchObject({ noeud: { id: "b" }, enCours: true });
  });
  it("saute les nœuds ignorés et signale la fin", () => {
    expect(prochaineEtape(r, { a: "ignore", b: "ignore" })).toMatchObject({ noeud: { id: "c" } });
    expect(prochaineEtape(r, { a: "maitrise", b: "maitrise", c: "maitrise" }).type).toBe("termine");
  });
});
