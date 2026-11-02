#!/usr/bin/env python3
"""Génère une vidéo explicative par roadmap, à partir de content/roadmaps/*.json.

Pour chaque roadmap : un diaporama (titre, plan des blocs, un écran par bloc, usage du site, conclusion),
dessiné en HTML dans la charte de l'instance interne et capturé par Chrome ; un commentaire lu par la voix neuronale
Piper ; un assemblage ffmpeg. Sortie dans public/videos : <id>.mp4, <id>.vtt (sous-titres),
<id>.jpg (affiche) et <id>.json (durée).

Prérequis : Python 3.10+, `pip install piper-tts imageio-ffmpeg` et Google Chrome (variable CHROME si
l'installation est ailleurs). La voix française (modèle Piper fr_FR-siwis-medium, environ 60 Mo) est
téléchargée au premier lancement dans scripts/videos/.voix ; tout se fait en local, sans service externe.

Usage : python scripts/videos/generer_videos.py [identifiant-de-roadmap ...]
"""
import html
import json
import os
import pathlib
import re
import subprocess
import sys
import tempfile
import urllib.request
import wave
from datetime import datetime, timezone

import imageio_ffmpeg
from piper import PiperVoice, SynthesisConfig

from prononciation import pour_la_voix

RACINE = pathlib.Path(__file__).resolve().parents[2]
CONTENU = RACINE / "content" / "roadmaps"
SORTIE = RACINE / "public" / "videos"
CHROME = os.environ.get("CHROME", r"C:\Program Files\Google\Chrome\Application\chrome.exe")
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

LARGEUR, HAUTEUR = 1280, 720
VOIX_DOSSIER = pathlib.Path(__file__).resolve().parent / ".voix"
VOIX_NOM = "fr_FR-siwis-medium"
VOIX_URL = "https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/"
LONGUEUR = 1.08  # > 1 : débit un peu plus posé
PAUSE_PHRASE = 0.35  # silence entre deux phrases, en secondes
CREDIT = "Voix de synthèse : Piper, modèle fr_FR-siwis (jeu de données SIWIS, Université d'Édimbourg, licence CC BY 4.0)."
PAUSE_FIN = 0.9  # silence à la fin de chaque diapositive, en secondes

NIVEAUX = {
    "fondamental": ("Fondamental", "#228722"),
    "intermediaire": ("Intermédiaire", "#4bb4e6"),
    "avance": ("Avancé", "#a885d8"),
    "transverse": ("Transverse", "#999999"),
}

CSS = """
html,body{margin:0;width:%dpx;height:%dpx;background:#000;color:#fff;overflow:hidden;
font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}
.barre{height:14px;background:#ff7900}
.cadre{padding:44px 64px 0;box-sizing:border-box;height:%dpx}
h1{font-size:52px;line-height:1.1;margin:0 0 20px}
h2{font-size:46px;line-height:1.1;margin:0 0 6px;color:#ff7900}
.sous{font-size:26px;color:#ccc;margin:0 0 26px}
p{font-size:28px;line-height:1.35;margin:0 0 22px;max-width:1100px}
.stats{display:flex;gap:24px;margin-top:30px}
.stat{border:2px solid #fff;padding:14px 26px;font-size:24px}
.stat b{display:block;font-size:46px;color:#ff7900}
ul{list-style:none;margin:0;padding:0}
.grille{columns:2;column-gap:48px}
.grille li{break-inside:avoid;font-size:30px;line-height:1.25;margin:0 0 18px;display:flex;gap:14px;align-items:flex-start}
.pt{flex:none;width:18px;height:18px;border-radius:50%%;margin-top:9px}
.legende{position:absolute;left:64px;bottom:76px;display:flex;gap:34px;font-size:22px;color:#ccc}
.legende span{display:flex;gap:10px;align-items:center}
.legende i{display:inline-block;width:16px;height:16px;border-radius:50%%}
.num{flex:none;min-width:44px;font-weight:700;color:#ff7900}
.n{margin-left:auto;color:#ccc;font-size:21px;padding-left:12px;white-space:nowrap}
.usage li{display:flex;gap:24px;font-size:27px;line-height:1.3;margin:0 0 20px}
.usage b{flex:none;width:210px;color:#ff7900}
.pied{position:absolute;left:0;right:0;bottom:0;height:52px;box-sizing:border-box;padding:0 64px;display:flex;
justify-content:space-between;align-items:center;border-top:1px solid #333;color:#ccc;font-size:19px}
""" % (LARGEUR, HAUTEUR, HAUTEUR - 14)


