import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Cartouche from "@/components/Cartouche";
import Draft, { BROUILLONS_VISIBLES } from "@/components/Draft";
import { LienSuivi } from "@/produits/mesure";
import { chargerFrameworks, getFramework } from "@/lib/frameworks";
import { INSTANCE } from "@/lib/instance";
import { roadmapDeReference } from "@/lib/noeuds";
import { chargerOrientation } from "@/lib/orientation";
import { exigerRefonte } from "@/lib/refonte";
import { chargerRoadmaps, getRoadmap } from "@/lib/roadmaps";
import { urlNoeud } from "@/lib/urls";
import { CarteHeros, disposerCarte } from "@/produits/carte-heros";
import { contactDisponible } from "@/lib/sections";

export const dynamicParams = false;

export function generateStaticParams() {
  return INSTANCE.refonte ? chargerFrameworks().map((f) => ({ slug: f.id })) : [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const f = getFramework(slug);
  if (!f) return {};
  return {
    title: `Framework : ${f.titre}`,
    description: f.sujet,
    alternates: { canonical: `/frameworks/${slug}` },
    robots: { index: false }, // à retirer quand le framework est rédigé
  };
}

export default async function PageFramework({ params }: { params: Promise<{ slug: string }> }) {
  exigerRefonte();
  const { slug } = await params;
  const f = getFramework(slug);
  if (!f) notFound();

  const roadmaps = chargerRoadmaps();
  const ordre = chargerOrientation().ordre;
  const liees = f.noeuds
    .map((id) => {
      const ref = roadmapDeReference(roadmaps, id, ordre);
      const noeud = ref ? getRoadmap(ref)?.noeuds.find((n) => n.id === id) : undefined;
      return ref && noeud ? { id, ref, titre: noeud.titre } : null;
    })
    .filter((x) => x !== null);
  const roadmapGraphe = getRoadmap("architecte-caas-telco");
  const cibles = f.noeuds.filter((id) => roadmapGraphe?.noeuds.some((n) => n.id === id));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <nav aria-label="Fil d'Ariane" className="mono mb-8">
        <Link href="/frameworks" className="underline">
          Frameworks
        </Link>
      </nav>
      <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
        <article className="min-w-0 space-y-10">
          <header className="space-y-4">
            <h1 className="text-4xl font-semibold sm:text-5xl">{f.titre}</h1>
            <p className="max-w-2xl text-lg" style={{ color: "var(--muted)" }}>
              {f.sujet}
            </p>
          </header>

          {BROUILLONS_VISIBLES && (
          <section aria-labelledby="titre-probleme" className="space-y-3">
            <h2 id="titre-probleme" className="text-2xl font-semibold">
              Le problème que ce framework résout
            </h2>
            <Draft titre="le problème, en quelques lignes" />
          </section>
          )}

          {BROUILLONS_VISIBLES && (
          <section aria-labelledby="titre-dimensions" className="space-y-3">
            <h2 id="titre-dimensions" className="text-2xl font-semibold">
              Les dimensions du framework
            </h2>
            <Draft titre="les dimensions, leurs échelles et leur pondération">
              <p className="mb-1">Questions directrices :</p>
              <ul className="list-disc space-y-1 pl-5">
                {f.questions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </Draft>
          </section>
          )}

          {roadmapGraphe && cibles.length > 0 && (
            <figure className="panneau p-4 sm:p-5">
              <CarteHeros disposition={disposerCarte(roadmapGraphe, cibles)} />
              <figcaption className="mono mt-3">Les prérequis de ce framework, tels qu&apos;ils figurent dans la roadmap Architecte.</figcaption>
            </figure>
          )}

          {BROUILLONS_VISIBLES && (
          <section aria-labelledby="titre-usage" className="space-y-3">
            <h2 id="titre-usage" className="text-2xl font-semibold">
              Comment l&apos;utiliser
            </h2>
            <Draft titre="le mode d'emploi : à quel moment du projet, avec qui, avec quels livrables" />
          </section>
          )}

          <section aria-labelledby="titre-liees" className="space-y-3">
            <h2 id="titre-liees" className="text-2xl font-semibold">
              Compétences liées
            </h2>
            <ul className="flex flex-wrap gap-2">
              {liees.map((c) => (
                <li key={c.id}>
                  <Link href={urlNoeud(c.ref, c.id)} className="btn btn-ghost btn-sm">
                    {c.titre}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Cartouche
            titre="Fiche du framework"
            lignes={[
              ["Domaine", "Architecture de plateformes"],
              ["Compétences liées", liees.length],
              ["Statut", "En cours de rédaction"],
            ]}
          />
          {contactDisponible() && (
            <LienSuivi href="/contact" evenement="cta_clic" donnees={{ emplacement: "framework", framework: f.id }} className="btn btn-primary w-full">
              Appliquer ce framework à votre plateforme
            </LienSuivi>
          )}
        </aside>
      </div>
    </main>
  );
}
