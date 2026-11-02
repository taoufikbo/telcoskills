import { formaterDuree, type InfoVideo } from "@/lib/formatVideo";

export default function PresentationVideo({
  video,
  presentation,
  titre,
}: {
  video: InfoVideo;
  presentation?: string;
  titre: string;
}) {
  return (
    <section aria-label="Présentation vidéo" className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
      <details>
        <summary className="cursor-pointer select-none text-sm font-bold">
          <span aria-hidden className="text-orange">▶ </span>
          Présentation vidéo · {formaterDuree(video.duree)}
        </summary>
        <div className="mt-3 max-w-3xl space-y-3">
          {presentation && <p className="text-sm leading-relaxed">{presentation}</p>}
          <video
            controls
            preload="none"
            poster={video.affiche}
            className="aspect-video w-full border-2 border-black bg-black dark:border-white"
            aria-label={`Présentation de la roadmap ${titre}`}
          >
            <source src={video.src} type="video/mp4" />
            <track kind="captions" srcLang="fr" label="Français" src={video.sousTitres} default />
            Votre navigateur ne sait pas lire cette vidéo.
          </video>
          <p className="text-xs text-slate-500">
            Vidéo générée automatiquement à partir du contenu de la roadmap. {video.credit} Sous-titres en français
            disponibles dans le lecteur.
          </p>
        </div>
      </details>
    </section>
  );
}
