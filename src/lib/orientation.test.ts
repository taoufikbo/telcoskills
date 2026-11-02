import { describe, expect, it } from "vitest";
import { chargerOrientation, validerOrientation } from "./orientation";
import { NIVEAUX_TELECOM, recommander, reponsesValides, type Reponses } from "./orientation-schema";
import { chargerProjets } from "./projets";
import { chargerRoadmaps } from "./roadmaps";

const roadmaps = chargerRoadmaps();
const projets = chargerProjets().map((p) => p.id);
const config = chargerOrientation();
const copie = () => JSON.parse(JSON.stringify(config));

describe("orientation : contenu", () => {
  it("liste tous les parcours dans l'ordre d'affichage", () => {
    expect([...config.ordre].sort()).toEqual(roadmaps.map((r) => r.id).sort());
  });

  it("donne un premier nœud réel, de la bonne roadmap, pour chaque niveau en télécom", () => {
    for (const r of roadmaps)
      for (const niveau of NIVEAUX_TELECOM) {
        const id = config.premiers_noeuds[r.id][niveau];
        expect(r.noeuds.some((n) => n.id === id), `${r.id}/${niveau}`).toBe(true);
      }
  });

  // Les parcours métier (type « role ») doivent tous pouvoir être recommandés ; un parcours thématique (type « competence »,
  // par exemple Sylva) n'est pas un métier : le diagnostic ne le propose pas, on y entre par sa rubrique.
  it("peut recommander chaque parcours métier, et seulement eux", () => {
    const atteints = new Set<string>();
    const [qm, qt, qo] = config.questions;
    for (const m of qm.options) for (const t of qt.options) for (const o of qo.options) atteints.add(recommander(config, { metier: m.id, telecom: t.id, objectif: o.id }).roadmapId);
    expect([...atteints].sort()).toEqual(roadmaps.filter((r) => r.type === "role").map((r) => r.id).sort());
  });
});

describe("orientation : recommandation", () => {
  const cas: [string, Reponses, string, string][] = [
    ["un DevOps qui débute en télécom", { metier: "devops", telecom: "aucune", objectif: "decouvrir" }, "devops-integrateur-nf", "tel-reseau-mobile"],
    ["un SRE avec des notions qui veut tenir son poste", { metier: "exploitation", telecom: "notions", objectif: "poste" }, "sre-exploitation-telco", "sre-slo"],
    ["un réseau à l'aise qui prépare un déploiement", { metier: "reseau", telecom: "aise", objectif: "deployer" }, "integrateur-nf-5gc", "deploiement-lab"],
    ["un architecte qui vise l'architecture", { metier: "architecture", telecom: "notions", objectif: "evoluer" }, "architecte-caas-telco", "k8s-archi"],
  ];
  it.each(cas)("recommande le bon parcours à %s", (_nom, reponses, roadmap, noeud) => {
    const r = recommander(config, reponses);
    expect(r.roadmapId).toBe(roadmap);
    expect(r.noeudId).toBe(noeud);
  });

  it("justifie la recommandation par les réponses qui ont pesé", () => {
    const r = recommander(config, { metier: "devops", telecom: "aucune", objectif: "decouvrir" });
    expect(r.raisons).toHaveLength(3);
  });

  it("propose le projet fil rouge quand l'objectif est de déployer", () => {
    expect(recommander(config, { metier: "reseau", telecom: "aise", objectif: "deployer" }).projet).toBe("coeur-5g-sur-caas");
    expect(recommander(config, { metier: "devops", telecom: "aucune", objectif: "decouvrir" }).projet).toBeUndefined();
  });

  it("offre deux alternatives différentes du parcours recommandé", () => {
    const r = recommander(config, { metier: "plateforme", telecom: "notions", objectif: "poste" });
    expect(r.alternatives).toHaveLength(2);
    expect(r.alternatives).not.toContain(r.roadmapId);
  });

  it("départage les ex æquo selon l'ordre d'affichage, de façon stable", () => {
    const a = recommander(config, { metier: "plateforme", telecom: "notions", objectif: "deployer" });
    expect(a).toEqual(recommander(config, { metier: "plateforme", telecom: "notions", objectif: "deployer" }));
  });

  it("reconnaît des réponses valides et rejette les autres", () => {
    expect(reponsesValides(config, { metier: "devops", telecom: "aucune", objectif: "poste" })).toBe(true);
    expect(reponsesValides(config, { metier: "inconnu", telecom: "aucune", objectif: "poste" })).toBe(false);
    expect(reponsesValides(config, null)).toBe(false);
  });
});

describe("orientation : validation au build", () => {
  it("rejette un nœud de départ inexistant", () => {
    const c = copie();
    c.premiers_noeuds["sre-exploitation-telco"].aise = "fantome";
    expect(() => validerOrientation(c, roadmaps, projets)).toThrow(/« fantome » n'existe pas/);
  });

  it("rejette une roadmap oubliée, un poids pour une roadmap inconnue et un projet inconnu", () => {
    const a = copie();
    a.ordre = a.ordre.slice(1);
    expect(() => validerOrientation(a, roadmaps, projets)).toThrow(/n'est pas listée/);
    const b = copie();
    b.questions[0].options[0].poids.inconnue = 1;
    expect(() => validerOrientation(b, roadmaps, projets)).toThrow(/roadmap inconnue « inconnue »/);
    const c = copie();
    c.questions[2].options[2].projet = "fantome";
    expect(() => validerOrientation(c, roadmaps, projets)).toThrow(/projet inconnu « fantome »/);
  });

  it("exige trois niveaux en télécom bien nommés", () => {
    const c = copie();
    c.questions[1].options[0].id = "debutant";
    expect(() => validerOrientation(c, roadmaps, projets)).toThrow(/telecom/);
  });
});

describe("orientation : aucun rôle sans issue", () => {
  const rolesSansParcours = chargerProjets().flatMap((p) => p.roles.filter((r) => !r.roadmap).map((r) => r.id));

  it("propose, dans la question « métier », une réponse pour chaque rôle du projet sans roadmap", () => {
    const couverts = new Set(config.questions.find((q) => q.id === "metier")!.options.map((o) => o.role).filter(Boolean));
    for (const id of rolesSansParcours) expect(couverts.has(id), `rôle « ${id} » absent du quiz`).toBe(true);
  });

  it("renvoie le rôle choisi avec la recommandation", () => {
    expect(recommander(config, { metier: "securite", telecom: "notions", objectif: "poste" }).role).toBe("securite");
    expect(recommander(config, { metier: "devops", telecom: "notions", objectif: "poste" }).role).toBeUndefined();
  });

  it("refuse un rôle inconnu", () => {
    const c = copie();
    c.questions[0].options[0].role = "fantome";
    expect(() => validerOrientation(c, roadmaps, projets, ["chef-projet"])).toThrow(/rôle inconnu/);
  });
});
