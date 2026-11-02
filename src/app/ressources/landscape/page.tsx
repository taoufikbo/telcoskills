import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { exigerRefonte } from "@/lib/refonte";
import { BASE_PROJET } from "@/lib/urls";
import { chargerLandscape, LandscapeView, resoudreLandscape } from "@/produits/landscape";

const description = "Les outils d'une pile cloud télécom, groupés par fonction comme le landscape CNCF, et recomposés selon les rôles choisis.";
export const metadata: Metadata = { title: "Landscape", description };

export default function PageLandscape() {
  exigerRefonte();
  const landscape = resoudreLandscape(chargerLandscape());
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 sm:py-14">
      <nav aria-label="Fil d'Ariane" className="mono">
        <Link href="/ressources" className="underline">
          Ressources
        </Link>
        {" / Landscape"}
      </nav>
      <header className="space-y-3">
        <h1 className="text-4xl font-semibold sm:text-5xl">Landscape</h1>
        <p className="max-w-3xl text-lg" style={{ color: "var(--muted)" }}>
          {landscape.outils.length} outils d&apos;une pile cloud télécom, groupés par fonction. Choisissez un ou plusieurs rôles du{" "}
          <Link href={BASE_PROJET} className="underline" style={{ color: "var(--fg)" }}>
            projet fil rouge
          </Link>{" "}
          : la vue se recompose pour montrer la pile de cette équipe, et ce qu&apos;elle partage.
        </p>
      </header>
      <Suspense>
        <LandscapeView landscape={landscape} />
      </Suspense>
    </main>
  );
}
