import { describe, expect, it } from "vitest";
import { chargerOrientation } from "@/lib/orientation";
import { decoderProfil, encoderProfil } from "./profil";

const config = chargerOrientation();
const valides = Object.fromEntries(config.questions.map((q) => [q.id, q.options[0].id])) as { metier: string; telecom: string; objectif: string };

describe("profil partagé", () => {
  it("fait l'aller-retour avec des réponses valides", () => expect(decoderProfil(config, encoderProfil(valides))).toEqual(valides));
  it("refuse une option inconnue ou un profil incomplet", () => {
    expect(decoderProfil(config, `${valides.metier}.inconnu.${valides.objectif}`)).toBeNull();
    expect(decoderProfil(config, valides.metier)).toBeNull();
    expect(decoderProfil(config, "")).toBeNull();
  });
});
