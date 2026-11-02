import { describe, expect, it } from "vitest";
import { chargerOrientation } from "@/lib/orientation";
import { getRoadmap } from "@/lib/roadmaps";
import { compter, etatVide, enregistrerRappel, marquerVu, definirHorsParcours, suiviNoeud, vueProgression } from "@/produits/progression";
import { calculerCockpit, calculerProgramme, placerSemaines, projeter } from "./calcul";

const now = new Date("2026-11-02T12:00:00");
const h = chargerOrientation().duree_par_niveau_heures;
const roadmap = getRoadmap("ingenieur-caas-telco")!;

describe("programme", () => {
  it("garde l'ordre des blocs de la roadmap et couvre chaque compétence une fois", () => {
    const p = calculerProgramme(roadmap, h);
    expect(p.blocs.map((b) => b.bloc)).toEqual(roadmap.blocs.filter((b) => roadmap.noeuds.some((n) => n.bloc === b)));
    expect(p.blocs.flatMap((b) => b.noeuds.map((n) => n.id)).sort()).toEqual(roadmap.noeuds.map((n) => n.id).sort());
  });
  it("les heures viennent de l'hypothèse par niveau et le total est la somme des blocs", () => {
    const p = calculerProgramme(roadmap, h);
    const attendu = roadmap.noeuds.reduce((t, n) => t + h[n.niveau], 0);
    expect(p.heures).toBe(attendu);
    expect(p.blocs.reduce((t, b) => t + b.heures, 0)).toBe(attendu);
    expect(p.restantes).toBe(attendu);
    expect(p.faites).toBe(0);
  });
  it("sans suivi, tout est à découvrir", () => {
    expect(calculerProgramme(roadmap, h).blocs.every((b) => b.noeuds.every((n) => n.statut === "a-decouvrir"))).toBe(true);
  });
  it("compte acquis et à revoir comme faits, pas « vu », et sort les compétences hors parcours", () => {
    const [a, b, c, d] = roadmap.noeuds;
    let e = enregistrerRappel(etatVide(now), a.id, true, now);
    e = marquerVu(e, b.id, now);
    e = definirHorsParcours(e, roadmap.id, c.id, true);
    const p = calculerProgramme(roadmap, h, (id) => suiviNoeud(e, roadmap.id, id, now));
    const total = roadmap.noeuds.reduce((t, n) => t + h[n.niveau], 0);
    expect(p.faites).toBe(h[a.niveau]);
    expect(p.heures).toBe(total - h[c.niveau]);
    expect(p.restantes).toBe(p.heures - p.faites);
    expect(p.acquis).toBe(1);
    expect(p.actifs).toBe(roadmap.noeuds.length - 1);
    expect(d).toBeDefined();
    // même verdict que le décompte du produit Progression
    expect(p.acquis).toBe(compter(e, roadmap.id, roadmap.noeuds, now).acquis);
  });
});

describe("projection", () => {
  it("arrondit les semaines au-dessus et date l'arrivée", () => {
    expect(projeter(10, 4, now)).toEqual({ semaines: 3, arrivee: "2026-11-23" });
    expect(projeter(8, 4, now).semaines).toBe(2);
  });
  it("ne projette rien quand il n'y a plus rien à faire", () => {
    expect(projeter(0, 4, now)).toEqual({ semaines: 0, arrivee: null });
  });
  it("un rythme plus élevé raccourcit la projection", () => {
    expect(projeter(100, 10, now).semaines).toBeLessThan(projeter(100, 4, now).semaines);
  });
  it("numérote la semaine de fin de chaque bloc en cumulant les heures restantes", () => {
    const p = placerSemaines(calculerProgramme(roadmap, h), 4);
    let cumul = 0;
    for (const b of p.blocs) expect(b.semaineFin).toBe(Math.ceil((cumul += b.restantes) / 4));
    expect(p.blocs.at(-1)!.semaineFin).toBe(Math.ceil(p.restantes / 4));
  });
  it("un bloc terminé n'a pas de semaine de fin", () => {
    const premier = roadmap.noeuds.filter((n) => n.bloc === roadmap.blocs[0]);
    let e = etatVide(now);
    for (const n of premier) e = enregistrerRappel(e, n.id, true, now);
    const p = placerSemaines(calculerProgramme(roadmap, h, (id) => suiviNoeud(e, roadmap.id, id, now)), 4);
    expect(p.blocs[0].restantes).toBe(0);
    expect(p.blocs[0].semaineFin).toBeUndefined();
  });
});

describe("cockpit", () => {
  const entree = (e = etatVide(now), cibleId: string | null = null, echeances: string[] = []) => ({
    roadmap,
    parNiveau: h,
    rythme: 4,
    now,
    decompte: compter(e, roadmap.id, roadmap.noeuds, now),
    suivi: (id: string) => suiviNoeud(e, roadmap.id, id, now),
    echeances,
    cibleId,
    progression: vueProgression(e, roadmap, now),
  });

  it("au départ : début du parcours, aucune révision, pas d'objectif", () => {
    const c = calculerCockpit(entree());
    expect(c.suite.type).toBe("debut");
    expect(c.revision).toEqual({ total: 0, premier: null });
    expect(c.objectif).toBeNull();
    expect(c.projection.semaines).toBe(Math.ceil(c.programme.heures / 4));
  });
  it("ne garde que les révisions de cette roadmap", () => {
    const c = calculerCockpit(entree(etatVide(now), null, ["inconnu-ailleurs", roadmap.noeuds[2].id]));
    expect(c.revision.total).toBe(1);
    expect(c.revision.premier?.id).toBe(roadmap.noeuds[2].id);
  });
  it("objectif : compétences à acquérir, heures, chemin critique jusqu'à la cible", () => {
    const cible = roadmap.noeuds.find((n) => n.prerequis.length > 0)!;
    const c = calculerCockpit(entree(etatVide(now), cible.id));
    expect(c.objectif!.chemin.at(-1)!.id).toBe(cible.id);
    expect(c.objectif!.restantes).toBeGreaterThanOrEqual(c.objectif!.etapesCritiques);
    expect(c.objectif!.heures).toBeGreaterThan(0);
    expect(c.objectif!.heures).toBeLessThanOrEqual(c.programme.heures);
  });
  it("objectif : ce qui est acquis ne compte plus", () => {
    const cible = roadmap.noeuds.find((n) => n.prerequis.length > 0)!;
    const avant = calculerCockpit(entree(etatVide(now), cible.id)).objectif!;
    const e = enregistrerRappel(etatVide(now), cible.prerequis[0], true, now);
    const apres = calculerCockpit(entree(e, cible.id)).objectif!;
    expect(apres.restantes).toBe(avant.restantes - 1);
    expect(apres.heures).toBeLessThan(avant.heures);
  });
  it("une cible inconnue est ignorée", () => {
    expect(calculerCockpit(entree(etatVide(now), "nimporte-quoi")).objectif).toBeNull();
  });
});

describe("programmes servis au diagnostic", () => {
  it("couvrent chaque parcours recommandable avec les mêmes heures que la roadmap", async () => {
    const { programmesDesParcours } = await import("@/lib/programmes");
    const progs = programmesDesParcours();
    const ids = Object.keys(chargerOrientation().premiers_noeuds);
    expect(Object.keys(progs).sort()).toEqual([...ids].sort());
    for (const id of ids) {
      const r = getRoadmap(id)!;
      expect(progs[id].heures).toBe(r.noeuds.reduce((t, n) => t + h[n.niveau], 0));
      expect(progs[id].blocs.flatMap((b) => b.noeuds).length).toBe(r.noeuds.length);
    }
  });
});