def parlable(texte: str) -> str:
    """Rend un titre lisible à voix haute : retire les parenthèses et remplace les symboles."""
    t = re.sub(r"\s*\([^)]*\)", "", texte)
    t = t.replace("&", " et ").replace("/", " ").replace("+", " plus ").replace("→", " vers ")
    return re.sub(r"\s+", " ", t).strip(" :;,")


def court(titre: str) -> str:
    """Partie principale d'un titre (avant « : »), plus brève à écouter."""
    return parlable(titre.split(" : ")[0])


def liste(elements: list[str]) -> str:
    if len(elements) <= 1:
        return "".join(elements)
    return ", ".join(elements[:-1]) + " et " + elements[-1]


def pluriel(n: int, mot: str) -> str:
    return f"{n} {mot}{'s' if n > 1 else ''}"


def page(corps: str, indice: int, total: int, titre_roadmap: str) -> str:
    pied = f'<div class="pied"><span>TelcoCloud Roadmaps · {html.escape(titre_roadmap)}</span><span>{indice}/{total}</span></div>'
    return f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>{CSS}</style></head><body><div class="barre"></div><div class="cadre">{corps}</div>{pied}</body></html>'


def diapositives(r: dict) -> list[dict]:
    """Liste de {corps: html, texte: commentaire} construite uniquement à partir des données de la roadmap."""
    noeuds, blocs = r["noeuds"], r["blocs"]
    a_demande = any(n.get("demande") for n in noeuds)
    niveaux_presents = len({n["niveau"] for n in noeuds})
    res = []

    intro = f"Bienvenue dans la roadmap {parlable(r['titre'])}. "
    if r.get("presentation"):
        intro += r["presentation"] + " "
    intro += f"Elle compte {pluriel(len(noeuds), 'compétence')}, réparties en {pluriel(len(blocs), 'bloc')}."
    corps = f"<h1>{html.escape(r['titre'])}</h1>"
    if r.get("presentation"):
        corps += f"<p>{html.escape(r['presentation'])}</p>"
    corps += (
        '<div class="stats">'
        f'<div class="stat"><b>{len(noeuds)}</b>compétences</div>'
        f'<div class="stat"><b>{len(blocs)}</b>blocs</div>'
        f'<div class="stat"><b>{niveaux_presents}</b>niveaux</div></div>'
    )
    res.append({"corps": corps, "texte": intro})

    plan = f"Le parcours suit {pluriel(len(blocs), 'bloc')}, de {parlable(blocs[0])} à {parlable(blocs[-1])}."
    items = "".join(
        f'<li><span class="num">{i + 1}</span><span>{html.escape(b)}</span>'
        f'<span class="n">{sum(1 for n in noeuds if n["bloc"] == b)}</span></li>'
        for i, b in enumerate(blocs)
    )
    res.append({"corps": f'<h2>Le plan</h2><p class="sous">{len(blocs)} blocs, dans l\'ordre du parcours</p><ul class="grille">{items}</ul>', "texte": plan})

    for bloc in blocs:
        membres = [n for n in noeuds if n["bloc"] == bloc]
        phrase = f"{parlable(bloc)}. {pluriel(len(membres), 'compétence')}. Par exemple : {liste([court(n['titre']) for n in membres[:2]])}."
        projets = [n for n in membres if n.get("projet")]
        if projets:
            phrase += " Projet pratique : " + parlable(projets[0]["projet"]).rstrip(".") + "."
        visibles = membres[:12]
        lignes = "".join(
            f'<li><span class="pt" style="background:{NIVEAUX[n["niveau"]][1]}"></span><span>{html.escape(n["titre"])}</span></li>'
            for n in visibles
        )
        if len(membres) > len(visibles):
            lignes += f'<li><span class="pt" style="background:#444"></span><span>… et {len(membres) - len(visibles)} autres</span></li>'
        presents = [k for k in NIVEAUX if any(n["niveau"] == k for n in membres)]
        legende = "".join(f'<span><i style="background:{NIVEAUX[k][1]}"></i>{NIVEAUX[k][0]}</span>' for k in presents)
        corps = f'<h2>{html.escape(bloc)}</h2><p class="sous">{pluriel(len(membres), "compétence")}</p><ul class="grille">{lignes}</ul><div class="legende">{legende}</div>'
        res.append({"corps": corps, "texte": phrase})

    usage = (
        "Sur le site, vous pouvez parcourir la roadmap en arbre ou en plan de métro, ouvrir chaque compétence pour voir ses "
        "prérequis et ses ressources ouvertes, suivre votre progression, et choisir un objectif pour obtenir les étapes à "
        "enchaîner avec le chemin critique."
    )
    if a_demande:
        usage += " Les badges de demande donnent un ordre de grandeur issu d'offres d'emploi, pas une statistique."
    corps = (
        "<h2>Utiliser la roadmap</h2><ul class=\"usage\" style=\"margin-top:26px\">"
        "<li><b>Arbre / Métro</b><span>Parcourir tous les blocs et voir les liens entre compétences.</span></li>"
        "<li><b>Compétence</b><span>Cliquer pour afficher prérequis, ressources ouvertes et projet pratique.</span></li>"
        "<li><b>Progression</b><span>Noter ce qui est à faire, en cours, maîtrisé ou ignoré ; export possible.</span></li>"
        "<li><b>Objectif</b><span>Choisir une compétence cible : étapes, chemin critique, ce qui est disponible maintenant.</span></li></ul>"
    )
    res.append({"corps": corps, "texte": usage})

    fin = (
        "À vous de jouer : choisissez un objectif et commencez par les compétences disponibles. "
        "Cette vidéo a été générée automatiquement à partir du contenu de la roadmap, avec une voix de synthèse. "
        "Les références sont à vérifier dans leur version en vigueur."
    )
    corps = (
        "<h1>À vous de jouer</h1><p>Choisissez un objectif et commencez par les compétences disponibles.</p>"
        "<p style=\"color:#ccc;font-size:23px\">Vidéo générée automatiquement à partir du contenu de la roadmap, avec une voix de synthèse. "
        "Les références sont à vérifier dans leur version en vigueur.</p>"
        f"<p style=\"color:#999;font-size:20px\">{html.escape(CREDIT)}</p>"
    )
    res.append({"corps": corps, "texte": fin})
    return res


