import { describe, expect, it } from "vitest";
import { genererIcs } from "./calendrier";
import { decoderLienEtat, encoderLienEtat, estLienEtat, fusionnerEtats, PREFIXE_LIEN } from "@/produits/progression";

const PREFIXE_LIEN_LONGUEUR = PREFIXE_LIEN.length;
import { definirHorsParcours, enregistrerRappel, etatVide, marquerVu, suivreParcours } from "@/produits/progression";
import type { Rappel } from "./pratique-schema";
import { choisirQuestion, construireFile, melanger, type NoeudRevisable } from "./revision";

const jour = (j: string) => new Date(`${j}T12:00:00`);
const J0 = jour("2026-10-22");
const q = (id: string): Rappel => ({ id, enonce: "e", options: ["a", "b", "c", "d"], bonne: 0, explication: "x", source: "s", statut: "valide", mauvaisChoixPlausible: 1 });
const noeud = (id: string, bloc: string, nq = 2): NoeudRevisable => ({ id, titre: `Titre ${id}`, bloc, roadmapId: "r", questions: Array.from({ length: nq }, (_, i) => q(`${id}-${i}`)) });

describe("mélange entre blocs", () => {
  it("évite deux questions de suite du même bloc quand c'est possible, sans casser la priorité", () => {
    const sortie = melanger([{ id: "a1", bloc: "A" }, { id: "a2", bloc: "A" }, { id: "b1", bloc: "B" }, { id: "a3", bloc: "A" }]);
    expect(sortie.map((x) => x.id)).toEqual(["a1", "b1", "a2", "a3"]);
    for (let i = 1; i < 3; i++) expect(sortie[i].bloc).not.toBe(sortie[i - 1].bloc);
  });
  it("garde l'ordre quand il n'y a qu'un bloc", () => {
    expect(melanger([{ id: "1", bloc: "A" }, { id: "2", bloc: "A" }]).map((x) => x.id)).toEqual(["1", "2"]);
  });
  it("ne perd ni ne duplique aucun élément", () => {
    const e = ["A", "A", "B", "B", "C", "A"].map((bloc, i) => ({ id: String(i), bloc }));
    expect(melanger(e).map((x) => x.id).sort()).toEqual(e.map((x) => x.id).sort());
  });
});

describe("file de révision", () => {
  const noeuds = new Map([noeud("n1", "A"), noeud("n2", "A"), noeud("n3", "B"), noeud("sans", "A", 0)].map((n) => [n.id, n]));
  const etat = () => {
    let e = etatVide(J0);
    for (const [id, d] of [["n1", "2026-10-18"], ["n2", "2026-10-19"], ["n3", "2026-10-20"], ["sans", "2026-10-20"]]) e = enregistrerRappel(e, id, true, jour(d));
    return e;
  };

  it("ne propose que les révisions dues, une question par compétence, mélangées entre blocs", () => {
    const f = construireFile(etat(), J0, noeuds);
    expect(f.file.map((x) => x.id)).toEqual(["n1", "n3", "n2"]);
    expect(f.file.every((x) => x.question.id.startsWith(x.id))).toBe(true);
  });
  it("signale les compétences dues sans question, sans les perdre", () => {
    expect(construireFile(etat(), J0, noeuds).sansQuestion).toEqual(["sans"]);
  });
  it("plafonne la session et compte les restantes", () => {
    const f = construireFile(etat(), J0, noeuds, 2);
    expect(f.file).toHaveLength(2);
    expect(f.restantes).toBe(1);
  });
  it("n'inclut pas ce qui n'est pas encore dû", () => {
    const e = enregistrerRappel(etatVide(J0), "n1", true, J0);
    expect(construireFile(e, J0, noeuds).file).toEqual([]);
  });
  it("fait tourner les questions d'une révision à l'autre", () => {
    const n = noeud("x", "A", 3);
    expect([0, 1, 2, 3].map((t) => choisirQuestion(n, t).id)).toEqual(["x-0", "x-1", "x-2", "x-0"]);
  });
});

describe("export calendrier (.ics)", () => {
  const titres = new Map([["n1", "Haute disponibilité, géo-redondance"], ["n2", "Autre"]]);
  const etat = () => enregistrerRappel(enregistrerRappel(etatVide(J0), "n1", true, J0), "n2", true, jour("2026-10-10"));
  const ics = genererIcs(etat(), titres, J0, "https://exemple.test/revision");

  it("est un calendrier valide, en CRLF, avec un événement par compétence acquise", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).not.toMatch(/[^\r]\n/);
  });
  it("place les révisions à leur échéance, et celles en retard aujourd'hui", () => {
    expect(ics).toContain("DTSTART;VALUE=DATE:20261023"); // n1 : J+1
    expect(ics).toContain("DTSTART;VALUE=DATE:20261022"); // n2 : échue depuis le 11
  });
  it("a un identifiant stable par compétence : un nouvel export met à jour au lieu de dupliquer", () => {
    const plus_tard = genererIcs(etat(), titres, jour("2026-10-23"), "https://exemple.test/revision");
    expect(plus_tard).toContain("UID:revision-n1@telcocloud-roadmaps");
    expect(ics.match(/UID:[^\r]+/g)).toEqual(plus_tard.match(/UID:[^\r]+/g));
    expect(Number(plus_tard.match(/SEQUENCE:(\d+)/)![1])).toBeGreaterThan(Number(ics.match(/SEQUENCE:(\d+)/)![1]));
  });
  it("échappe les virgules du titre et plie les lignes à 75 octets", () => {
    expect(ics).toContain("SUMMARY:Réviser : Haute disponibilité\\, géo-redondance");
    for (const ligne of ics.split("\r\n")) expect(new TextEncoder().encode(ligne).length).toBeLessThanOrEqual(75);
  });
  it("n'exporte pas les compétences seulement vues", () => {
    expect(genererIcs(marquerVu(etatVide(J0), "n1", J0), titres, J0, "u").match(/BEGIN:VEVENT/g)).toBeNull();
  });
});

