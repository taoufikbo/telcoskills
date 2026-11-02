import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import Subscribe from "@/components/Subscribe";
import { analysesPubliees, chargerAnalyse, estPubliee } from "@/lib/analyses";
import { INSTANCE } from "@/lib/instance";
import { exigerRefonte } from "@/lib/refonte";
import { urlAbsolue } from "@/lib/site";

export const dynamicParams = false;

export async function generateStaticParams() {
  if (!INSTANCE.refonte) return [];
  const publiees = await analysesPubliees();
  // Sans analyse publiée, Next exige tout de même un paramètre : la page répondra alors 404.
  return publiees.length > 0 ? publiees.map((a) => ({ slug: a.slug })) : [{ slug: "aucune" }];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = await chargerAnalyse(slug);
  if (!a || !estPubliee(a)) return {};
  return {
    title: a.meta.titre,
    description: a.meta.description,
    alternates: { canonical: `/analyses/${slug}` },
    openGraph: { type: "article", title: a.meta.titre, description: a.meta.description },
    robots: a.meta.brouillon ? { index: false } : undefined,
  };
}

export default async function PageAnalyse({ params }: { params: Promise<{ slug: string }> }) {
  exigerRefonte();
  const { slug } = await params;
  const a = await chargerAnalyse(slug);
  if (!a || !estPubliee(a)) notFound();
  const { Contenu, meta } = a;

  // L'auteur n'est cité dans les données structurées que si son nom est réel.
  const auteur = INSTANCE.auteur.fictif ? {} : { author: { "@type": "Person", name: INSTANCE.auteur.nom } };
  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: meta.titre,
          description: meta.description,
          inLanguage: "fr",
          url: urlAbsolue(`/analyses/${slug}`),
          ...(meta.date ? { datePublished: meta.date } : {}),
          publisher: { "@type": "Organization", name: INSTANCE.nom },
          ...auteur,
        }}
      />
      <article className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
        <Link href="/analyses" className="mono underline">
          Toutes les analyses
        </Link>
        <h1 className="mt-6 mb-8 text-4xl font-semibold sm:text-5xl">{meta.titre}</h1>
        <div className="prose-site">
          <Contenu />
        </div>
      </article>
      <Subscribe contexte="analyse" />
    </main>
  );
}
