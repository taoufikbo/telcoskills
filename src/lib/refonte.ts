import { notFound } from "next/navigation";
import { INSTANCE } from "./instance";

/** Les pages de la nouvelle arborescence n'existent que sur l'instance publique : ailleurs, 404. */
export function exigerRefonte() {
  if (!INSTANCE.refonte) notFound();
}
