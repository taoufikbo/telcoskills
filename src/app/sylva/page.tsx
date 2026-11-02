import type { Metadata } from "next";
import Link from "next/link";
import LandscapeSylva from "@/components/LandscapeSylva";
import { chargerOrientation } from "@/lib/orientation";
import { exigerRefonte } from "@/lib/refonte";
import { getRoadmap } from "@/lib/roadmaps";
import { chargerSylva } from "@/lib/sylva";
import { urlRoadmap } from "@/lib/urls";
import { CarteHeros, choisirCible, disposerCarte } from "@/produits/carte-heros";

const description = "Sylva, la pile cloud télécom open source de Linux Foundation Europe : ses composants, la pile SUSE, son fonctionnement et un parcours de compétences.";
export const metadata: Metadata = { title: "Parcours Sylva", description };

function Source({ nom, url }: { nom: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
      {nom}
      <span aria-hidden> ↗</span>
      <span className="sr-only"> (s&apos;ouvre dans un nouvel onglet)</span>
    </a>
  );
}

function Faits({ faits }: { faits: { texte: string; source: { nom: string; url: string } }[] }) {
  return (
    <ul className="space-y-3">
      {faits.map((f) => (
        <li key={f.texte} className="border-l-2 pl-3" style={{ borderColor: "var(--filet)" }}>
          <p>{f.texte}</p>
          <p className="mono mt-1 text-xs">
            Source : <Source {...f.source} />
          </p>
        </li>
      ))}
    </ul>
  );
}

export default function PageSylva() {
  exigerRefonte();
  const { sylva: s, units: u } = chargerSylva();
  const roadmap = getRoadmap(s.roadmap)!;
  const heures = chargerOrientation().duree_par_niveau_heures;
  const niveaux = new Map(roadmap.noeuds.map((n) => [n.id, n.niveau]));
  // Carte : de la présentation du projet à la compétence la plus avancée qui s'appuie dessus (sans « Vous commencez ici » :
  // cette mention est réservée à la carte personnelle, après le diagnostic).
  const carte = disposerCarte(roadmap, [choisirCible(roadmap, "sylva-projet")], { heures: (id) => heures[niveaux.get(id)!] });
  const liens = Object.fromEntries(Object.entries(s.liensLandscape).map(([unit, outil]) => [unit, `/ressources/landscape?outil=${outil}`]));
  const suse = u.units.filter((x) => x.suse);

  return (
    <main className="mx-auto max-w-7xl space-y-14 px-4 py-10 sm:px-6 sm:py-14">
      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold sm:text-5xl">Parcours Sylva</h1>
        <p className="text-lg" style={{ color: "var(--muted)" }}>
          {s.intro} <span className="mono text-xs">Source : <Source {...s.sourceIntro} /></span>
        </p>
        <Link href={urlRoadmap(roadmap.id)} className="btn btn-primary">
          Ouvrir le parcours Sylva ({roadmap.noeuds.length} compétences)
        </Link>
      </header>

      <section aria-labelledby="titre-landscape" className="space-y-4">
        <div className="max-w-3xl space-y-2">
          <h2 id="titre-landscape" className="text-2xl font-semibold">
            Le landscape de Sylva
          </h2>
          <p style={{ color: "var(--muted)" }}>
            Les {u.units.length} composants intégrés à Sylva, dont {suse.length} issus de la pile SUSE (Rancher, RKE2, Longhorn, NeuVector, SUSE Edge), avec
            leur maturité dans le projet. Ceux qui figurent aussi dans le{" "}
            <Link href="/ressources/landscape" className="underline" style={{ color: "var(--fg)" }}>
              landscape général
            </Link>{" "}
            y renvoient.
          </p>
          <p className="mono text-xs">
            Source : <Source nom="sylva-core, liste des units" url={u.source} /> (lue le {u.luLe}). Le regroupement par fonction est éditorial.
          </p>
        </div>
        <LandscapeSylva units={u.units} fonctions={u.fonctions} liens={liens} />
      </section>

      <section aria-labelledby="titre-suse" className="grid gap-10 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <h2 id="titre-suse" className="text-2xl font-semibold">
            La pile SUSE dans Sylva
          </h2>
          <p style={{ color: "var(--muted)" }}>{s.suse.intro}</p>
          <Faits faits={s.suse.faits} />
        </div>
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Les {suse.length} composants SUSE et Rancher de sylva-core</h3>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Repérés par l&apos;origine de leur chart ou de leur manifeste (dépôts SUSE, Rancher, SUSE Edge ou NeuVector).
          </p>
          <ul className="flex flex-wrap gap-2">
            {suse.map((x) => (
              <li key={x.id} className="puce font-mono text-xs" title={x.description}>
                {x.id}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="titre-faits" className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 id="titre-faits" className="text-2xl font-semibold">
            Le projet
          </h2>
          <Faits faits={s.faits} />
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Comment ça fonctionne</h2>
          <Faits faits={s.fonctionnement} />
        </div>
      </section>

      <section aria-labelledby="titre-parcours" className="space-y-4">
        <div className="max-w-3xl space-y-2">
          <h2 id="titre-parcours" className="text-2xl font-semibold">
            Le parcours Sylva
          </h2>
          <p style={{ color: "var(--muted)" }}>{roadmap.presentation}</p>
          <p className="mono text-xs">
            {roadmap.blocs.length} blocs : {roadmap.blocs.join(" · ")}.
          </p>
        </div>
        <figure className="panneau p-4 sm:p-5">
          <CarteHeros disposition={carte} />
          <figcaption className="mono mt-3">
            <Link href={urlRoadmap(roadmap.id)} className="underline" style={{ color: "var(--fg)" }}>
              Voir le parcours complet : arbre, métro, liste et suivi de progression
            </Link>
          </figcaption>
        </figure>
      </section>

      <aside aria-labelledby="titre-limites" className="space-y-2 border-t pt-6" style={{ borderColor: "var(--filet)" }}>
        <h2 id="titre-limites" className="text-lg font-semibold">
          Limites
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm" style={{ color: "var(--muted)" }}>
          {s.limites.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </aside>
    </main>
  );
}
