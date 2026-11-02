import type { Metadata } from "next";
import { LaboParcours } from "@/produits/parcours";

export const metadata: Metadata = { title: "Labo : Parcours" };

export default function Page() {
  return <LaboParcours />;
}
