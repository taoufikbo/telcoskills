import type { Metadata } from "next";
import Link from "next/link";
import PageEbauche from "@/components/PageEbauche";
import { chargerFrameworks } from "@/lib/frameworks";
import { exigerRefonte } from "@/lib/refonte";

export const metadata: Metadata = {
  title: "Frameworks",
  description: "Grilles de décision pour concevoir, dimensionner et comparer des plateformes télécom.",
  robots: { index: false }, // à retirer quand les frameworks sont rédigés
};

export default function PageFrameworks() {
  exigerRefonte();
  return (
    <PageEbauche titre="Frameworks" intro="Grilles de décision pour concevoir, dimensionner et comparer des plateformes télécom.">
      <ul className="grid gap-4 sm:grid-cols-2">
        {chargerFrameworks().map((f) => (
          <li key={f.id}>
            <Link href={`/frameworks/${f.id}`} className="panneau flex h-full flex-col gap-2 p-6">
              <h2 className="text-xl font-semibold">{f.titre}</h2>
              <p style={{ color: "var(--muted)" }}>{f.sujet}</p>
            </Link>
          </li>
        ))}
      </ul>
    </PageEbauche>
  );
}