def charger_voix() -> PiperVoice:
    """Charge la voix Piper, en la téléchargeant au premier usage."""
    VOIX_DOSSIER.mkdir(exist_ok=True)
    for extension in (".onnx", ".onnx.json"):
        fichier = VOIX_DOSSIER / (VOIX_NOM + extension)
        if not fichier.exists():
            print(f"Téléchargement de {fichier.name} …")
            requete = urllib.request.Request(VOIX_URL + fichier.name, headers={"User-Agent": "generer_videos"})
            with urllib.request.urlopen(requete, timeout=300) as r, open(fichier, "wb") as sortie:
                sortie.write(r.read())
    return PiperVoice.load(str(VOIX_DOSSIER / (VOIX_NOM + ".onnx")))


def synthetiser(textes: list[str], dossier: pathlib.Path) -> list[pathlib.Path]:
    """Lit chaque texte phrase par phrase (sigles et anglicismes adaptés par prononciations.json), avec un court
    silence entre les phrases, et l'enregistre en WAV."""
    voix = charger_voix()
    config = SynthesisConfig(length_scale=LONGUEUR)
    silence = bytes(2 * int(voix.config.sample_rate * PAUSE_PHRASE))
    fichiers = []
    for i, texte in enumerate(textes):
        wav = dossier / f"voix{i:02d}.wav"
        with wave.open(str(wav), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(voix.config.sample_rate)
            phrases = [t for t in re.split(r"(?<=[.!?])\s+", pour_la_voix(texte)) if t]
            for k, phrase in enumerate(phrases):
                for morceau in voix.synthesize(phrase, config):
                    w.writeframes(morceau.audio_int16_bytes)
                if k < len(phrases) - 1:
                    w.writeframes(silence)
        fichiers.append(wav)
    return fichiers


def duree_media(chemin: pathlib.Path) -> float:
    """Durée réelle d'un fichier audio ou vidéo, lue par ffmpeg (et non déduite de l'en-tête)."""
    res = subprocess.run([FFMPEG, "-i", str(chemin)], capture_output=True, text=True)
    m = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", res.stderr)
    if not m:
        sys.exit(f"Durée illisible : {chemin}")
    return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))


