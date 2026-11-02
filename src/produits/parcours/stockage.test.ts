import { describe, expect, it } from "vitest";
import { lireReponses } from "./stockage";

describe("lireReponses", () => {
  it("lit trois réponses textuelles", () =>
    expect(lireReponses('{"metier":"dev","telecom":"debutant","objectif":"caas","autre":1}')).toEqual({ metier: "dev", telecom: "debutant", objectif: "caas" }));
  it("ignore une absence, un JSON illisible ou une forme incomplète", () => {
    expect(lireReponses(null)).toBeNull();
    expect(lireReponses("{")).toBeNull();
    expect(lireReponses('{"metier":"dev"}')).toBeNull();
    expect(lireReponses('"texte"')).toBeNull();
  });
});
