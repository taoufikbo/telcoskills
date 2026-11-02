import { describe, expect, it } from "vitest";
import { heuresEstimees, libelleDuree } from "./duree";

const parNiveau = { fondamental: 4, intermediaire: 8, avance: 12, transverse: 4 };

describe("durée estimée", () => {
  it("additionne les heures par niveau", () => {
    expect(heuresEstimees([{ niveau: "fondamental" }, { niveau: "avance" }, { niveau: "avance" }], parNiveau)).toBe(28);
  });
  it("exprime les courtes durées en heures et les longues en semaines", () => {
    expect(libelleDuree(8)).toBe("environ 8 h");
    expect(libelleDuree(40)).toBe("environ 40 h, soit 10 semaines à 4 h par semaine");
    expect(libelleDuree(40, 8)).toBe("environ 40 h, soit 5 semaines à 8 h par semaine");
  });
});
