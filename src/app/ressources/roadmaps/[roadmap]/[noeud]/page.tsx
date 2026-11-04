import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Cartouche from "@/components/Cartouche";
import FichePratique from "@/components/FichePratique";
import Draft, { BROUILLONS_VISIBLES } from "@/components/Draft";
import JsonLd from "@/components/JsonLd";
import { LienSuivi } from "@/produits/mesure";
import Subscribe from "@/components/Subscribe";
import SommaireParcours from "@/components/SommaireParcours";
import { competenceLd, filAriane } from "@/lib/donneesStructurees";
import { frameworksDuNoeud } from "@/lib/frameworks";
import { INSTANCE } from "@/lib/instance";
import { estNoeudDeJugement } from "@/lib/jugement";
import { LIBELLE_NIVEAU, LIBELLE_RESSOURCE } from "@/lib/libelles";
import { dependants, occurrencesDuNoeud, roadmapDeReference } from "@/lib/noeuds";
import { chargerOrientation } from "@/lib/orientation";
import { DEFINITION_PALIER, LIBELLE_INVESTISSEMENT, investissementNoeud } from "@/lib/palier";
import { grouperParEtape } from "@/lib/ressources-etapes";
import { lienCorrection } from "@/lib/contribution";
import { chargerProjets } from "@/lib/projets";
import { exigerRefonte } from "@/lib/refonte";
import { contactDisponible, frameworksRediges } from "@/lib/sections";
import { chargerRoadmaps, getRoadmap } from "@/lib/roadmaps";
import { parcoursMetier, rubriqueThematique } from "@/lib/rubriques";
import { BASE_ROADMAPS, urlNoeud, urlRoadmap } from "@/lib/urls";
import { ANCRE_DIAGNOSTIC } from "@/produits/diagnostic";
import { SelonVisiteur } from "@/produits/visiteur";

export const dynamicParams = false;

export function generateStaticParams() {
  if (!INSTANCE.refonte) return [];
  return chargerRoadmaps().flatMap((r) => r.noeuds.map((n) => ({ roadmap: r.id, noeud: n.id })));
}

type Params = Promise<{ roadmap: string; noeud: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { roadmap: roadmapId, noeud: noeudId } = await params;
  const roadmap = getRoadmap(roadmapId);
  const noeud = roadmap?.noeuds.find((n) => n.id === noeudId);
  if (!roadmap || !noeud) return {};
  const reference = roadmapDeReference(chargerRoadmaps(), noeudId, chargerOrientation().ordre) ?? roadmapId;
  const titre = `${noeud.titre} · ${roadmap.titre}`;
  return {
    title: titre,
    description: noeud.resume,
    // Une compétence partagée a une page par roadmap : la roadmap de référence porte l'adresse canonique.
    alternates: { canonical: urlNoeud(reference, noeudId) },
    openGraph: { title: titre, description: noeud.resume, type: "article" },
  };
}

