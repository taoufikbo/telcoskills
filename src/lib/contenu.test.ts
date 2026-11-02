import { describe, expect, it } from "vitest";
import { chargerFrameworks, frameworksDuNoeud, problemesFrameworks } from "./frameworks";
import { NOEUDS_DE_JUGEMENT } from "./jugement";
import { chargerOrientation } from "./orientation";
import { chargerRoadmaps, masquerRessourcesSansLien } from "./roadmaps";
import { trouverCycle } from "./schema";

const roadmaps = chargerRoadmaps();
const architecte = roadmaps.find((r) => r.id === "architecte-caas-telco")!;
const noeud = (id: string) => architecte.noeuds.find((n) => n.id === id);

describe("intégrité des roadmaps (refonte)", () => {
  it("chaque nœud a au moins une ressource avec un lien", () => {
    for (const r of roadmaps) for (const n of r.noeuds) expect(n.ressources.some((x) => x.url), `${r.id}/${n.id}`).toBe(true);
  });

  it("les prérequis existent et ne forment pas de cycle, dans chaque roadmap", () => {
    for (const r of roadmaps) {
      const ids = new Set(r.noeuds.map((n) => n.id));
      for (const n of r.noeuds) for (const p of n.prerequis) expect(ids.has(p), `${r.id}/${n.id} → ${p}`).toBe(true);
      expect(trouverCycle(r.noeuds), r.id).toBeNull();
    }
  });

  it("détecte un cycle (le détecteur fonctionne)", () => {
    expect(trouverCycle([{ id: "a", prerequis: ["b"] }, { id: "b", prerequis: ["a"] }])).not.toBeNull();
  });

  it("gitops et ztp figurent dans la roadmap Architecte", () => {
    expect(noeud("gitops")?.prerequis).toContain("helm");
    expect(noeud("ztp")?.prerequis).toEqual(expect.arrayContaining(["gitops", "ocp-install"]));
  });

  it("gitops garde le même titre et le même résumé dans toutes les roadmaps", () => {
    const copies = roadmaps.flatMap((r) => r.noeuds.filter((n) => n.id === "gitops"));
    expect(copies.length).toBeGreaterThan(1);
    expect(new Set(copies.map((n) => n.titre)).size).toBe(1);
    expect(new Set(copies.map((n) => n.resume)).size).toBe(1);
  });

  it("chaque nœud de jugement a au moins deux ressources ouvertes avec lien", () => {
    for (const id of NOEUDS_DE_JUGEMENT) {
      const ouvertes = noeud(id)!.ressources.filter((x) => x.url && ["opensource", "libre", "doc", "spec"].includes(x.type));
      expect(ouvertes.length, id).toBeGreaterThanOrEqual(2);
    }
  });

  it("l'avis d'un nœud partagé est identique dans toutes les roadmaps", () => {
    const parId = new Map<string, Set<string | undefined>>();
    for (const r of roadmaps) for (const n of r.noeuds) parId.set(n.id, (parId.get(n.id) ?? new Set()).add(n.avis));
    for (const [id, avis] of parId) expect(avis.size, id).toBe(1);
  });

  it("aucune ressource ne porte une mention d'équipe interne", () => {
    const suspects = roadmaps.flatMap((r) => r.noeuds.flatMap((n) => n.ressources.filter((x) => /\bde (l'|notre )équipe\b/i.test(x.nom)).map((x) => `${r.id}/${n.id} : ${x.nom}`)));
    expect(suspects).toEqual([]);
  });

  it("toutes les adresses sont en https", () => {
    for (const r of roadmaps) for (const n of r.noeuds) for (const x of n.ressources) if (x.url) expect(x.url, `${r.id}/${n.id}`).toMatch(/^https:\/\//);
  });
});

describe("masquage des ressources sans lien", () => {
  it("retire les ressources sans URL et garde les autres", () => {
    const base = { ...architecte, noeuds: [{ ...architecte.noeuds[0], ressources: [{ type: "doc" as const, nom: "sans lien" }, { type: "doc" as const, nom: "avec lien", url: "https://exemple.fr" }] }] };
    const masque = masquerRessourcesSansLien(base);
    expect(masque.noeuds[0].ressources.map((x) => x.nom)).toEqual(["avec lien"]);
  });
});

describe("frameworks", () => {
  it("sont cohérents avec les roadmaps", () => {
    expect(problemesFrameworks(chargerFrameworks(), roadmaps)).toEqual([]);
  });

  it("couvrent tous les nœuds de jugement", () => {
    for (const id of NOEUDS_DE_JUGEMENT) expect(frameworksDuNoeud(id).length, id).toBeGreaterThan(0);
  });

  it("citent des compétences de la roadmap Architecte (le graphe du framework s'y appuie)", () => {
    for (const f of chargerFrameworks()) for (const id of f.noeuds) expect(noeud(id), `${f.id} → ${id}`).toBeDefined();
  });
});

describe("orientation", () => {
  it("l'ordre d'affichage couvre toutes les roadmaps (il décide de la canonical des nœuds partagés)", () => {
    expect([...chargerOrientation().ordre].sort()).toEqual(roadmaps.map((r) => r.id).sort());
  });
});
