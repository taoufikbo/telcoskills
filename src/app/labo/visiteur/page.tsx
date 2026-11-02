import type { Metadata } from "next";
import { LaboVisiteur } from "@/produits/visiteur";

export const metadata: Metadata = { title: "Labo : Visiteur" };

export default function Page() {
  return <LaboVisiteur />;
}
