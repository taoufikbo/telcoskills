import { describe, expect, it } from "vitest";
import {
  ajouterJours,
  compter,
  RYTHME_MAX,
  RYTHME_MIN,
  definirHorsParcours,
  definirRythme,
  echues,
  enregistrerRappel,
  etatVide,
  jourLocal,
  lireEtat,
  marquerVu,
  migrer,
  prochainesEcheances,
  reinitialiserRoadmap,
  reprendreProgression,
  retirerVu,
  rythmeDe,
  serialiserEtat,
  statutPratique,
  vueProgression,
} from "./etat";
import { getRoadmap } from "@/lib/roadmaps";

const jour = (j: string) => new Date(`${j}T12:00:00`);
const J0 = jour("2026-10-22");
const roadmap = getRoadmap("architecte-caas-telco")!;
const [a, b, c] = roadmap.noeuds;

describe("dates", () => {
  it("ajoute des jours de calendrier, y compris à travers un changement d'heure et de mois", () => {
    expect(ajouterJours("2026-10-22", 1)).toBe("2026-10-23");
    expect(ajouterJours("2026-10-30", 3)).toBe("2026-11-02");
    expect(ajouterJours("2026-03-28", 3)).toBe("2026-03-31"); // passage à l'heure d'été en 2026 : 29 mars
    expect(ajouterJours("2026-12-20", 21)).toBe("2027-01-10");
  });
  it("lit le jour local", () => expect(jourLocal(new Date(2026, 9, 5, 23, 59))).toBe("2026-10-05"));
});

describe("acquis (testé) ne vient que d'un rappel réussi", () => {
  it("part de « à découvrir »", () => expect(statutPratique(etatVide(J0), a.id, J0)).toBe("a-decouvrir"));

  it("« vu » ne rend jamais une compétence acquise", () => {
    const e = marquerVu(etatVide(J0), a.id, J0);
    expect(statutPratique(e, a.id, J0)).toBe("vu");
    expect(compter(e, roadmap.id, roadmap.noeuds, J0).acquis).toBe(0);
  });

  it("un rappel réussi la rend acquise, avec une révision à J+1", () => {
    const e = enregistrerRappel(etatVide(J0), a.id, true, J0);
    expect(statutPratique(e, a.id, J0)).toBe("acquis-teste");
    expect(e.noeuds[a.id]).toMatchObject({ boite: 1, reussi: "2026-10-22", echeance: "2026-10-23" });
    expect(compter(e, roadmap.id, roadmap.noeuds, J0).acquis).toBe(1);
  });

  it("un rappel raté d'une compétence jamais acquise la laisse « vue »", () => {
    const e = enregistrerRappel(etatVide(J0), a.id, false, J0);
    expect(statutPratique(e, a.id, J0)).toBe("vu");
    expect(compter(e, roadmap.id, roadmap.noeuds, J0).acquis).toBe(0);
  });

  it("on ne peut pas retirer « vu » d'une compétence acquise", () => {
    const e = enregistrerRappel(etatVide(J0), a.id, true, J0);
    expect(retirerVu(e, a.id)).toBe(e);
  });

  it("on peut retirer « vu » d'une compétence seulement vue", () => {
    const e = retirerVu(marquerVu(etatVide(J0), a.id, J0), a.id);
    expect(statutPratique(e, a.id, J0)).toBe("a-decouvrir");
  });
});

