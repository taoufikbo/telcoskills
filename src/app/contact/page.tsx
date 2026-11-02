import type { Metadata } from "next";
import Draft from "@/components/Draft";
import { LienSuivi } from "@/produits/mesure";
import PageEbauche from "@/components/PageEbauche";
import { INSTANCE } from "@/lib/instance";
import { exigerRefonte } from "@/lib/refonte";

export const metadata: Metadata = {
  title: "Contact",
  description: "Prendre rendez-vous pour parler de votre plateforme.",
};

export default function PageContact() {
  exigerRefonte();
  const { calendlyUrl, email } = INSTANCE.contact;
  const pret = Boolean(calendlyUrl || email);
  return (
    <PageEbauche titre="Contact" intro="Prendre rendez-vous pour parler de votre plateforme." enCours={!pret}>
      {calendlyUrl && (
        <div className="panneau space-y-3 p-6">
          <h2 className="text-xl font-semibold">Réserver un créneau</h2>
          <p style={{ color: "var(--muted)" }}>Choisissez un horaire qui vous convient : la réservation se fait sur Calendly, vous quittez ce site.</p>
          <LienSuivi href={calendlyUrl} externe evenement="contact_clic" donnees={{ canal: "calendly" }} className="btn btn-primary">
            Réserver un créneau
          </LienSuivi>
        </div>
      )}
      {!calendlyUrl && <Draft titre="lien de réservation Calendly (champ contact.calendlyUrl de src/lib/instance.ts)" />}
      {email && (
        <p>
          Ou par e-mail :{" "}
          <LienSuivi href={`mailto:${email}`} externe evenement="contact_clic" donnees={{ canal: "email" }} className="underline">
            {email}
          </LienSuivi>
        </p>
      )}
    </PageEbauche>
  );
}
