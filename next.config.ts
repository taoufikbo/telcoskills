import fs from "node:fs";
import path from "node:path";
import createMDX from "@next/mdx";
import type { NextConfig } from "next";

type Regle = {
  source: string;
  destination: string;
  /** 301 (et non le 308 que produit `permanent: true`) : c'est le code demandé pour les anciennes adresses. */
  statusCode: 301;
  has?: { type: "query"; key: string; value?: string }[];
};

/** Identifiants des roadmaps (content/roadmaps/*.json) : seules ces URL à un segment étaient des roadmaps. */
export function idsRoadmaps(dossier = path.join(process.cwd(), "content", "roadmaps")): string[] {
  return fs
    .readdirSync(dossier)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .sort();
}

/**
 * Redirections 301 de l'ancienne arborescence vers la nouvelle, pour l'instance publique uniquement.
 * L'ordre compte : la règle avec ?noeud= passe avant la règle sans paramètre.
 * Limite : Next transmet toujours la requête d'origine, donc ?noeud=… reste dans l'adresse de destination.
 * Sans effet (la page du nœud l'ignore et sa canonical est propre) ; seul un proxy.ts pourrait le retirer.
 * La liste des roadmaps est écrite dans le motif pour que /:roadmap n'avale pas /analyses, /offres, etc.
 */
export function redirections(instance: string | undefined = process.env.NEXT_PUBLIC_INSTANCE ?? "public", ids: string[] = idsRoadmaps()): Regle[] {
  if (instance !== "public") return [];
  const roadmap = `/:roadmap(${ids.join("|")})`;
  return [
    { source: roadmap, has: [{ type: "query", key: "noeud", value: "(?<noeud>.+)" }], destination: "/ressources/roadmaps/:roadmap/:noeud", statusCode: 301 },
    { source: roadmap, destination: "/ressources/roadmaps/:roadmap", statusCode: 301 },
    { source: `${roadmap}/opengraph-image`, destination: "/ressources/roadmaps/:roadmap/opengraph-image", statusCode: 301 },
    // Le diagnostic a quitté le catalogue des roadmaps pour l'accueil : un résultat partagé (?profil=) y reste lisible.
    { source: "/ressources/roadmaps", has: [{ type: "query", key: "profil" }], destination: "/", statusCode: 301 },
    // La rubrique Sylva est devenue un onglet à part.
    { source: "/ressources/sylva", destination: "/sylva", statusCode: 301 },
    { source: "/projets", destination: "/ressources/projet-fil-rouge", statusCode: 301 },
    { source: "/projets/:slug", destination: "/ressources/projet-fil-rouge", statusCode: 301 },
    { source: "/projets/:slug/carte", destination: "/ressources/projet-fil-rouge/carte", statusCode: 301 },
  ];
}

const withMDX = createMDX({});

const config: NextConfig = {
  // Dépôt du site public : l'instance « public » est la seule, y compris quand la variable n'est pas définie.
  env: { NEXT_PUBLIC_INSTANCE: process.env.NEXT_PUBLIC_INSTANCE ?? "public" },
  async redirects() {
    return redirections();
  },
};

export default withMDX(config);
