import { describe, expect, it } from "vitest";
import { etatVide, marquerVu, suivreParcours } from "./etat";
import { aDeLaProgression } from "./signal";

const now = new Date("2026-11-02T12:00:00");

describe("aDeLaProgression", () => {
  it("faux pour un état vide", () => expect(aDeLaProgression(etatVide(now))).toBe(false));
  it("vrai dès qu'une compétence est vue", () => expect(aDeLaProgression(marquerVu(etatVide(now), "k8s", now))).toBe(true));
  it("vrai dès qu'un parcours est suivi", () => expect(aDeLaProgression(suivreParcours(etatVide(now), "ingenieur-caas-telco"))).toBe(true));
});
