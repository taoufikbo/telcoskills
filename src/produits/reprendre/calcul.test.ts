import { describe, expect, it } from "vitest";
import { chargerOrientation } from "@/lib/orientation";
import { recommander } from "@/lib/orientation-schema";
import { roadmapsLegeres } from "@/lib/roadmapsLegeres";
import { etatVide, marquerVu, suivreParcours } from "@/produits/progression";
import { calculerReprise } from "./calcul";

const config = chargerOrientation();
const roadmaps = roadmapsLegeres();
const now = new Date("2026-11-02T12:00:00");
const vide = etatVide(now);
const reponses = Object.fromEntries(config.questions.map((q) => [q.id, q.options[0].id])) as { metier: string; telecom: string; objectif: string };

describe("calculerReprise", () => {
  it("rien à reprendre sans parcours suivi ni diagnostic", () => expect(calculerReprise({ etat: vide, reponses: null, config, roadmaps, now })).toBeNull());

  it("ignore des réponses qui ne correspondent plus à la configuration", () =>
    expect(calculerReprise({ etat: vide, reponses: { ...reponses, metier: "inconnu" }, config, roadmaps, now })).toBeNull());

  it("propose le premier pas du parcours recommandé après le diagnostic", () => {
    const reco = recommander(config, reponses);
    const r = calculerReprise({ etat: vide, reponses, config, roadmaps, now });
    expect(r).toMatchObject({ origine: "diagnostic", roadmapId: reco.roadmapId, noeud: { id: reco.noeudId } });
  });

  it("le parcours suivi prime sur le diagnostic, et la compétence en cours est proposée", () => {
    const roadmap = roadmaps[roadmaps.length - 1];
    const noeud = roadmap.noeuds[roadmap.noeuds.length - 1];
    const etat = marquerVu(suivreParcours(vide, roadmap.id), noeud.id, now);
    const r = calculerReprise({ etat, reponses, config, roadmaps, now });
    expect(r).toMatchObject({ origine: "parcours", roadmapId: roadmap.id, noeud: { id: noeud.id } });
    expect(r?.decompte.vus).toBe(1);
  });

  it("ignore un parcours suivi qui n'existe plus", () => {
    const etat = suivreParcours(vide, "parcours-retire");
    expect(calculerReprise({ etat, reponses: null, config, roadmaps, now })).toBeNull();
  });
});
