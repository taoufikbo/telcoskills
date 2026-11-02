import type { Metadata } from "next";
import Link from "next/link";
import Draft from "@/components/Draft";
import PageEbauche from "@/components/PageEbauche";
import { exigerRefonte } from "@/lib/refonte";
import { contactDisponible } from "@/lib/sections";

export const metadata: Metadata = {
  title: "Offres",
  description: "Façons de travailler ensemble sur votre plateforme.",
  robots: { index: false }, // à retirer quand les offres sont rédigées
};

/** Rubriques de chaque offre d'entrée : l'auteur rédige le contenu, la structure est imposée. */
const RUBRIQUES = ["Pour qui", "Situation déclenchante", "Livrables", "Durée", "Ce qui n'est pas inclus"] as const;

export default function PageOffres() {
  exigerRefonte();
  return (
    <PageEbauche titre="Offres" intro="Façons de travailler ensemble sur votre plateforme.">
      <div className="grid gap-4">
        {[1, 2, 3].map((n) => (
          <article key={n} className="panneau space-y-3 p-6" aria-labelledby={`offre-${n}`}>
            <h2 id={`offre-${n}`} className="text-xl font-semibold">
              Offre d&apos;entrée {n}
            </h2>
            <Draft titre="intitulé et promesse de l'offre, en une phrase" />
            <dl className="grid gap-3 sm:grid-cols-2">
              {RUBRIQUES.map((r) => (
                <div key={r}>
                  <dt className="mono">{r}</dt>
                  <dd>
                    <Draft titre={r.toLowerCase()} />
                  </dd>
                </div>
              ))}
            </dl>
            {contactDisponible() && (
              <Link href="/contact" className="btn btn-ghost btn-sm">
                Parler de cette offre
              </Link>
            )}
          </article>
        ))}
      </div>
    </PageEbauche>
  );
}