describe("boîtes de Leitner : J+1, J+3, J+7, J+21", () => {
  it("avance de boîte en boîte quand la révision est due, puis reste à J+21", () => {
    let e = enregistrerRappel(etatVide(J0), a.id, true, J0); // boîte 1, due 23/10
    e = enregistrerRappel(e, a.id, true, jour("2026-10-23")); // boîte 2, J+3
    expect(e.noeuds[a.id]).toMatchObject({ boite: 2, echeance: "2026-10-26" });
    e = enregistrerRappel(e, a.id, true, jour("2026-10-26")); // boîte 3, J+7
    expect(e.noeuds[a.id]).toMatchObject({ boite: 3, echeance: "2026-11-02" });
    e = enregistrerRappel(e, a.id, true, jour("2026-11-02")); // boîte 4, J+21
    expect(e.noeuds[a.id]).toMatchObject({ boite: 4, echeance: "2026-11-23" });
    e = enregistrerRappel(e, a.id, true, jour("2026-11-23")); // reste en boîte 4
    expect(e.noeuds[a.id]).toMatchObject({ boite: 4, echeance: "2026-12-14" });
  });

  it("devient « à revoir » quand l'échéance est atteinte, et compte toujours comme acquise", () => {
    const e = enregistrerRappel(etatVide(J0), a.id, true, J0);
    expect(statutPratique(e, a.id, jour("2026-10-22"))).toBe("acquis-teste");
    expect(statutPratique(e, a.id, jour("2026-10-23"))).toBe("a-revoir");
    const d = compter(e, roadmap.id, roadmap.noeuds, jour("2026-10-23"));
    expect(d.acquis).toBe(1);
    expect(d.aRevoir).toBe(1);
  });

  it("un échec en révision ramène en boîte 1, révision le lendemain, statut « à revoir »", () => {
    let e = enregistrerRappel(etatVide(J0), a.id, true, J0);
    e = enregistrerRappel(e, a.id, true, jour("2026-10-23")); // boîte 2
    e = enregistrerRappel(e, a.id, false, jour("2026-10-26"));
    expect(e.noeuds[a.id]).toMatchObject({ boite: 1, echeance: "2026-10-27", dernier: "echec" });
    expect(statutPratique(e, a.id, jour("2026-10-26"))).toBe("a-revoir");
  });

  it("un succès avant l'échéance ne fait pas avancer la boîte (l'espacement ne se contourne pas)", () => {
    let e = enregistrerRappel(etatVide(J0), a.id, true, J0);
    e = enregistrerRappel(e, a.id, true, J0); // même jour : pas due
    expect(e.noeuds[a.id]).toMatchObject({ boite: 1, echeance: "2026-10-23", tentatives: 2 });
  });

  it("un retard ne saute pas de boîte : une révision tardive avance d'une seule boîte", () => {
    let e = enregistrerRappel(etatVide(J0), a.id, true, J0);
    e = enregistrerRappel(e, a.id, true, jour("2026-12-01"));
    expect(e.noeuds[a.id]).toMatchObject({ boite: 2, echeance: "2026-12-04" });
  });

  it("après un échec, la révision suivante réussie remet la compétence en « acquis »", () => {
    let e = enregistrerRappel(etatVide(J0), a.id, true, J0);
    e = enregistrerRappel(e, a.id, false, jour("2026-10-23"));
    e = enregistrerRappel(e, a.id, true, jour("2026-10-24"));
    expect(e.noeuds[a.id]).toMatchObject({ boite: 2, dernier: "ok" });
    expect(statutPratique(e, a.id, jour("2026-10-24"))).toBe("acquis-teste");
  });
});

describe("révisions échues", () => {
  it("liste les compétences dues, la plus en retard d'abord", () => {
    let e = enregistrerRappel(etatVide(J0), b.id, true, jour("2026-10-20")); // due 21
    e = enregistrerRappel(e, a.id, true, jour("2026-10-21")); // due 22
    e = enregistrerRappel(e, c.id, true, J0); // due 23 : pas encore
    expect(echues(e, J0)).toEqual([b.id, a.id]);
    expect(echues(e, jour("2026-10-23"))).toEqual([b.id, a.id, c.id]);
  });
  it("n'inclut pas les compétences seulement vues", () => expect(echues(marquerVu(etatVide(J0), a.id, J0), jour("2027-01-01"))).toEqual([]));
  it("expose toutes les prochaines échéances, y compris futures", () => {
    const e = enregistrerRappel(etatVide(J0), a.id, true, J0);
    expect(prochainesEcheances(e)).toEqual([{ id: a.id, echeance: "2026-10-23" }]);
  });
});

describe("hors parcours", () => {
  it("sort la compétence du dénominateur sans toucher au statut", () => {
    const e = definirHorsParcours(etatVide(J0), roadmap.id, a.id, true);
    const d = compter(e, roadmap.id, roadmap.noeuds, J0);
    expect(d.horsParcours).toBe(1);
    expect(d.actifs).toBe(roadmap.noeuds.length - 1);
    expect(definirHorsParcours(e, roadmap.id, a.id, false).horsParcours).toEqual({});
  });
});

describe("vue de compatibilité", () => {
  it("traduit acquis et à revoir en maitrise, vu en en-cours, hors parcours en ignore", () => {
    let e = enregistrerRappel(etatVide(J0), a.id, true, J0);
    e = marquerVu(e, b.id, J0);
    e = definirHorsParcours(e, roadmap.id, c.id, true);
    expect(vueProgression(e, roadmap, jour("2026-10-30"))).toEqual({ [a.id]: "maitrise", [b.id]: "en-cours", [c.id]: "ignore" });
  });
});

