import type { Metadata } from "next";
import { LaboMesure } from "@/produits/mesure";

export const metadata: Metadata = { title: "Labo : Mesure" };

export default function Page() {
  return <LaboMesure />;
}
