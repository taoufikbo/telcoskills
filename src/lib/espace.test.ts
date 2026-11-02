import { describe, expect, it } from "vitest";
import { resumerEspace, type RoadmapEspace } from "./espace";
import { enregistrerRappel, etatVide, marquerVu, migrer, suivreParcours } from "@/produits/progression";
import { chargerRoadmaps } from "./roadmaps";

const jour = (j: string) => new Date(`${j}T12:00:00`);
const J0 = jour("2026-10-22");
const roadmaps: RoadmapEspace[] = chargerRoadmaps().map((r) => ({ id: r.id, titre: r.titre, blocs: r.blocs, noeuds: r.noeuds.map(({ id, titre, bloc, niveau, prerequis }) => ({ id, titre, bloc, niveau, prerequis })) }));
const archi = roadmaps.find((r) => r.id === "architecte-caas-telco")!;
const caas = roadmaps.find((r) => r.id === "ingenieur-caas-telco")!;

describe("parcours suivis", () => {
  it("met en tête le dernier parcours sur lequel on a agi, sans doublon", () => {
    let e = suivreParcours(etatVide(J0), archi.id);
    e = suivreParcours(e, caas.id);
    expect(e.parcours).toEqual([caas.id, archi.id]);
    expect(suivreParcours(e, archi.id).parcours).toEqual([archi.id, caas.id]);
    expect(suivreParcours(e, caas.id)).toBe(e);
  });
  it("reprend, à la migration, les parcours qui avaient des statuts", () => {
    const e = migrer(etatVide(J0), { [archi.id]: { linux: "maitrise" }, [caas.id]: {} }, J0);
    expect(e.parcours).toEqual([archi.id]);
  });
});

describe("Mon espace", () => {
  it("est vide tant qu'on n'a agi sur aucun parcours", () => {
    const s = resumerEspace(etatVide(J0), roadmaps, J0);
    expect(s.monParcours).toBeNull();
    expect(s.echues).toEqual([]);
  });

  it("donne l'avancement, les blocs et le prochain pas du dernier parcours", () => {
    let e = suivreParcours(etatVide(J0), archi.id);
    e = marquerVu(e, "linux", J0);
    const s = resumerEspace(e, roadmaps, J0);
    expect(s.monParcours?.id).toBe(archi.id);
    expect(s.monParcours?.decompte).toMatchObject({ acquis: 0, vus: 1 });
    expect(s.monParcours?.blocs.map((b) => b.nom)).toEqual(archi.blocs);
    expect(s.monParcours?.blocs.reduce((n, b) => n + b.decompte.total, 0)).toBe(archi.noeuds.length);
    expect(s.monParcours?.prochaine).toMatchObject({ type: "suite", enCours: true, noeud: { id: "linux" } });
  });

  it("range les autres parcours derrière le premier", () => {
    const e = suivreParcours(suivreParcours(etatVide(J0), archi.id), caas.id);
    const s = resumerEspace(e, roadmaps, J0);
    expect(s.monParcours?.id).toBe(caas.id);
    expect(s.autres.map((p) => p.id)).toEqual([archi.id]);
  });

  it("liste les révisions dues, toutes roadmaps confondues, avec leur titre", () => {
    let e = suivreParcours(etatVide(J0), archi.id);
    e = enregistrerRappel(e, "linux", true, jour("2026-10-20"));
    e = enregistrerRappel(e, "ha-geo", true, jour("2026-10-21"));
    const s = resumerEspace(e, roadmaps, J0);
    expect(s.echues.map((x) => x.id)).toEqual(["linux", "ha-geo"]);
    expect(s.echues[0].titre).toBe(archi.noeuds.find((n) => n.id === "linux")!.titre);
    expect(s.monParcours?.decompte).toMatchObject({ acquis: 2, aRevoir: 2 });
  });

  it("ignore un parcours suivi qui n'existe plus", () => {
    const e = { ...etatVide(J0), parcours: ["supprime", archi.id] };
    expect(resumerEspace(e, roadmaps, J0).monParcours?.id).toBe(archi.id);
  });
});
