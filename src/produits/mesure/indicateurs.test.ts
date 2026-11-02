import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { EVENEMENTS, premiereFoisAujourdhui } from "./analytics";
import { calculerIndicateurs, SEUIL_FIABLE, taux, type EvenementMesure } from "./indicateurs";
import { ecartJours } from "@/lib/jour";

const ev = (name: string, data: EvenementMesure["data"] = {}): EvenementMesure => ({ name, data });
const fois = (n: number, f: (i: number) => EvenementMesure) => Array.from({ length: n }, (_, i) => f(i));

describe("taux et intervalle de confiance", () => {
  it("calcule l'intervalle de Wilson", () => {
    const t = taux(15, 30);
    expect(t.taux).toBe(0.5);
    expect(t.ic95![0]).toBeCloseTo(0.332, 2);
    expect(t.ic95![1]).toBeCloseTo(0.668, 2);
  });
  it("sans observation : pas de taux, pas d'intervalle", () => expect(taux(0, 0)).toMatchObject({ taux: null, ic95: null, fiable: false }));
  it("n'est « fiable » qu'à partir de 30 observations", () => {
    expect(taux(10, SEUIL_FIABLE - 1).fiable).toBe(false);
    expect(taux(10, SEUIL_FIABLE).fiable).toBe(true);
  });
  it("garde l'intervalle dans [0, 1], même à 0 % et 100 %", () => {
    expect(taux(0, 10).ic95![0]).toBe(0);
    expect(taux(10, 10).ic95![1]).toBe(1);
  });
});

describe("indicateurs de rétention", () => {
  it("réussite au rappel au premier essai : seulement les premiers essais", () => {
    const evs = [
      ...fois(4, () => ev("recall_attempt", { premierEssai: true })),
      ...fois(3, () => ev("recall_success", { premierEssai: true })),
      ev("recall_attempt", { premierEssai: false }),
      ev("recall_success", { premierEssai: false }),
    ];
    const r = calculerIndicateurs(evs).rappelPremierEssai;
    expect([r.k, r.n]).toEqual([3, 4]);
  });

  it("rétention à J+7 : seulement les révisions de la boîte 3, peu en retard", () => {
    const evs = [
      ...fois(5, () => ev("review_done", { boite: 3, ok: true, retard: 0 })),
      ev("review_done", { boite: 3, ok: false, retard: 1 }),
      ev("review_done", { boite: 3, ok: false, retard: 9 }), // trop en retard : n'est plus « J+7 »
      ev("review_done", { boite: 1, ok: true, retard: 0 }),
    ];
    const i = calculerIndicateurs(evs).retention;
    expect([i["J+7"].k, i["J+7"].n]).toEqual([5, 6]);
    expect([i["J+1"].k, i["J+1"].n]).toEqual([1, 1]);
    expect(i["J+21"].n).toBe(0);
  });

  it("retour pour une révision échue : premières révisions du jour / navigateurs-jours avec révision due", () => {
    const evs = [...fois(10, () => ev("review_due_shown")), ...fois(4, () => ev("review_done", { premiereDuJour: true })), ...fois(6, () => ev("review_done", { premiereDuJour: false }))];
    const r = calculerIndicateurs(evs).retourRevision;
    expect([r.k, r.n]).toEqual([4, 10]);
    expect(r.anomalie).toBe(false);
  });
  it("signale une anomalie quand il y a plus de révisions que d'affichages (données incohérentes)", () => {
    const r = calculerIndicateurs([ev("review_due_shown"), ...fois(3, () => ev("review_done", { premiereDuJour: true }))]).retourRevision;
    expect(r.anomalie).toBe(true);
    expect(r.taux).toBe(1);
  });

  it("délai jusqu'à la première compétence acquise : médiane et part dans les 7 jours, premières acquisitions seulement", () => {
    const evs = [0, 1, 2, 10].map((d) => ev("node_done", { premiere: true, delaiJours: d })).concat(ev("node_done", { premiere: false }), ev("node_done", { premiere: true }));
    const d = calculerIndicateurs(evs).delaiPremiereAcquisition;
    expect(d.n).toBe(4);
    expect(d.mediane).toBe(1.5);
    expect([d.dansLesSeptJours.k, d.dansLesSeptJours.n]).toEqual([3, 4]);
  });

  it("ne plante pas sans événement", () => {
    const i = calculerIndicateurs([]);
    expect(i.rappelPremierEssai.taux).toBeNull();
    expect(i.delaiPremiereAcquisition.mediane).toBeNull();
  });
});

describe("mesure : une fois par jour et par navigateur", () => {
  const faux = () => {
    const m = new Map<string, string>();
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
  };
  it("compte un navigateur-jour, pas un clic", () => {
    const s = faux();
    expect(premiereFoisAujourdhui("review_done", s, "2026-10-22")).toBe(true);
    expect(premiereFoisAujourdhui("review_done", s, "2026-10-22")).toBe(false);
    expect(premiereFoisAujourdhui("review_done", s, "2026-10-23")).toBe(true);
  });
  it("distingue les événements", () => {
    const s = faux();
    expect(premiereFoisAujourdhui("review_due_shown", s, "2026-10-22")).toBe(true);
    expect(premiereFoisAujourdhui("review_done", s, "2026-10-22")).toBe(true);
  });
  it("sans stockage : jamais vrai (on ne compte pas ce qu'on ne peut pas dédoublonner)", () => expect(premiereFoisAujourdhui("x", null)).toBe(false));
  it("mesure l'écart en jours de calendrier", () => {
    expect(ecartJours("2026-10-22", "2026-10-25")).toBe(3);
    expect(ecartJours("2026-03-28", "2026-03-31")).toBe(3);
    expect(ecartJours("2026-10-25", "2026-10-22")).toBe(-3);
  });
});

describe("METRICS.md et le code ne se contredisent pas", () => {
  const doc = fs.readFileSync(path.join(process.cwd(), "METRICS.md"), "utf8");
  it("documente chaque événement du code", () => {
    for (const e of EVENEMENTS) expect(doc, `« ${e} » n'est pas dans METRICS.md`).toContain(`\`${e}\``);
  });
  it("ne documente aucun événement qui n'existe pas", () => {
    const cites = [...doc.matchAll(/^\| `([a-z_]+)` \|/gm)].map((m) => m[1]);
    for (const c of cites) expect(EVENEMENTS as readonly string[], `« ${c} » est dans METRICS.md mais pas dans le code`).toContain(c);
  });
});
