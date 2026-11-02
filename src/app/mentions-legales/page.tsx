import type { Metadata } from "next";
import Draft from "@/components/Draft";
import PageEbauche from "@/components/PageEbauche";
import { exigerRefonte } from "@/lib/refonte";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Éditeur, hébergeur et propriété intellectuelle du site.",
  robots: { index: false }, // à retirer quand les informations d'éditeur sont renseignées
};

export default function MentionsLegales() {
  exigerRefonte();
  return (
    <PageEbauche titre="Mentions légales" intro="Éditeur, hébergeur et propriété intellectuelle du site." enCours={false}>
      <div className="prose-site">
        <h2>Éditeur du site</h2>
        <Draft titre="nom ou raison sociale, statut juridique, adresse, adresse e-mail de contact, numéro d'immatriculation le cas échéant" />
        <h2>Directeur de la publication</h2>
        <Draft titre="nom du responsable de la publication" />
        <h2>Hébergeur</h2>
        <p>Le site est hébergé par Vercel Inc., aux États-Unis.</p>
        <Draft titre="adresse complète de l'hébergeur, à reprendre depuis ses conditions officielles" />
        <h2>Propriété intellectuelle</h2>
        <Draft titre="licence du contenu (par exemple CC BY-NC-SA 4.0) et conditions de réutilisation des roadmaps" />
        <p>Les ressources externes citées dans les roadmaps restent la propriété de leurs auteurs ; les liens renvoient vers leurs sources d&apos;origine.</p>
      </div>
    </PageEbauche>
  );
}
