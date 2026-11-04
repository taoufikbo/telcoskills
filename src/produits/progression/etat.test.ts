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
    expect(rythmeDe(etatVide(J0))).toBe(2);
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

describe("palier atteint", () => {
  it("vaut 0 sans rien, 1 après un rappel réussi, ou le palier déclaré s'il est plus haut", async () => {
    const { palierAtteint, definirPalier } = await import("./etat");
    expect(palierAtteint(etatVide(J0), a.id)).toBe(0);
    const teste = enregistrerRappel(etatVide(J0), a.id, true, J0);
    expect(palierAtteint(teste, a.id)).toBe(1);
    expect(palierAtteint(definirPalier(teste, a.id, 3), a.id)).toBe(3);
    // un palier déclaré ne rend jamais une compétence « acquise (testé) »
    expect(statutPratique(definirPalier(etatVide(J0), a.id, 4), a.id, J0)).toBe("a-decouvrir");
    expect(palierAtteint(definirPalier(etatVide(J0), a.id, 4), a.id)).toBe(4);
  });

  it("se déclare de 1 à 5 et s'efface, sans laisser d'entrée vide", async () => {
    const { definirPalier, palierAtteint } = await import("./etat");
    const e = definirPalier(etatVide(J0), a.id, 9);
    expect(palierAtteint(e, a.id)).toBe(5);
    const efface = definirPalier(e, a.id, null);
    expect(efface.noeuds[a.id]).toBeUndefined();
    const vu = definirPalier(marquerVu(etatVide(J0), a.id, J0), a.id, 2);
    expect(definirPalier(vu, a.id, null).noeuds[a.id]).toEqual({ vu: "2026-10-22" });
  });

  it("compte les compétences au palier visé, sans celles sorties du parcours ni celles sans palier visé", async () => {
    const { definirPalier, compterPaliers } = await import("./etat");
    const noeuds = [
      { id: a.id, cible: 3 },
      { id: b.id, cible: 2 },
      { id: c.id, cible: undefined },
    ];
    expect(compterPaliers(etatVide(J0), roadmap.id, noeuds)).toEqual({ vises: 2, atteints: 0 });
    let e = definirPalier(etatVide(J0), a.id, 3);
    e = enregistrerRappel(e, b.id, true, J0);
    expect(compterPaliers(e, roadmap.id, noeuds)).toEqual({ vises: 2, atteints: 1 });
    e = definirPalier(e, b.id, 2);
    expect(compterPaliers(e, roadmap.id, noeuds)).toEqual({ vises: 2, atteints: 2 });
    expect(compterPaliers(definirHorsParcours(e, roadmap.id, a.id, true), roadmap.id, noeuds)).toEqual({ vises: 1, atteints: 1 });
  });

  it("survit à la sérialisation du navigateur et rejette un palier hors bornes (état vide)", async () => {
    const { definirPalier } = await import("./etat");
    const e = definirPalier(etatVide(J0), a.id, 4);
    expect(lireEtat(serialiserEtat(e), J0).noeuds[a.id].palier).toBe(4);
    const faux = JSON.parse(serialiserEtat(e));
    faux.noeuds[a.id].palier = 9;
    expect(lireEtat(JSON.stringify(faux), J0).noeuds).toEqual({});
  });
});

describe("palier atteint : lien de sauvegarde et fusion", () => {
  it("est conservé par le lien ; un lien d'avant (sans palier) reste lu", async () => {
    const { definirPalier } = await import("./etat");
    const { encoderLienEtat, decoderLienEtat } = await import("./lien-etat");
    const e = definirPalier(enregistrerRappel(etatVide(J0), a.id, true, J0), a.id, 3);
    expect(decoderLienEtat(encoderLienEtat(e)).noeuds[a.id].palier).toBe(3);
    const sans = enregistrerRappel(etatVide(J0), b.id, true, J0);
    const lien = encoderLienEtat(sans);
    expect(decoderLienEtat(lien).noeuds[b.id].palier).toBeUndefined();
    expect(decoderLienEtat(lien).noeuds[b.id].boite).toBe(1);
  });

  it("garde le palier le plus haut des deux versions quand on importe une sauvegarde", async () => {
    const { definirPalier } = await import("./etat");
    const { fusionnerEtats } = await import("./lien-etat");
    const local = definirPalier(etatVide(J0), a.id, 2);
    const importe = definirPalier(enregistrerRappel(etatVide(J0), a.id, true, J0), a.id, 4);
    expect(fusionnerEtats(local, importe).noeuds[a.id].palier).toBe(4);
    expect(fusionnerEtats(importe, local).noeuds[a.id].palier).toBe(4);
    expect(fusionnerEtats(importe, local).noeuds[a.id].boite).toBe(1);
  });
});

