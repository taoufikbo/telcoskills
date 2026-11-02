import type { Metadata } from "next";
import { LaboConsentement } from "@/produits/consentement";

export const metadata: Metadata = { title: "Labo : Consentement" };

export default function Page() {
  return <LaboConsentement />;
}
