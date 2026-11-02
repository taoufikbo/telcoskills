import { imageOg, TAILLE_OG } from "@/lib/imageOg";
import { INSTANCE } from "@/lib/instance";

export const alt = INSTANCE.nom;
export const size = TAILLE_OG;
export const contentType = "image/png";

export default function Image() {
  return imageOg("Roadmaps de compétences pour le cloud télécom", "Parcours par métier, projet fil rouge du design à la production");
}
