import type { Metadata } from "next";
import PageEbauche from "@/components/PageEbauche";
import Subscribe from "@/components/Subscribe";
import { INSTANCE } from "@/lib/instance";
import { exigerRefonte } from "@/lib/refonte";

export const metadata: Metadata = {
  title: "Newsletter",
  description: "Recevoir les nouvelles roadmaps et analyses.",
  robots: INSTANCE.newsletterUrl ? undefined : { index: false },
};

export default function PageNewsletter() {
  exigerRefonte();
  return (
    <PageEbauche titre="Newsletter" intro="Recevoir les nouvelles roadmaps et analyses." enCours={!INSTANCE.newsletterUrl}>
      <Subscribe contexte="accueil" />
    </PageEbauche>
  );
}
