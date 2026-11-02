import type { Metadata } from "next";
import Link from "next/link";
import Draft from "@/components/Draft";
import { INSTANCE } from "@/lib/instance";
import { LIBELLE_DEMANDE } from "@/lib/libelles";
import { chargerRoadmaps } from "@/lib/roadmaps";
import { DEMANDES } from "@/lib/schema";
import { LIBELLE_DEMANDE_COURT, STYLE_DEMANDE } from "@/lib/styles";
import { urlRoadmap } from "@/lib/urls";

export const metadata: Metadata = {
  title: "À propos",
  description: `Comment sont construites les roadmaps ${INSTANCE.nom} et comment lire l'indicateur de demande.`,
};

export default function APropos() {
  const roadmaps = chargerRoadmaps();
  const legende = roadmaps[0].legende_demande;

  return (
    <main className="mx-auto max-w-2xl space-y-8 p-4 leading-relaxed sm:p-6">
      <h1 className="text-2xl font-bold">{INSTANCE.refonte ? "À propos" : "À propos : la méthode"}</h1>

      {INSTANCE.refonte && (
        <section className="space-y-3" aria-labelledby="titre-auteur">
          <h2 id="titre-auteur" className="text-lg font-semibold">
            Qui écrit ici
          </h2>
          {!INSTANCE.auteur.fictif && <p className="font-medium">{INSTANCE.auteur.nom}</p>}
          {INSTANCE.auteur.bioCourte ? <p>{INSTANCE.auteur.bioCourte}</p> : <Draft titre="présentation de l'auteur en deux phrases : domaine d'intervention et ce qui le rend crédible" />}
          {INSTANCE.auteur.linkedin && (
            <p>
              <a href={INSTANCE.auteur.linkedin} className="underline" target="_blank" rel="noopener noreferrer">
                Profil LinkedIn
              </a>
            </p>
          )}
        </section>
      )}

      {INSTANCE.refonte && <h2 className="pt-4 text-xl font-semibold">La méthode des roadmaps</h2>}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">D&apos;où viennent les roadmaps</h2>
        <p>
          Une roadmap peut partir d&apos;offres d&apos;emploi réelles : on relève les compétences demandées, on les regroupe
          en blocs thématiques, puis on ordonne les nœuds grâce à leurs prérequis. D&apos;autres sont rédigées à partir
          des spécifications et de la pratique du domaine : leur source est précisée plus bas. Chaque nœud indique un
          niveau (fondamental, intermédiaire, avancé ou transverse), un résumé, des ressources ouvertes et parfois un
          projet pratique.
        </p>
        <p>
          Ce sont des synthèses faites à la main, pas des référentiels officiels. Elles vous aident à choisir quoi
          apprendre et dans quel ordre, pas à valider un cursus.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Lire l&apos;indicateur de demande</h2>
        <ul className="space-y-2">
          {DEMANDES.map((d) => (
            <li key={d} className="flex items-start gap-3">
              <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${STYLE_DEMANDE[d]}`}>
                {LIBELLE_DEMANDE_COURT[d]}
              </span>
              <span>
                <strong>{LIBELLE_DEMANDE[d]}</strong> : {legende[d]}.
              </span>
            </li>
          ))}
        </ul>
        <p className="border-l-4 border-orange bg-slate-100 p-3 text-sm text-black dark:bg-slate-900 dark:text-white">
          <strong>Un ordre de grandeur, pas une statistique.</strong> L&apos;échantillon est petit et daté, donc
          non représentatif du marché. Une compétence « faible » peut être décisive dans un poste précis ;
          une compétence « forte » peut être déjà acquise dans votre équipe. Une roadmap qui ne vient pas d&apos;offres d&apos;emploi n&apos;affiche aucune demande.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Sources des roadmaps</h2>
        <ul className="space-y-3">
          {roadmaps.map((r) => (
            <li key={r.id}>
              <Link href={urlRoadmap(r.id)} className="font-medium underline">
                {r.titre}
              </Link>{" "}
              <span className="text-sm text-slate-500">(version {r.version})</span>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{r.source}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Votre progression</h2>
        <p>
          Elle est enregistrée uniquement dans votre navigateur (localStorage) : pas de compte, rien n&apos;est envoyé
          à un serveur. Pensez à l&apos;exporter en JSON pour la sauvegarder ou la changer d&apos;appareil.
        </p>
      </section>
    </main>
  );
}
