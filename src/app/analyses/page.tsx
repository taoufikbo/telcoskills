import type { Metadata } from "next";
import Link from "next/link";
import PageEbauche from "@/components/PageEbauche";
import { analysesPubliees } from "@/lib/analyses";
import { exigerRefonte } from "@/lib/refonte";

export async function generateMetadata(): Promise<Metadata> {
  const publiees = await analysesPubliees();
  return {
    title: "Analyses",
    description: "Essais et analyses d'architecture de plateformes télécom.",
    robots: publiees.length === 0 ? { index: false } : undefined, // indexable dès la première analyse publiée
  };
}

export default async function PageAnalyses() {
  exigerRefonte();
  const analyses = await analysesPubliees();
  return (
    <PageEbauche titre="Analyses" intro="Essais et analyses d'architecture de plateformes télécom." enCours={analyses.length === 0}>
      {analyses.length > 0 && (
        <ul className="grid gap-4">
          {analyses.map((a) => (
            <li key={a.slug}>
              <Link href={`/analyses/${a.slug}`} className="panneau flex flex-col gap-2 p-6">
                <h2 className="text-xl font-semibold">{a.meta.titre}</h2>
                <p style={{ color: "var(--muted)" }}>{a.meta.description}</p>
                {a.meta.brouillon && <span className="mono">Brouillon, visible en développement seulement</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageEbauche>
  );
}
