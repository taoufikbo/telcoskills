import { describe, expect, it } from "vitest";
// @ts-expect-error module compilé de Next, sans déclaration de types : c'est le moteur qui apparie les redirections
import { compile, match } from "next/dist/compiled/path-to-regexp";
import { idsRoadmaps, redirections } from "../../next.config";
import { chargerRoadmaps } from "./roadmaps";

const IDS = ["devops-integrateur-nf", "ia-agentique-telco"];

/** Applique la première règle dont la source correspond au chemin (et dont les conditions de requête sont remplies). */
function appliquer(chemin: string, requete: Record<string, string> = {}, instance = "public") {
  for (const regle of redirections(instance, IDS)) {
    const trouve = match(regle.source, { decode: decodeURIComponent })(chemin);
    if (!trouve) continue;
    const params: Record<string, string> = { ...trouve.params };
    let conditions = true;
    for (const c of regle.has ?? []) {
      const valeur = requete[c.key];
      const motif = c.value ? new RegExp(`^${c.value}$`).exec(valeur ?? "") : valeur !== undefined ? [] : null;
      if (!motif) conditions = false;
      else Object.assign(params, (motif as RegExpExecArray & { groups?: Record<string, string> }).groups ?? {});
    }
    if (!conditions) continue;
    return { destination: compile(regle.destination)(params) as string, statut: regle.statusCode };
  }
  return null;
}

describe("redirections de l'ancienne arborescence", () => {
  it("ne s'appliquent qu'à l'instance publique", () => {
    expect(redirections("interne", IDS)).toEqual([]);
    expect(redirections(undefined, IDS)).not.toEqual([]); // sans variable, ce dépôt est l'instance publique
  });

  it("envoient /<roadmap> vers la nouvelle adresse, en 301 (et non 308)", () => {
    expect(appliquer("/ia-agentique-telco")).toEqual({ destination: "/ressources/roadmaps/ia-agentique-telco", statut: 301 });
  });

  it("envoient /<roadmap>?noeud=x vers la page du nœud", () => {
    expect(appliquer("/ia-agentique-telco", { noeud: "k8s-archi" })).toEqual({
      destination: "/ressources/roadmaps/ia-agentique-telco/k8s-archi",
      statut: 301,
    });
  });

  it("gardent l'image de partage d'une roadmap", () => {
    expect(appliquer("/devops-integrateur-nf/opengraph-image")?.destination).toBe("/ressources/roadmaps/devops-integrateur-nf/opengraph-image");
  });

  it("envoient les anciennes pages projet vers le projet fil rouge", () => {
    expect(appliquer("/projets")?.destination).toBe("/ressources/projet-fil-rouge");
    expect(appliquer("/projets/coeur-5g-sur-caas")?.destination).toBe("/ressources/projet-fil-rouge");
    expect(appliquer("/projets/coeur-5g-sur-caas/carte")?.destination).toBe("/ressources/projet-fil-rouge/carte");
  });

  it("envoient un résultat de diagnostic partagé vers l'accueil, et seulement lui", () => {
    expect(appliquer("/ressources/roadmaps", { profil: "a.b.c" })).toEqual({ destination: "/", statut: 301 });
    expect(appliquer("/ressources/roadmaps")).toBeNull();
  });

  it("envoient l'ancienne adresse de la rubrique Sylva vers son onglet", () => {
    expect(appliquer("/ressources/sylva")).toEqual({ destination: "/sylva", statut: 301 });
  });

  it("laissent passer les pages de la nouvelle arborescence et les autres adresses", () => {
    for (const chemin of ["/", "/analyses", "/frameworks", "/ressources", "/ressources/roadmaps/ia-agentique-telco", "/offres", "/a-propos", "/contact"])
      expect(appliquer(chemin), chemin).toBeNull();
  });

  it("couvrent exactement les roadmaps du dépôt", () => {
    expect(idsRoadmaps()).toEqual(chargerRoadmaps().map((r) => r.id).sort());
  });
});
