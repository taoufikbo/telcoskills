import { describe, expect, it } from "vitest";
import { depotPublic, lienCorrection } from "./contribution";
import { INSTANCE } from "./instance";

describe("appel à contribution", () => {
  it("aucun lien tant que le dépôt n'est pas public", () => {
    if (!INSTANCE.depot?.public) {
      expect(depotPublic()).toBeNull();
      expect(lienCorrection("r", "n", "T")).toBeNull();
    }
  });
  it("un lien de ticket pré-rempli quand le dépôt est public", () => {
    const sauvegarde = INSTANCE.depot;
    INSTANCE.depot = { url: "https://github.com/x/y", public: true };
    try {
      const lien = new URL(lienCorrection("archi", "k8s-archi", "Architecture Kubernetes")!);
      expect(lien.origin + lien.pathname).toBe("https://github.com/x/y/issues/new");
      expect(lien.searchParams.get("title")).toContain("Architecture Kubernetes");
      expect(lien.searchParams.get("body")).toContain("content/roadmaps/archi.json");
    } finally {
      INSTANCE.depot = sauvegarde;
    }
  });
});
