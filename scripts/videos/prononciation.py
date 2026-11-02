"""Adapte un texte pour la voix de synthèse : sigles et anglicismes écrits comme ils se prononcent en français.

Le texte affiché (sous-titres) n'est pas modifié ; seule la version lue passe par `pour_la_voix`.
Le lexique est dans prononciations.json (modifiable sans toucher au code).
"""
import json
import pathlib
import re

LEXIQUE = pathlib.Path(__file__).resolve().parent / "prononciations.json"

LETTRES = {
    "A": "a", "B": "bé", "C": "cé", "D": "dé", "E": "eux", "F": "èf", "G": "gé", "H": "ache", "I": "i",
    "J": "ji", "K": "ka", "L": "èl", "M": "èm", "N": "èn", "O": "o", "P": "pé", "Q": "ku", "R": "èr",
    "S": "èss", "T": "té", "U": "u", "V": "vé", "W": "double vé", "X": "ix", "Y": "i grec", "Z": "zède",
}

MOT = re.compile(r"[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9'’\-]*")
SIGLE = re.compile(r"^[A-Z0-9]{2,}$")


def charger_lexique(chemin: pathlib.Path = LEXIQUE) -> dict:
    donnees = json.loads(chemin.read_text(encoding="utf-8"))
    return {"acronymes": donnees["acronymes"], "mots": {k.lower(): v for k, v in donnees["mots"].items()}}


def epeler(sigle: str) -> str:
    """Épelle un sigle inconnu : lettres à la française, chiffres laissés tels quels."""
    return " ".join(LETTRES.get(c, c) for c in sigle)


def mot_pour_la_voix(mot: str, lexique: dict) -> str:
    if mot in lexique["acronymes"]:
        return lexique["acronymes"][mot]
    if mot.lower() in lexique["mots"]:
        return lexique["mots"][mot.lower()]
    # Élision : d'IP, l'UE, d'UE… on traite ce qui suit l'apostrophe
    for apostrophe in ("'", "’"):
        if apostrophe in mot:
            avant, apres = mot.split(apostrophe, 1)
            if apres:
                return avant + apostrophe + mot_pour_la_voix(apres, lexique)
    if SIGLE.match(mot) and any(c.isalpha() for c in mot):
        return epeler(mot)
    return mot


def pour_la_voix(texte: str, lexique: dict | None = None) -> str:
    lexique = lexique or charger_lexique()
    return MOT.sub(lambda m: mot_pour_la_voix(m.group(0), lexique), texte)
