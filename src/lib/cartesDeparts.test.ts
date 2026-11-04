import { describe, expect, it } from "vitest";
import { TAILLE_MAX_CARTE } from "@/produits/carte-heros";
import { cartesDesDeparts } from "./cartesDeparts";
import { chargerOrientation } from "./orientation";

describe("cartes des points de départ du diagnostic", () => {
  const cartes = cartesDesDeparts();
  const config = chargerOrientation();

  it("existent pour chaque point de départ possible", () => {
    for (const [roadmapId, departs] of Object.entries(config.premiers_noeuds))
      for (const depart of Object.values(departs)) expect(cartes[`${roadmapId}/${depart}`], `${roadmapId}/${depart}`).toBeDefined();
  });
  it("partent du départ, mènent à la cible et restent lisibles", () => {
    for (const [cle, c] of Object.entries(cartes)) {
      const d = c.disposition;
      expect(d.depart?.id, cle).toBe(c.depart);
      expect(d.chemin[0].id, cle).toBe(c.depart);
      expect(d.chemin.at(-1)!.id, cle).toBe(d.cible.id);
      expect(d.noeuds.length, cle).toBeLessThanOrEqual(TAILLE_MAX_CARTE);
      const e = d.noeuds.find((n) => n.cible)!.effort!;
      expect(e.legers + e.moyens + e.longs, cle).toBeGreaterThan(0);
    }
  });
});
