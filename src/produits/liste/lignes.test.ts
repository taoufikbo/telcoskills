import { describe, expect, it } from "vitest";
import { chargerRoadmaps } from "@/lib/roadmaps";
import { lignesParBloc } from "./lignes";

const roadmap = chargerRoadmaps()[0];

describe("lignesParBloc", () => {
  it("reprend chaque compétence une fois, dans l'ordre des blocs puis de la roadmap", () => {
    const groupes = lignesParBloc(roadmap, {}, null);
    expect(groupes.map((g) => g.bloc)).toEqual(roadmap.blocs);
    const ids = groupes.flatMap((g) => g.lignes.map((l) => l.id));
    expect(ids.sort()).toEqual(roadmap.noeuds.map((n) => n.id).sort());
    for (const g of groupes) expect(g.lignes.map((l) => l.id)).toEqual(roadmap.noeuds.filter((n) => n.bloc === g.bloc).map((n) => n.id));
  });
  it("donne le statut issu de la progression, « à faire » par défaut", () => {
    const [a, b] = roadmap.noeuds;
    const lignes = lignesParBloc(roadmap, { [a.id]: "maitrise" }, null).flatMap((g) => g.lignes);
    expect(lignes.find((l) => l.id === a.id)?.statut).toBe("maitrise");
    expect(lignes.find((l) => l.id === b.id)?.statut).toBe("a-faire");
  });
  it("sans chemin, rien n'est atténué ; avec un chemin, tout ce qui est hors chemin l'est", () => {
    expect(lignesParBloc(roadmap, {}, null).flatMap((g) => g.lignes).some((l) => l.attenuee || l.surChemin)).toBe(false);
    const id = roadmap.noeuds[0].id;
    const lignes = lignesParBloc(roadmap, {}, new Set([id])).flatMap((g) => g.lignes);
    for (const l of lignes) expect([l.surChemin, l.attenuee]).toEqual(l.id === id ? [true, false] : [false, true]);
  });
});
