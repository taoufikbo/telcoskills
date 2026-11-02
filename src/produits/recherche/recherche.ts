import type { Projet } from "@/lib/projet-schema";
import type { Roadmap } from "@/lib/schema";
import { urlNoeud, urlProjet, urlRoadmap } from "@/lib/urls";

export type EntreeRecherche = {
  genre: "roadmap" | "noeud" | "projet";
  titre: string;
  contexte: string;
  href: string;
};

export function normaliser(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function construireIndex(roadmaps: Roadmap[], projets: Projet[] = []): EntreeRecherche[] {
  const entreesProjets = projets.flatMap((p) => [
    { genre: "projet" as const, titre: p.titre, contexte: "Projet", href: urlProjet(p.id) },
    ...p.phases.map((ph) => ({
      genre: "projet" as const,
      titre: ph.titre,
      contexte: `Projet · ${p.titre}`,
      href: `${urlProjet(p.id)}#phase-${ph.id}`,
    })),
  ]);
  return [...entreesProjets, ...roadmaps.flatMap((r) => [
    { genre: "roadmap" as const, titre: r.titre, contexte: "Roadmap", href: urlRoadmap(r.id) },
    ...r.noeuds.map((n) => ({
      genre: "noeud" as const,
      titre: n.titre,
      contexte: `${r.titre} · ${n.bloc}`,
      href: urlNoeud(r.id, n.id),
    })),
  ])];
}

export function rechercher(index: EntreeRecherche[], requete: string, limite = 10): EntreeRecherche[] {
  const q = normaliser(requete.trim());
  if (!q) return [];
  const scored: { e: EntreeRecherche; score: number }[] = [];
  for (const e of index) {
    const pos = normaliser(e.titre).indexOf(q);
    if (pos === -1) continue;
    scored.push({ e, score: (pos === 0 ? 0 : 10) + (e.genre === "roadmap" ? 0 : 1) });
  }
  return scored.sort((a, b) => a.score - b.score).slice(0, limite).map((s) => s.e);
}