export default async function PageNoeud({ params }: { params: Params }) {
  exigerRefonte();
  const { roadmap: roadmapId, noeud: noeudId } = await params;
  const roadmap = getRoadmap(roadmapId);
  const noeud = roadmap?.noeuds.find((n) => n.id === noeudId);
  if (!roadmap || !noeud) notFound();

  const toutes = chargerRoadmaps();
  const ordre = chargerOrientation().ordre;
  const parId = new Map(roadmap.noeuds.map((n) => [n.id, n]));
  const prerequis = noeud.prerequis.map((id) => parId.get(id)).filter((n) => n !== undefined);
  const suites = dependants(roadmap, noeud.id);
  const ailleurs = occurrencesDuNoeud(toutes, noeud.id, ordre).filter((o) => o.roadmap.id !== roadmap.id);
  const frameworks = frameworksDuNoeud(noeud.id);
  const jugement = estNoeudDeJugement(noeud.id);
  const reference = roadmapDeReference(toutes, noeud.id, ordre) ?? roadmap.id;
  const nbCompetences = new Set(parcoursMetier(toutes).flatMap((r) => r.noeuds.map((n) => n.id))).size;
  // Parcours thématique (Sylva) : rattaché à son onglet, à part des roadmaps métier.
  const rubrique = rubriqueThematique(roadmap.id);
  const parent = rubrique ? { nom: rubrique.nom, chemin: rubrique.href } : { nom: "Roadmaps", chemin: BASE_ROADMAPS };

  const investissement = investissementNoeud(chargerOrientation().investissement_par_palier, noeud);

  const projetFilRouge = chargerProjets()[0];
  const lienProjet = noeud.pratique?.lienProjet;
  const libellesProjet =
    lienProjet && projetFilRouge
      ? {
          phase: projetFilRouge.phases.find((x) => x.id === lienProjet.phase)?.titre ?? lienProjet.phase,
          role: projetFilRouge.roles.find((x) => x.id === lienProjet.role)?.libelle ?? lienProjet.role,
        }
      : undefined;

  const sommaire = (
    <SommaireParcours
      roadmap={{ id: roadmap.id, blocs: roadmap.blocs, noeuds: roadmap.noeuds.map(({ id, titre, bloc, niveau, cible }) => ({ id, titre, bloc, niveau, cible })) }}
      titre={roadmap.titre}
      table={chargerOrientation().investissement_par_palier}
      courant={noeud.id}
    />
  );

  return (
    <main className="mx-auto max-w-[88rem] px-4 py-10 sm:px-6 sm:py-14">
      <JsonLd data={competenceLd(noeud, roadmap, urlNoeud(reference, noeud.id), urlRoadmap(roadmap.id))} />
      <JsonLd
        data={filAriane([
          { nom: INSTANCE.nom, chemin: "/" },
          parent,
          { nom: roadmap.titre, chemin: urlRoadmap(roadmap.id) },
          { nom: noeud.titre, chemin: urlNoeud(roadmap.id, noeud.id) },
        ])}
      />
      <nav aria-label="Fil d'Ariane" className="mono mb-8">
        {!rubrique && (
          <>
            <Link href="/ressources" className="underline">
              Ressources
            </Link>
            {" / "}
          </>
        )}
        <Link href={parent.chemin} className="underline">
          {parent.nom}
        </Link>
        {" / "}
        <Link href={urlRoadmap(roadmap.id)} className="underline">
          {roadmap.titre}
        </Link>
      </nav>

      {/* Arrivée par un lien : situer la page, puis proposer le diagnostic. Masqué dès que le visiteur a un parcours ou une progression. */}
      <SelonVisiteur
        nouveau={
          rubrique ? (
            <p className="-mt-4 mb-8 max-w-3xl border-l-2 pl-3 text-sm" style={{ borderColor: "var(--filet)", color: "var(--muted)" }} data-contexte>
              Cette compétence fait partie du{" "}
              <Link href={urlRoadmap(roadmap.id)} className="underline" style={{ color: "var(--fg)" }}>
                {roadmap.titre}
              </Link>{" "}
              ({roadmap.noeuds.length} compétences).{" "}
              <Link href={rubrique.href} className="underline" style={{ color: "var(--fg)" }}>
                Découvrir la rubrique {rubrique.nom} : le projet, son landscape et la pile SUSE
              </Link>
              .
            </p>
          ) : (
            <p className="-mt-4 mb-8 max-w-3xl border-l-2 pl-3 text-sm" style={{ borderColor: "var(--filet)", color: "var(--muted)" }} data-contexte>
              Cette compétence fait partie de la roadmap{" "}
              <Link href={urlRoadmap(roadmap.id)} className="underline" style={{ color: "var(--fg)" }}>
                {roadmap.titre}
              </Link>{" "}
              ({roadmap.noeuds.length} compétences). {INSTANCE.nom} cartographie {nbCompetences} compétences du cloud télécom en {parcoursMetier(toutes).length}{" "}
              parcours par métier.{" "}
              <Link href={`/#${ANCRE_DIAGNOSTIC}`} className="underline" style={{ color: "var(--fg)" }}>
                Trouver votre point de départ en trois questions
              </Link>
              .
            </p>
          )
        }
        revenant={null}
      />

      <div className="grid gap-10 lg:grid-cols-[17rem_minmax(0,1fr)_17rem]">
        {/* Mode apprentissage : le programme du parcours à gauche (replié sur mobile), la compétence au centre, sa fiche à droite. */}
        <div className="lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto">
          <details className="lg:hidden">
            <summary className="btn btn-ghost btn-sm w-full cursor-pointer justify-center">Programme du parcours</summary>
            <div className="pt-4">{sommaire}</div>
          </details>
          <div className="hidden lg:block">{sommaire}</div>
        </div>
        <article className="min-w-0 space-y-10">
          <header className="space-y-4">
            <h1 className="text-4xl font-semibold sm:text-5xl">{noeud.titre}</h1>
            <p className="max-w-2xl text-lg" style={{ color: "var(--muted)" }}>
              {noeud.resume}
            </p>
          </header>

          {(prerequis.length > 0 || suites.length > 0) && (
            <section aria-labelledby="titre-liens" className="space-y-3">
              <h2 id="titre-liens" className="text-2xl font-semibold">
                Dans la roadmap
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {prerequis.length > 0 && (
                  <div className="panneau p-5">
                    <h3 className="mono mb-2">Prérequis</h3>
                    <ul className="space-y-1.5">
                      {prerequis.map((n) => (
                        <li key={n.id}>
                          <Link href={urlNoeud(roadmap.id, n.id)} className="underline underline-offset-4">
                            {n.titre}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {suites.length > 0 && (
                  <div className="panneau p-5">
                    <h3 className="mono mb-2">Débloque</h3>
                    <ul className="space-y-1.5">
                      {suites.map((n) => (
                        <li key={n.id}>
                          <Link href={urlNoeud(roadmap.id, n.id)} className="underline underline-offset-4">
                            {n.titre}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {noeud.pratique && <FichePratique noeudId={noeud.id} pratique={noeud.pratique} projet={libellesProjet} cible={noeud.cible} />}

          {noeud.ressources.length > 0 && (
            <section aria-labelledby="titre-ressources" className="space-y-3">
              <h2 id="titre-ressources" className="text-2xl font-semibold">
                Ressources
              </h2>
              <div className="space-y-5">
                {grouperParEtape(noeud.ressources).map((g) => (
                  <div key={g.libelle} className="space-y-2">
                    <h3 className="text-lg font-semibold">{g.libelle}</h3>
                    <ul className="panneau divide-y" style={{ borderColor: "var(--filet)" }}>
                      {g.items.map((r) => (
                        <li key={r.url ?? r.nom} className="p-4" style={{ borderColor: "var(--filet)" }}>
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-4">
                            {r.nom}
                          </a>
                          <p className="mono mt-1">{[LIBELLE_RESSOURCE[r.type] ?? r.type, r.acces, r.langue?.toUpperCase(), r.auteur].filter(Boolean).join(" · ")}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(noeud.avis || (jugement && BROUILLONS_VISIBLES)) && (
            <section aria-labelledby="titre-avis" className="space-y-3">
              <h2 id="titre-avis" className="text-2xl font-semibold">
                Avis d&apos;architecte
              </h2>
              {noeud.avis ? (
                <p className="prose-site">{noeud.avis}</p>
              ) : (
                <Draft titre={`votre avis sur « ${noeud.titre} » : ce que vous recommandez, et pourquoi`} />
              )}
            </section>
          )}

          {ailleurs.length > 0 && (
            <section aria-labelledby="titre-ailleurs" className="space-y-3">
              <h2 id="titre-ailleurs" className="text-2xl font-semibold">
                Aussi dans
              </h2>
              <ul className="flex flex-wrap gap-2">
                {ailleurs.map((o) => (
                  <li key={o.roadmap.id}>
                    <Link href={urlNoeud(o.roadmap.id, noeud.id)} className="btn btn-ghost btn-sm">
                      {o.roadmap.titre}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Cartouche
            titre="Fiche de la compétence"
            lignes={[
              ["Bloc", noeud.bloc],
              ["Niveau", LIBELLE_NIVEAU[noeud.niveau]],
              ...((noeud.cible !== undefined
                ? [
                    ["Palier visé", `${noeud.cible} sur 5`],
                    ...(investissement !== undefined ? [["Investissement", LIBELLE_INVESTISSEMENT[investissement]]] : []),
                  ]
                : []) as [string, string | number][]),
              ["Prérequis", prerequis.length],
              ["Ressources", noeud.ressources.length],
              ["Roadmaps", ailleurs.length + 1],
            ]}
          >
            {noeud.cible !== undefined && (
              <p className="mb-3 text-xs" style={{ color: "var(--muted)" }}>
                <strong style={{ color: "var(--fg)" }}>Palier {noeud.cible}</strong> pour ce métier : {DEFINITION_PALIER[noeud.cible as 1 | 2 | 3 | 4 | 5]}. Le palier dépend du métier : la même compétence peut être visée plus haut dans un autre parcours.
              </p>
            )}
            <Link href={`${urlRoadmap(roadmap.id)}?noeud=${noeud.id}`} className="btn btn-ghost btn-sm w-full">
              Voir dans la roadmap
            </Link>
          </Cartouche>

          {lienCorrection(roadmap.id, noeud.id, noeud.titre) && (
            <p className="mono text-xs">
              Une erreur, une ressource à ajouter ?{" "}
              <a href={lienCorrection(roadmap.id, noeud.id, noeud.titre)!} target="_blank" rel="noopener noreferrer" className="underline">
                Proposer une correction sur GitHub
              </a>
            </p>
          )}

          {frameworks.length > 0 && frameworksRediges() && (
            <div className="panneau space-y-2 p-5">
              <h2 className="mono">{frameworks.length > 1 ? "Frameworks associés" : "Framework associé"}</h2>
              <ul className="space-y-1.5">
                {frameworks.map((f) => (
                  <li key={f.id}>
                    <Link href={`/frameworks/${f.id}`} className="font-medium underline underline-offset-4">
                      {f.titre}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {jugement && contactDisponible() && (
            <LienSuivi href="/contact" evenement="cta_clic" donnees={{ emplacement: "noeud", noeud: noeud.id }} className="btn btn-primary w-full">
              Appliquer ce framework à votre plateforme
            </LienSuivi>
          )}
        </aside>
      </div>

      {!jugement && <Subscribe contexte="roadmap" />}
    </main>
  );
}
