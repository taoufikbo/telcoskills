import type { Rappel } from "./pratique-schema";
import type { Niveau, Roadmap } from "./schema";

/** « Je ne sais pas » : une réponse honnête, sans pénalité, qui ne donne jamais d'acquis. */
export const NE_SAIT_PAS = "?" as const;
export type Reponse = number | typeof NE_SAIT_PAS | null;

export type NoeudTest = { id: string; titre: string; niveau: Niveau; q1: Rappel; q2: Rappel };
export type BlocTestable = { roadmapId: string; roadmapTitre: string; bloc: string; slug: string; noeuds: NoeudTest[] };

/** « Résilience et exploitabilité » → « resilience-et-exploitabilite » : l'adresse d'un bloc. */
export const slugBloc = (nom: string) =>
  nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Un bloc se teste s'il a au moins deux compétences portant chacune au moins deux questions de rappel (une pour savoir, une pour confirmer). */
export const MINIMUM_COMPETENCES_TEST = 2;

export function blocsTestables(roadmaps: Pick<Roadmap, "id" | "titre" | "blocs" | "noeuds">[]): BlocTestable[] {
  return roadmaps.flatMap((r) =>
    r.blocs.flatMap((bloc) => {
      const noeuds = r.noeuds
        .filter((n) => n.bloc === bloc && (n.pratique?.rappel?.length ?? 0) >= 2)
        .map((n) => ({ id: n.id, titre: n.titre, niveau: n.niveau, q1: n.pratique!.rappel![0], q2: n.pratique!.rappel![1] }));
      return noeuds.length >= MINIMUM_COMPETENCES_TEST ? [{ roadmapId: r.id, roadmapTitre: r.titre, bloc, slug: slugBloc(bloc), noeuds }] : [];
    }),
  );
}

const juste = (q: Rappel, r: Reponse | undefined) => typeof r === "number" && r === q.bonne;

/**
 * Deuxième temps du test : seules les compétences dont la première question est juste sont confirmées par une seconde.
 * Une personne qui ne sait pas répond à une question par compétence ; une personne qui sait en répond à deux.
 */
export function aConfirmer(noeuds: NoeudTest[], premieres: Record<string, Reponse>): NoeudTest[] {
  return noeuds.filter((n) => juste(n.q1, premieres[n.id]));
}

export type ResultatTest = { acquis: string[]; aTravailler: string[] };

/** Acquise = les deux questions justes. Le hasard à quatre propositions donne une réussite sur 16 (deux questions) au lieu de 1 sur 4. */
export function resultatTest(noeuds: NoeudTest[], premieres: Record<string, Reponse>, secondes: Record<string, Reponse>): ResultatTest {
  const acquis = noeuds.filter((n) => juste(n.q1, premieres[n.id]) && juste(n.q2, secondes[n.id])).map((n) => n.id);
  return { acquis, aTravailler: noeuds.filter((n) => !acquis.includes(n.id)).map((n) => n.id) };
}