describe("notions cochées (EX-09)", () => {
  it("se cochent et se décochent, par indice, sans entrée vide ensuite", async () => {
    const { basculerNotion, notionsCochees } = await import("./etat");
    let e = basculerNotion(etatVide(J0), a.id, 2);
    e = basculerNotion(e, a.id, 0);
    expect(notionsCochees(e, a.id)).toEqual([0, 2]);
    e = basculerNotion(basculerNotion(e, a.id, 0), a.id, 2);
    expect(notionsCochees(e, a.id)).toEqual([]);
    expect(e.noeuds[a.id]).toBeUndefined();
    expect(basculerNotion(etatVide(J0), a.id, 30).noeuds[a.id]).toBeUndefined();
    expect(basculerNotion(etatVide(J0), a.id, -1).noeuds[a.id]).toBeUndefined();
  });

  it("ne change ni le palier atteint ni le statut : c'est une auto-évaluation, pas une preuve", async () => {
    const { basculerNotion, palierAtteint } = await import("./etat");
    let e = etatVide(J0);
    for (let i = 0; i < 8; i++) e = basculerNotion(e, a.id, i);
    expect(palierAtteint(e, a.id)).toBe(0);
    expect(statutPratique(e, a.id, J0)).toBe("a-decouvrir");
    expect(compter(e, roadmap.id, roadmap.noeuds, J0).acquis).toBe(0);
  });

  it("survit à la sérialisation du navigateur et rejette un masque hors bornes (état vide)", async () => {
    const { basculerNotion } = await import("./etat");
    const e = basculerNotion(etatVide(J0), a.id, 5);
    expect(lireEtat(serialiserEtat(e), J0).noeuds[a.id].notions).toBe(32);
    const faux = JSON.parse(serialiserEtat(e));
    faux.noeuds[a.id].notions = 2 ** 31;
    expect(lireEtat(JSON.stringify(faux), J0).noeuds).toEqual({});
  });

  it("survit à l'import d'une progression (qui ne remplace que les statuts déclarés)", async () => {
    const { basculerNotion, definirPalier, effacerDeclarations } = await import("./etat");
    let e = definirPalier(basculerNotion(marquerVu(etatVide(J0), a.id, J0), a.id, 1), a.id, 3);
    e = effacerDeclarations(e, roadmap);
    expect(e.noeuds[a.id]).toEqual({ palier: 3, notions: 2 });
  });
});

describe("notions cochées : lien de sauvegarde et fusion (EX-09)", () => {
  it("sont conservées par le lien, seules ou avec un palier ; les liens d'avant restent identiques et lus", async () => {
    const { basculerNotion, definirPalier } = await import("./etat");
    const { encoderLienEtat, decoderLienEtat } = await import("./lien-etat");
    const seule = basculerNotion(marquerVu(etatVide(J0), a.id, J0), a.id, 3);
    expect(decoderLienEtat(encoderLienEtat(seule)).noeuds[a.id].notions).toBe(8);
    expect(decoderLienEtat(encoderLienEtat(seule)).noeuds[a.id].palier).toBeUndefined();
    const avecPalier = definirPalier(seule, a.id, 2);
    const lu = decoderLienEtat(encoderLienEtat(avecPalier)).noeuds[a.id];
    expect(lu).toMatchObject({ palier: 2, notions: 8 });
    // sans palier ni notions, l'élément de compétence ne change pas de forme
    const sans = encoderLienEtat(marquerVu(etatVide(J0), b.id, J0));
    const elementCompetence = sans.slice(3).split("_")[1];
    expect(elementCompetence.split(".")).toHaveLength(8);
    expect(decoderLienEtat(sans).noeuds[b.id].notions).toBeUndefined();
  });

  it("s'unissent à l'import d'une sauvegarde", async () => {
    const { basculerNotion, notionsCochees } = await import("./etat");
    const { fusionnerEtats } = await import("./lien-etat");
    const local = basculerNotion(etatVide(J0), a.id, 0);
    const importe = basculerNotion(basculerNotion(etatVide(J0), a.id, 1), a.id, 4);
    expect(notionsCochees(fusionnerEtats(local, importe), a.id)).toEqual([0, 1, 4]);
    expect(notionsCochees(fusionnerEtats(importe, local), a.id)).toEqual([0, 1, 4]);
  });
});
