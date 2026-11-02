import type { Metadata } from "next";
import Link from "next/link";
import Subscribe from "@/components/Subscribe";
import { chargerOrientation } from "@/lib/orientation";
import { exigerRefonte } from "@/lib/refonte";
import { parcoursMetier } from "@/lib/rubriques";
import { chargerRoadmaps } from "@/lib/roadmaps";
import { urlRoadmap } from "@/lib/urls";

export const metadata: Metadata = {
  title: "Roadmaps",
  description: "Un parcours de compétences par métier du cloud télécom, du plus accessible au plus spécialisé.",
};

export default function Roadmaps() {
  exigerRefonte();
  const parId = new Map(chargerRoadmaps().map((r) => [r.id, r]));
  const roadmaps = parcoursMetier(chargerOrientation().ordre.map((id) => parId.get(id)!));
  return (
    <main>
      <div className="mx-auto max-w-4xl space-y-10 px-4 py-14 sm:px-6 sm:py-20">
        <header className="space-y-4">
          <h1 className="text-4xl font-semibold sm:text-5xl">Roadmaps</h1>
          <p className="max-w-2xl text-lg" style={{ color: "var(--muted)" }}>
            Un parcours par métier, du plus accessible au plus spécialisé.
          </p>
        </header>

        <p>
          Pas sûr du parcours ?{" "}
          <Link href="/#diagnostic" className="underline underline-offset-4">
            Choisir son parcours
          </Link>{" "}
          <span style={{ color: "var(--muted)" }}>: trois questions, un parcours et un premier pas.</span>
        </p>

        <section aria-labelledby="titre-parcours" className="space-y-4">
          <h2 id="titre-parcours" className="text-2xl font-semibold">
            Tous les parcours
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {roadmaps.map((r) => (
              <li key={r.id}>
                <Link href={urlRoadmap(r.id)} className="panneau flex h-full flex-col gap-2 p-6">
                  <h3 className="text-lg font-semibold">{r.titre}</h3>
                  <p className="mono">
                    {r.noeuds.length} compétences · {r.blocs.length} blocs
                  </p>
                  {r.presentation && (
                    <p className="line-clamp-3 text-sm" style={{ color: "var(--muted)" }}>
                      {r.presentation}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <Subscribe contexte="roadmap" />
    </main>
  );
}
