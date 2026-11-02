import { compter, echues, vueProgression, type Decompte, type EtatPratique } from "@/produits/progression";
import { prochaineEtape, type RoadmapLegere, type Suite } from "./objectif";

/** Ce que « Mon espace » sait d'une roadmap : de quoi calculer l'avancement et le prochain pas, rien de plus (pas de ressources, pas de textes longs). */
export type RoadmapEspace = RoadmapLegere & { titre: string; blocs: string[] };

export type BlocEspace = { nom: string; decompte: Decompte };
export type ParcoursEspace = { id: string; titre: string; decompte: Decompte };
export type MonParcours = ParcoursEspace & { blocs: BlocEspace[]; prochaine: Suite };
export type Echue = { id: string; titre: string; roadmapId: string };

export type Espace = {
  /** Le parcours sur lequel la personne a agi en dernier ; null tant qu'elle n'a rien fait. */
  monParcours: MonParcours | null;
  /** Les autres parcours sur lesquels elle a agi, du plus récent au plus ancien. */
  autres: ParcoursEspace[];
  /** Révisions dues aujourd'hui, toutes roadmaps confondues (la plus en retard d'abord). */
  echues: Echue[];
};

/** La synthèse de « Mon espace » : où j'en suis, ce que je fais maintenant, ce qui est dû. Pure. */
export function resumerEspace(etat: EtatPratique, roadmaps: RoadmapEspace[], now: Date): Espace {
  const parId = new Map(roadmaps.map((r) => [r.id, r]));
  const suivis = etat.parcours.map((id) => parId.get(id)).filter((r): r is RoadmapEspace => r !== undefined);
  const resume = (r: RoadmapEspace): ParcoursEspace => ({ id: r.id, titre: r.titre, decompte: compter(etat, r.id, r.noeuds, now) });

  const premier = suivis[0];
  const monParcours: MonParcours | null = premier
    ? {
        ...resume(premier),
        blocs: premier.blocs.map((nom) => ({ nom, decompte: compter(etat, premier.id, premier.noeuds.filter((n) => n.bloc === nom), now) })),
        prochaine: prochaineEtape(premier, vueProgression(etat, premier, now)),
      }
    : null;

  const titreDe = new Map<string, { titre: string; roadmapId: string }>();
  for (const r of [...suivis, ...roadmaps]) for (const n of r.noeuds) if (!titreDe.has(n.id)) titreDe.set(n.id, { titre: n.titre, roadmapId: r.id });
  const echuesListe = echues(etat, now).flatMap((id) => {
    const t = titreDe.get(id);
    return t ? [{ id, ...t }] : [];
  });

  return { monParcours, autres: suivis.slice(1).map(resume), echues: echuesListe };
}
