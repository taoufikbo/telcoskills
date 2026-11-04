import Link from "next/link";
import CarteHerosSuivie from "@/components/CarteHerosSuivie";
import ChoixEtCarte from "@/components/ChoixEtCarte";
import DiagnosticAvecCarte from "@/components/DiagnosticAvecCarte";
import Draft from "@/components/Draft";
import { LienSuivi } from "@/produits/mesure";
import Subscribe from "@/components/Subscribe";
import { contactDisponible } from "@/lib/sections";
import { proprietesOrientation } from "@/lib/orientationProps";
import { parcoursMetier } from "@/lib/rubriques";
import { chargerProjets } from "@/lib/projets";
import { chargerRoadmaps, getRoadmap } from "@/lib/roadmaps";
import { roadmapsLegeres } from "@/lib/roadmapsLegeres";
import { chargerSylva } from "@/lib/sylva";
import { BASE_ROADMAPS, urlNoeud, urlRoadmap } from "@/lib/urls";
import { disposerCarte } from "@/produits/carte-heros";
import { ANCRE_DIAGNOSTIC } from "@/produits/diagnostic";
import { chiffresCatalogue, Preuve } from "@/produits/preuve";
import { Reprendre } from "@/produits/reprendre";
import { chargerLandscape } from "@/produits/landscape";
import { SelonVisiteur } from "@/produits/visiteur";

/**
 * Accueil de l'instance publique. Aucune logique propre : il demande l'état au produit Visiteur et pose des produits.
 * - Nouveau (et rendu serveur) : le diagnostic et la carte côte à côte dans le hero (on choisit tout de suite, la carte suit les réponses),
 *   puis les chiffres du catalogue ; pas de bouton de contact en haut de page.
 * - Revenant : « Reprendre » à la place du bouton, la carte ; ni chiffres ni questionnaire (sauf résultat partagé dans l'adresse).
 * Les blocs sans donnée (phrase chiffrée de la bascule, nouveautés) ne sont pas affichés.
 */
