import type { Metadata } from "next";
import Draft from "@/components/Draft";
import PageEbauche from "@/components/PageEbauche";
import { INSTANCE } from "@/lib/instance";
import { exigerRefonte } from "@/lib/refonte";

export const metadata: Metadata = {
  title: "Confidentialité",
  description: "Les données que ce site collecte, et celles qu'il ne collecte pas.",
  robots: { index: false }, // à retirer quand le responsable de traitement est renseigné
};

export default function Confidentialite() {
  exigerRefonte();
  return (
    <PageEbauche titre="Confidentialité" intro="Les données que ce site collecte, et celles qu'il ne collecte pas." enCours={false}>
      <div className="prose-site">
        <h2>Ce qui reste dans votre navigateur</h2>
        <p>
          Votre progression dans les roadmaps, vos réponses au questionnaire « Par où commencer ? » et votre choix de thème clair ou sombre sont enregistrés
          uniquement dans votre navigateur (stockage local). Ils ne sont envoyés à aucun serveur. Le diagnostic d&apos;équipe calcule son résultat dans votre
          navigateur et n&apos;enregistre rien.
        </p>
        <h2>Mesure d&apos;audience</h2>
        <p>
          {INSTANCE.nom} mesure la fréquentation avec Vercel Web Analytics : des statistiques agrégées sur les pages vues et les clics sur les boutons
          principaux. Ce service n&apos;utilise pas de cookie. Aucune publicité, aucun traceur publicitaire.
        </p>
        <h2>Prise de contact et newsletter</h2>
        <p>
          Quand vous réservez un créneau ou vous abonnez à la newsletter, vous quittez ce site : les services concernés (prise de rendez-vous, envoi de la
          newsletter) traitent vos données selon leurs propres règles.
        </p>
        <Draft titre="nom du service de réservation et du service de newsletter, finalité, durée de conservation, droits d'accès et de suppression, adresse pour les exercer" />
        <h2>Responsable du traitement</h2>
        <Draft titre="identité et coordonnées du responsable de traitement" />
      </div>
    </PageEbauche>
  );
}