describe("lien de sauvegarde (état complet)", () => {
  const riche = () => {
    let e = suivreParcours(etatVide(J0), "architecte-caas-telco");
    e = enregistrerRappel(e, "ha-geo", true, J0);
    e = marquerVu(e, "linux", J0);
    return definirHorsParcours(e, "architecte-caas-telco", "conteneurs", true);
  };

  it("fait l'aller-retour sans perdre les dates de révision", () => {
    const e = riche();
    const lu = decoderLienEtat(encoderLienEtat(e));
    expect(lu.noeuds).toEqual(e.noeuds);
    expect(lu.parcours).toEqual(e.parcours);
    expect(lu.horsParcours).toEqual(e.horsParcours);
    expect(lu.noeuds["ha-geo"]).toMatchObject({ boite: 1, echeance: "2026-10-23" });
  });
  it("n'emploie que des caractères sûrs dans une adresse", () => expect(encoderLienEtat(riche())).toMatch(/^p1\.[a-z0-9._~-]+$/));
  it("conserve aussi les échecs, les tentatives et la marque « déclaré »", () => {
    let e = enregistrerRappel(enregistrerRappel(etatVide(J0), "a", true, J0), "a", false, jour("2026-10-23"));
    e = { ...e, noeuds: { ...e.noeuds, b: { vu: "2026-10-22", declare: true } } };
    const lu = decoderLienEtat(encoderLienEtat(e));
    expect(lu.noeuds.a).toMatchObject({ dernier: "echec", tentatives: 2, boite: 1 });
    expect(lu.noeuds.b).toEqual({ vu: "2026-10-22", declare: true });
  });
  it("refuse tout lien tronqué, à n'importe quel endroit (jamais un état partiel)", () => {
    const lien = encoderLienEtat(riche());
    for (let n = PREFIXE_LIEN_LONGUEUR; n < lien.length; n++) expect(() => decoderLienEtat(lien.slice(0, n)), `coupé à ${n}`).toThrow(/illisible/);
  });
  it("refuse un lien dont un caractère a changé", () => {
    const lien = encoderLienEtat(riche());
    const i = lien.indexOf("ha-geo") + 2;
    expect(() => decoderLienEtat(lien.slice(0, i) + "x" + lien.slice(i + 1))).toThrow(/illisible/);
  });
  it("reconnaît son format et refuse un lien coupé ou étranger", () => {
    expect(estLienEtat(encoderLienEtat(riche()))).toBe(true);
    expect(estLienEtat("architecte~linux.m")).toBe(false);
    expect(() => decoderLienEtat(encoderLienEtat(riche()).slice(0, 30))).toThrow(/illisible/);
    expect(() => decoderLienEtat("p1.pas-du-tout-valide")).toThrow(/illisible/);
  });
  it("tient dans une taille d'adresse raisonnable pour 60 compétences", () => {
    let e = etatVide(J0);
    for (let i = 0; i < 60; i++) e = enregistrerRappel(e, `competence-numero-${i}`, true, J0);
    expect(encoderLienEtat(e).length).toBeLessThan(2500);
  });
});

describe("fusion d'une sauvegarde importée (sans rien supprimer)", () => {
  it("garde la compétence acquise plutôt que « vue »", () => {
    const local = marquerVu(etatVide(J0), "a", J0);
    const importe = enregistrerRappel(etatVide(J0), "a", true, J0);
    expect(fusionnerEtats(local, importe).noeuds.a.boite).toBe(1);
    expect(fusionnerEtats(importe, local).noeuds.a.boite).toBe(1);
  });
  it("garde la réussite la plus récente entre deux versions acquises", () => {
    const ancien = enregistrerRappel(etatVide(J0), "a", true, jour("2026-10-01"));
    const recent = enregistrerRappel(enregistrerRappel(etatVide(J0), "a", true, jour("2026-10-05")), "a", true, jour("2026-10-06"));
    expect(fusionnerEtats(ancien, recent).noeuds.a.reussi).toBe("2026-10-06");
    expect(fusionnerEtats(recent, ancien).noeuds.a.reussi).toBe("2026-10-06");
  });
  it("réunit les compétences des deux côtés et les hors parcours", () => {
    const local = definirHorsParcours(marquerVu(etatVide(J0), "a", J0), "r", "x", true);
    const importe = definirHorsParcours(marquerVu(etatVide(J0), "b", J0), "r", "y", true);
    const f = fusionnerEtats(local, importe);
    expect(Object.keys(f.noeuds).sort()).toEqual(["a", "b"]);
    expect(f.horsParcours.r.sort()).toEqual(["x", "y"]);
  });
  it("garde « mon parcours » local en tête et ajoute les autres", () => {
    const f = fusionnerEtats(suivreParcours(etatVide(J0), "r1"), suivreParcours(suivreParcours(etatVide(J0), "r2"), "r1"));
    expect(f.parcours).toEqual(["r1", "r2"]);
  });
  it("ne perd aucune compétence de l'état local", () => {
    const local = marquerVu(enregistrerRappel(etatVide(J0), "a", true, J0), "b", J0);
    expect(Object.keys(fusionnerEtats(local, etatVide(J0)).noeuds).sort()).toEqual(["a", "b"]);
  });
});