export default function AccueilRefonte() {
  const roadmaps = chargerRoadmaps();
  const roadmapGraphe = roadmaps.find((r) => r.id === "ingenieur-caas-telco");
  const cibleGraphe = "ocp-rds";
  const noeudCible = roadmapGraphe?.noeuds.find((n) => n.id === cibleGraphe);
  const o = proprietesOrientation();
  const sylva = chargerSylva();
  const nbOutils = chargerLandscape().outils.length;
  // Compétences des parcours métier : la phrase les rattache à ces parcours (Sylva a son onglet à part).
  const nbCompetences = new Set(parcoursMetier(roadmaps).flatMap((r) => r.noeuds.map((n) => n.id))).size;
  const niveaux = new Map(roadmapGraphe?.noeuds.map((n) => [n.id, n.niveau]));
  // Heures : l'hypothèse éditoriale de content/orientation.json (par niveau), la même que celle du diagnostic.
  const carte = roadmapGraphe && noeudCible ? disposerCarte(roadmapGraphe, ["sriov", cibleGraphe], { heures: (id) => o.config.duree_par_niveau_heures[niveaux.get(id)!] }) : null;
  const diagnostic = (seulementSiPartage: boolean) => (
    <DiagnosticAvecCarte
      config={o.config}
      parcours={o.parcours}
      titresNoeuds={o.titresNoeuds}
      projets={o.projets}
      durees={o.durees}
      rolesSansParcours={{}}
      testables={[]}
      seulementSiPartage={seulementSiPartage}
    />
  );

  const chiffres = chiffresCatalogue({ roadmaps, projets: chargerProjets() });

  const legendeCarte =
    roadmapGraphe && noeudCible && carte ? (
      <figcaption className="mono mt-3">
        Ce qu&apos;il faut maîtriser avant{" "}
        <Link href={urlNoeud(roadmapGraphe.id, noeudCible.id)} className="underline" style={{ color: "var(--fg)" }}>
          {noeudCible.titre}
        </Link>{" "}
        : {carte.noeuds.find((n) => n.cible)!.amont.length} compétences.
      </figcaption>
    ) : null;

  const boutonDiagnostic = (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <LienSuivi href={`#${ANCRE_DIAGNOSTIC}`} evenement="cta_clic" donnees={{ emplacement: "accueil-diagnostic" }} className="btn btn-primary">
        Choisir son parcours
      </LienSuivi>
      <Link href={BASE_ROADMAPS} className="underline underline-offset-4">
        Explorer les roadmaps
      </Link>
    </div>
  );

  return (
    <main>
      <section aria-labelledby="titre-accueil">
        <div className="mx-auto max-w-6xl space-y-8 px-4 pb-14 pt-10 sm:px-6 lg:pb-20 lg:pt-14">
          <div className="max-w-3xl space-y-3">
            <h1 id="titre-accueil" className="text-3xl font-semibold leading-tight sm:text-4xl">
              Architecture de plateformes télécom : cloud, 5G et IA.
            </h1>
            {carte && noeudCible && (
              <p style={{ color: "var(--muted)" }}>
                {nbCompetences} compétences, reliées par leurs prérequis, en {parcoursMetier(roadmaps).length} parcours par métier. Choisissez votre parcours en trois questions : la carte
                se redessine avec votre chemin.
              </p>
            )}
            <Draft titre="positionnement : le problème que vous résolvez, en une phrase" />
            <Draft titre="thèse centrale, en deux ou trois lignes" />
          </div>
          {roadmapGraphe && noeudCible && carte ? (
            <SelonVisiteur
              nouveau={
                <div id={ANCRE_DIAGNOSTIC} className="scroll-mt-24">
                  <ChoixEtCarte
                    config={o.config}
                    parcours={o.parcours}
                    titresNoeuds={o.titresNoeuds}
                    projets={o.projets}
                    durees={o.durees}
                    rolesSansParcours={{}}
                    testables={[]}
                    carteParDefaut={carte}
                    legendeCarte={legendeCarte}
                    nbOutils={nbOutils}
                  />
                </div>
              }
              revenant={
                <div className="grid items-center gap-10 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                  <Reprendre roadmaps={roadmapsLegeres()} config={o.config} sinon={boutonDiagnostic} />
                  <figure className="panneau w-full max-w-3xl p-4 sm:p-5 xl:max-w-none">
                    <CarteHerosSuivie defaut={carte} config={o.config} legendeDefaut={legendeCarte} />
                    <p className="mono mt-3 border-t pt-3" style={{ borderColor: "var(--filet)" }}>
                      Et les outils ?{" "}
                      <Link href="/ressources/landscape" className="underline" style={{ color: "var(--fg)" }}>
                        {nbOutils} outils de la pile, par rôle : voir le landscape
                      </Link>
                    </p>
                  </figure>
                </div>
              }
            />
          ) : (
            boutonDiagnostic
          )}
          {/* Sans JavaScript, et pour qui sait déjà : les parcours sont aussi des liens directs. */}
          <nav aria-label="Parcours par métier" className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <span className="mono">Ou directement :</span>
            {parcoursMetier(roadmaps).map((r) => (
              <Link key={r.id} href={urlRoadmap(r.id)} className="text-sm underline underline-offset-4">
                {r.titre}
              </Link>
            ))}
            <Link href={BASE_ROADMAPS} className="mono underline underline-offset-4">
              Tout explorer
            </Link>
          </nav>
        </div>
      </section>

      <SelonVisiteur
        nouveau={
          <Preuve chiffres={chiffres} />
        }
        revenant={
          <div id={ANCRE_DIAGNOSTIC} className="mx-auto max-w-4xl scroll-mt-24 px-4 py-16 empty:hidden sm:px-6">
            {diagnostic(true)}
          </div>
        }
      />

      <section aria-labelledby="titre-sylva" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="panneau grid gap-4 p-6 sm:p-8 md:grid-cols-[1.5fr_1fr] md:items-center">
          <div className="space-y-2">
            <p className="mono">Parcours dédié</p>
            <h2 id="titre-sylva" className="text-2xl font-semibold">
              Découvrez Sylva
            </h2>
            <p style={{ color: "var(--muted)" }}>
              La pile cloud télécom open source de Linux Foundation Europe : {sylva.units.units.length} composants, dont {sylva.units.units.filter((u) => u.suse).length} de la pile
              SUSE, et un parcours de {getRoadmap(sylva.sylva.roadmap)?.noeuds.length} compétences pour la déployer et l&apos;opérer.
            </p>
          </div>
          <p className="md:text-right">
            <Link href="/sylva" className="underline underline-offset-4" style={{ color: "var(--fg)" }}>
              Découvrir le parcours Sylva →
            </Link>
          </p>
        </div>
      </section>

      <Subscribe />

      {contactDisponible() && (
        <section aria-labelledby="titre-offre" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="space-y-3 border-t pt-8" style={{ borderColor: "var(--filet)" }}>
            <h2 id="titre-offre" className="text-2xl font-semibold">
              Parler de votre plateforme
            </h2>
            <Draft titre="offre d'entrée : pour qui, situation déclenchante, durée" />
            <p style={{ color: "var(--muted)" }}>
              Un échange pour cadrer votre situation et voir si je peux vous aider.{" "}
              <LienSuivi href="/contact" evenement="cta_clic" donnees={{ emplacement: "accueil-bas" }} className="underline underline-offset-4" style={{ color: "var(--fg)" }}>
                Prendre contact
              </LienSuivi>
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
