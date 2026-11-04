import Link from "next/link";
import CarteHerosSuivie from "@/components/CarteHerosSuivie";
import ChoixEtCarte from "@/components/ChoixEtCarte";
import ConvergenceMetiers from "@/components/ConvergenceMetiers";
import DiagnosticAvecCarte from "@/components/DiagnosticAvecCarte";
import Draft from "@/components/Draft";
import { LienSuivi } from "@/produits/mesure";
import ProduitsAnimes from "@/components/ProduitsAnimes";
import Subscribe from "@/components/Subscribe";
import { INSTANCE } from "@/lib/instance";
import { TEXTES_ACCUEIL } from "@/lib/accueil-textes";
import { investissementDe } from "@/lib/palier";
import { chargerMondes, partCloud, repartition } from "@/lib/mondes";
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
  // Investissement léger, moyen ou long : la table de content/orientation.json et le palier visé de chaque compétence, comme pour le diagnostic.
  const carte = roadmapGraphe && noeudCible ? disposerCarte(roadmapGraphe, ["sriov", cibleGraphe], { investissement: investissementDe(roadmapGraphe, o.config.investissement_par_palier) }) : null;
  const diagnostic = (seulementSiPartage: boolean) => (
    <DiagnosticAvecCarte
      config={o.config}
      parcours={o.parcours}
      titresNoeuds={o.titresNoeuds}
      projets={o.projets}
      investissements={o.investissements}
      rolesSansParcours={{}}
      testables={[]}
      seulementSiPartage={seulementSiPartage}
    />
  );

  const chiffres = chiffresCatalogue({ roadmaps, projets: chargerProjets() });

  // Parcours joués en exemple sur la carte : le plus proche du cloud, un du milieu, le plus proche du télécom.
  const mondes = chargerMondes();
  const parAxe = parcoursMetier(roadmaps)
    .map((r) => ({ id: r.id, part: partCloud(repartition(r, mondes)) }))
    .sort((a, b) => b.part - a.part)
    .map((x) => x.id);
  const exemples = parAxe.length >= 3 ? [parAxe[0], parAxe[Math.floor(parAxe.length / 2)], parAxe[parAxe.length - 1]] : parAxe;

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
            <p className="max-w-3xl">{TEXTES_ACCUEIL.positionnement}</p>
            {carte && noeudCible && (
              <p className="mono">
                {nbCompetences} compétences, reliées par leurs prérequis, en {parcoursMetier(roadmaps).length} parcours par métier.
              </p>
            )}
          </div>
          {roadmapGraphe && noeudCible && carte ? (
            <SelonVisiteur
              nouveau={
                <div id={ANCRE_DIAGNOSTIC} className="scroll-mt-24">
                  <ChoixEtCarte
                    config={o.config}
                    parcours={o.parcours}
                    titresNoeuds={o.titresNoeuds}
                    investissements={o.investissements.noeuds}
                    carteParDefaut={carte}
                    legendeCarte={legendeCarte}
                    nbOutils={nbOutils}
                    exemples={exemples}
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
          <>
            <ConvergenceMetiers roadmaps={roadmaps} these={TEXTES_ACCUEIL.these} />
            <ProduitsAnimes
              nbCompetences={nbCompetences}
              nbOutils={nbOutils}
              outils={chargerLandscape().outils.map((x) => x.nom)}
              phases={chargerProjets()[0]?.phases.map((ph) => ph.titre) ?? []}
              nbRoles={chargerProjets()[0]?.roles.length ?? 0}
              competences={(roadmapGraphe?.noeuds ?? []).slice(0, 3).map((n) => n.titre)}
              blocs={[...new Set((roadmapGraphe?.noeuds ?? []).map((n) => n.bloc))]}
            />
            <Preuve chiffres={chiffres} />
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
        <section aria-labelledby="titre-contact" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="space-y-3 border-t pt-8" style={{ borderColor: "var(--filet)" }}>
            <h2 id="titre-contact" className="text-2xl font-semibold">
              {TEXTES_ACCUEIL.contact.titre}
            </h2>
            <p className="max-w-3xl" style={{ color: "var(--muted)" }}>
              {TEXTES_ACCUEIL.contact.corps}
            </p>
            {INSTANCE.auteur.linkedin ? (
              <LienSuivi href={INSTANCE.auteur.linkedin} externe evenement="contact_clic" donnees={{ canal: "linkedin", emplacement: "accueil-bas" }} className="btn btn-primary">
                {TEXTES_ACCUEIL.contact.bouton}
              </LienSuivi>
            ) : (
              <Draft titre="adresse de votre profil LinkedIn (auteur.linkedin dans src/lib/instance.ts)" />
            )}
          </div>
        </section>
      )}
    </main>
  );
}