def capturer(html_path: pathlib.Path, png: pathlib.Path, profil: pathlib.Path) -> None:
    cmd = [
        CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
        f"--user-data-dir={profil}", f"--window-size={LARGEUR},{HAUTEUR}", f"--screenshot={png}", html_path.as_uri(),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)
    if not png.exists():
        sys.exit(f"Capture manquante : {png}")


def ffmpeg(*args: str) -> None:
    res = subprocess.run([FFMPEG, "-y", "-loglevel", "error", *args], capture_output=True, text=True)
    if res.returncode != 0:
        sys.exit("ffmpeg a échoué : " + res.stderr[-800:])


def horodatage(s: float) -> str:
    ms = int(round(s * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d}.{ms % 1000:03d}"


def sous_titres(textes: list[str], durees: list[float]) -> str:
    cues, t = ["WEBVTT", ""], 0.0
    for texte, duree in zip(textes, durees):
        phrases = [p for p in re.split(r"(?<=[.!?])\s+", texte) if p]
        total = sum(len(p) for p in phrases) or 1
        debut = t
        for p in phrases:
            fin = debut + (duree - PAUSE_FIN) * len(p) / total
            cues += [f"{horodatage(debut)} --> {horodatage(fin)}", p, ""]
            debut = fin
        t += duree
    return "\n".join(cues)


def generer(roadmap_id: str) -> None:
    r = json.loads((CONTENU / f"{roadmap_id}.json").read_text(encoding="utf-8"))
    slides = diapositives(r)
    print(f"[{roadmap_id}] {len(slides)} diapositives")
    SORTIE.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        profil = tmp / "chrome"
        wavs = synthetiser([s["texte"] for s in slides], tmp)
        clips, durees = [], []
        for i, (s, wav) in enumerate(zip(slides, wavs)):
            page_html = tmp / f"d{i:02d}.html"
            page_html.write_text(page(s["corps"], i + 1, len(slides), r["titre"]), encoding="utf-8")
            png = tmp / f"d{i:02d}.png"
            capturer(page_html, png, profil)
            clip = tmp / f"c{i:02d}.mp4"
            ffmpeg(
                "-loop", "1", "-framerate", "10", "-i", str(png), "-i", str(wav),
                "-af", f"apad=pad_dur={PAUSE_FIN}", "-vf", f"scale={LARGEUR}:{HAUTEUR},format=yuv420p",
                "-c:v", "libx264", "-tune", "stillimage", "-r", "10", "-c:a", "aac", "-b:a", "96k", "-ar", "44100", "-ac", "1",
                "-shortest", str(clip),
            )
            clips.append(clip)
            durees.append(duree_media(clip))

        liste_clips = tmp / "clips.txt"
        liste_clips.write_text("".join(f"file '{c.as_posix()}'\n" for c in clips), encoding="utf-8")
        mp4 = SORTIE / f"{roadmap_id}.mp4"
        ffmpeg("-f", "concat", "-safe", "0", "-i", str(liste_clips), "-c", "copy", "-movflags", "+faststart", str(mp4))
        total = duree_media(mp4)
        ecart = abs(total - sum(durees))
        if ecart > 0.5:
            print(f"[{roadmap_id}] attention : écart de {ecart:.1f} s entre la somme des clips et la vidéo finale")
        durees[-1] += total - sum(durees)  # recale les sous-titres sur la durée réelle
        ffmpeg("-i", str(tmp / "d00.png"), "-q:v", "3", str(SORTIE / f"{roadmap_id}.jpg"))

    (SORTIE / f"{roadmap_id}.vtt").write_text(sous_titres([s["texte"] for s in slides], durees), encoding="utf-8")
    meta = {"duree": round(sum(durees), 1), "genere": datetime.now(timezone.utc).strftime("%Y-%m-%d"), "voix": "Piper fr_FR-siwis-medium", "credit": CREDIT}
    (SORTIE / f"{roadmap_id}.json").write_text(json.dumps(meta, ensure_ascii=False), encoding="utf-8")
    taille = (SORTIE / f"{roadmap_id}.mp4").stat().st_size / 1024 / 1024
    print(f"[{roadmap_id}] {meta['duree']:.0f} s, {taille:.1f} Mo")


def main() -> None:
    ids = sys.argv[1:] or sorted(p.stem for p in CONTENU.glob("*.json"))
    for roadmap_id in ids:
        generer(roadmap_id)


if __name__ == "__main__":
    main()
