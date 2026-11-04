import { describe, expect, it } from "vitest";
import { chargerMondes, mondeDuBloc, partCloud, problemesMondes, repartition } from "./mondes";
import { chargerRoadmaps } from "./roadmaps";

const mondes = chargerMondes();
const roadmaps = chargerRoadmaps();

describe("mondes : classement des blocs", () => {
  it("classe chaque bloc de chaque roadmap, une seule fois", () => {
    expect(problemesMondes(mondes, roadmaps)).toEqual([]);
  });

  it("répartit toutes les compétences : la somme est le nombre de nœuds", () => {
    for (const r of roadmaps) {
      const p = repartition(r, mondes);
      expect(p.cloud + p.convergence + p.telecom + p.transverse, r.id).toBe(r.noeuds.length);
    }
  });

  it("place l'exploitation côté cloud et l'intégration 5GC côté télécom", () => {
    const part = (id: string) => partCloud(repartition(roadmaps.find((r) => r.id === id)!, mondes));
    expect(part("sre-exploitation-telco")).toBeGreaterThan(part("ingenieur-caas-telco"));
    expect(part("ingenieur-caas-telco")).toBeGreaterThan(part("integrateur-nf-5gc"));
  });

  it("repère un bloc non classé", () => {
    const r = { ...roadmaps[0], noeuds: [{ ...roadmaps[0].noeuds[0], bloc: "Bloc inconnu" }] };
    expect(problemesMondes(mondes, [r])).toHaveLength(1);
    expect(mondeDuBloc(mondes, "Bloc inconnu")).toBeUndefined();
  });
});
