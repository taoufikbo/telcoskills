import { afterEach, describe, expect, it, vi } from "vitest";

async function charger(instance?: string) {
  vi.resetModules();
  if (instance) vi.stubEnv("NEXT_PUBLIC_INSTANCE", instance);
  return import("./urls");
}

afterEach(() => vi.unstubAllEnvs());

describe("adresses selon l'instance", () => {
  it("site historique (instance interne) : /<roadmap>, tiroir ?noeud= et /projets", async () => {
    const u = await charger("interne");
    expect(u.urlRoadmap("sre-exploitation-telco")).toBe("/sre-exploitation-telco");
    expect(u.urlNoeud("sre-exploitation-telco", "gitops")).toBe("/sre-exploitation-telco?noeud=gitops");
    expect(u.urlProjet("coeur-5g-sur-caas")).toBe("/projets/coeur-5g-sur-caas");
    expect(u.urlProjet("coeur-5g-sur-caas", true)).toBe("/projets/coeur-5g-sur-caas/carte");
  });

  it("instance publique : nouvelle arborescence", async () => {
    const u = await charger("public");
    expect(u.urlRoadmap("sre-exploitation-telco")).toBe("/ressources/roadmaps/sre-exploitation-telco");
    expect(u.urlNoeud("sre-exploitation-telco", "gitops")).toBe("/ressources/roadmaps/sre-exploitation-telco/gitops");
    expect(u.urlProjet("coeur-5g-sur-caas")).toBe("/ressources/projet-fil-rouge");
    expect(u.urlProjet("coeur-5g-sur-caas", true)).toBe("/ressources/projet-fil-rouge/carte");
  });

  it("une instance inconnue retombe sur l'instance publique", async () => {
    const u = await charger("nimportequoi");
    expect(u.urlRoadmap("x")).toBe("/ressources/roadmaps/x");
  });
});
