import fs from "node:fs";
import path from "node:path";
import type { InfoVideo } from "./formatVideo";
import { INSTANCE } from "./instance";

const DOSSIER = path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "videos");

/** Vidéo de présentation d'une roadmap, si elle a été générée (scripts/videos/generer_videos.py). */
export function infoVideo(roadmapId: string): InfoVideo | null {
  // Les vidéos actuelles sont dessinées dans la charte du site historique : l'instance publique ne les publie pas.
  if (INSTANCE.refonte) return null;
  try {
    if (!fs.existsSync(path.join(DOSSIER, `${roadmapId}.mp4`))) return null;
    const meta = JSON.parse(fs.readFileSync(path.join(DOSSIER, `${roadmapId}.json`), "utf8")) as { duree: number; credit?: string };
    return {
      src: `/videos/${roadmapId}.mp4`,
      sousTitres: `/videos/${roadmapId}.vtt`,
      affiche: `/videos/${roadmapId}.jpg`,
      duree: meta.duree,
      credit: meta.credit ?? "Voix de synthèse.",
    };
  } catch {
    return null;
  }
}