describe("migration des anciennes progressions (sans perte)", () => {
  const anciennes = { [roadmap.id]: { [a.id]: "maitrise", [b.id]: "en-cours", [c.id]: "ignore" } as const };

  it("transforme « maîtrisé » en « vu » déclaré, jamais en « acquis »", () => {
    const e = migrer(etatVide(J0), anciennes, J0);
    expect(statutPratique(e, a.id, J0)).toBe("vu");
    expect(e.noeuds[a.id].declare).toBe(true);
    expect(e.declares).toBe(1);
    expect(compter(e, roadmap.id, roadmap.noeuds, J0).acquis).toBe(0);
  });

  it("garde « en cours » (devenu vu) et « ignoré » (hors parcours)", () => {
    const e = migrer(etatVide(J0), anciennes, J0);
    expect(statutPratique(e, b.id, J0)).toBe("vu");
    expect(e.horsParcours[roadmap.id]).toEqual([c.id]);
    expect(e.noeuds[b.id].declare).toBeUndefined();
  });

  it("reprend aussi les roadmaps qui partagent une compétence, sans perdre aucune entrée", () => {
    const autre = getRoadmap("ingenieur-caas-telco")!;
    const e = migrer(etatVide(J0), { ...anciennes, [autre.id]: { [autre.noeuds[0].id]: "maitrise" } }, J0);
    expect(Object.keys(e.noeuds)).toEqual(expect.arrayContaining([a.id, b.id, autre.noeuds[0].id]));
  });

  it("est idempotente : une seconde migration ne change rien", () => {
    const e = migrer(etatVide(J0), anciennes, J0);
    expect(migrer(e, { [roadmap.id]: { [b.id]: "maitrise" } }, J0)).toBe(e);
  });

  it("ne rétrograde jamais une compétence déjà acquise par un test", () => {
    const acquise = enregistrerRappel(etatVide(J0), a.id, true, J0);
    const e = reprendreProgression(acquise, roadmap.id, { [a.id]: "en-cours" }, J0);
    expect(statutPratique(e, a.id, J0)).toBe("acquis-teste");
  });

  it("une compétence déclarée puis testée avec succès perd la marque « déclaré »", () => {
    const e = enregistrerRappel(migrer(etatVide(J0), anciennes, J0), a.id, true, J0);
    expect(e.noeuds[a.id].declare).toBeUndefined();
    expect(statutPratique(e, a.id, J0)).toBe("acquis-teste");
  });
});

describe("stockage", () => {
  it("fait l'aller-retour sans perte", () => {
    const e = enregistrerRappel(marquerVu(etatVide(J0), b.id, J0), a.id, true, J0);
    expect(lireEtat(serialiserEtat(e), J0)).toEqual(e);
  });
  it("ignore un contenu corrompu ou inconnu", () => {
    expect(lireEtat("pas du json", J0)).toEqual(etatVide(J0));
    expect(lireEtat(JSON.stringify({ version: 2 }), J0)).toEqual(etatVide(J0));
    expect(lireEtat(null, J0)).toEqual(etatVide(J0));
  });
  it("réinitialise une roadmap sans toucher aux compétences des autres", () => {
    const autre = getRoadmap("ingenieur-caas-telco")!;
    const hors = autre.noeuds.find((n) => !roadmap.noeuds.some((m) => m.id === n.id))!;
    let e = enregistrerRappel(etatVide(J0), a.id, true, J0);
    e = marquerVu(e, hors.id, J0);
    e = reinitialiserRoadmap(e, roadmap);
    expect(statutPratique(e, a.id, J0)).toBe("a-decouvrir");
    expect(statutPratique(e, hors.id, J0)).toBe("vu");
  });
});

describe("rythme d'étude", () => {
  it("vaut 4 h par semaine tant que rien n'est choisi", () => {
    expect(rythmeDe(etatVide(J0))).toBe(4);
  });
  it("se fixe à l'heure près, borné de 1 à 40, sans toucher aux compétences", () => {
    const e = marquerVu(etatVide(J0), "a", J0);
    expect(rythmeDe(definirRythme(e, 6.4))).toBe(6);
    expect(rythmeDe(definirRythme(e, 0))).toBe(RYTHME_MIN);
    expect(rythmeDe(definirRythme(e, 99))).toBe(RYTHME_MAX);
    expect(definirRythme(e, 6).noeuds).toEqual(e.noeuds);
  });
  it("survit à la relecture du stockage ; un rythme absurde est rejeté (état vide)", () => {
    const e = definirRythme(etatVide(J0), 7);
    expect(lireEtat(serialiserEtat(e), J0).rythme).toBe(7);
    expect(lireEtat(JSON.stringify({ ...e, rythme: 0 }), J0).rythme).toBeUndefined();
  });
});
