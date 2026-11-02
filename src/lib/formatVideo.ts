export type InfoVideo = { src: string; sousTitres: string; affiche: string; duree: number; credit: string };

export function formaterDuree(secondes: number): string {
  const m = Math.floor(secondes / 60);
  const s = Math.round(secondes % 60);
  return m === 0 ? `${s} s` : `${m} min${s ? ` ${s} s` : ""}`;
}
