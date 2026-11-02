import type { Metadata } from "next";
import { chargerOrientation } from "@/lib/orientation";
import { roadmapsLegeres } from "@/lib/roadmapsLegeres";
import { Reprendre } from "@/produits/reprendre";

export const metadata: Metadata = { title: "Labo : Reprendre" };

export default function Page() {
  return (
    <>
      <h1 className="text-3xl font-semibold">Reprendre</h1>
      <Reprendre
        roadmaps={roadmapsLegeres()}
        config={chargerOrientation()}
        sinon={<p>Rien à reprendre dans ce navigateur : le bloc est masqué sur l&apos;accueil. Choisissez un parcours ou marquez une compétence vue.</p>}
      />
    </>
  );
}
