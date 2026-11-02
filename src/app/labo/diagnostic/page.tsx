import type { Metadata } from "next";
import { proprietesOrientation } from "@/lib/orientationProps";
import { Diagnostic } from "@/produits/diagnostic";

export const metadata: Metadata = { title: "Labo : Diagnostic" };

export default function Page() {
  const o = proprietesOrientation();
  return (
    <>
      <h1 className="text-3xl font-semibold">Diagnostic</h1>
      <Diagnostic config={o.config} parcours={o.parcours} titresNoeuds={o.titresNoeuds} projets={o.projets} durees={o.durees} rolesSansParcours={{}} testables={[]} />
    </>
  );
}
