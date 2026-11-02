import Link from "next/link";
import CarteHerosSuivie from "@/components/CarteHerosSuivie";
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
import { BASE_ROADMAPS, urlNoeud } from "@/lib/urls";
import { disposerCarte } from "@/produits/carte-heros";
import { ANCRE_DIAGNOSTIC } from "@/produits/diagnostic";
import { chiffresCatalogue, Preuve } from "@/produits/preuve";
import { Reprendre } from "@/produits/reprendre";
import { chargerLandscape } from "@/produits/landscape";
import { SelonVisiteur } from "@/produits/visiteur";

/**
 * Accueil de l'instance publique. Aucune logique propre : il demande l'état au produit Visiteur et pose des produits.
 * - Nouveau (et rendu serveur) : la carte, les chiffres du catalogue, le diagnostic ; un seul bouton principal, « Faire le diagnostic ».
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
      <section>
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-14 sm:px-6 lg:pb-24 lg:pt-20 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="space-y-7">
            <h1 className="text-5xl font-semibold leading-[1.02] sm:text-6xl">
              Architecture de plateformes télécom : cloud, 5G et IA.
            </h1>
            {carte && noeudCible && (
              <p className="max-w-xl text-lg" style={{ color: "var(--muted)" }}>
                {nbCompetences} compétences, reliées par leurs prérequis, en {parcoursMetier(roadmaps).length} parcours par métier. Choisissez votre parcours en trois questions : la carte
                se redessine avec votre chemin.
              </p>
            )}
            <Draft titre="positionnement : le problème que vous résolvez, en une phrase" />
            <Draft titre="thèse centrale, en deux ou trois lignes" />
            <SelonVisiteur
              nouveau={boutonDiagnostic}
              revenant={<Reprendre roadmaps={roadmapsLegeres()} config={o.config} sinon={boutonDiagnostic} />}
            />
          </div>
          {roadmapGraphe && noeudCible && carte && (
            <figure className="panneau w-full max-w-3xl p-4 sm:p-5 xl:max-w-none">
              <CarteHerosSuivie
                defaut={carte}
                config={o.config}
                legendeDefaut={
                  <figcaption className="mono mt-3">
                    Ce qu&apos;il faut maîtriser avant{" "}
                    <Link href={urlNoeud(roadmapGraphe.id, noeudCible.id)} className="underline" style={{ color: "var(--fg)" }}>
                      {noeudCible.titre}
                    </Link>{" "}
                    : {carte.noeuds.find((n) => n.cible)!.amont.length} compétences.
                  </figcaption>
                }
              />
              <p className="mono mt-3 border-t pt-3" style={{ borderColor: "var(--filet)" }}>
                Et les outils ?{" "}
                <Link href="/ressources/landscape" className="underline" style={{ color: "var(--fg)" }}>
                  {nbOutils} outils de la pile, par rôle : voir le landscape
                </Link>
              </p>
            </figure>
          )}
        </div>
      </section>

      <SelonVisiteur
        nouveau={
          <>
            <Preuve chiffres={chiffres} />
            <div id={ANCRE_DIAGNOSTIC} className="mx-auto max-w-4xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20">
              {diagnostic(false)}
            </div>
          </>
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
