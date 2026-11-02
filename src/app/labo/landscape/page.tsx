import type { Metadata } from "next";
import { Suspense } from "react";
import { chargerLandscape, LandscapeView, resoudreLandscape } from "@/produits/landscape";

export const metadata: Metadata = { title: "Labo : Landscape" };

export default function Page() {
  const l = resoudreLandscape(chargerLandscape());
  return (
    <>
      <h1 className="text-3xl font-semibold">Landscape</h1>
      <p className="mono">
        {l.outils.length} outils, {l.categories.length} catégories, {l.roles.length} rôles, {l.outils.filter((o) => o.logo).length} logos.
      </p>
      <Suspense>
        <LandscapeView landscape={l} />
      </Suspense>
    </>
  );
}
