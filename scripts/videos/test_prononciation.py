"""Tests du lexique de prononciation : python -m unittest discover -s scripts/videos"""
import unittest

from prononciation import charger_lexique, epeler, pour_la_voix


class TestPrononciation(unittest.TestCase):
    def test_sigles_du_lexique(self):
        self.assertEqual(pour_la_voix("Un VPN pour le CaaS."), "Un vé pé èn pour le kasse.")

    def test_anglicismes_quelle_que_soit_la_casse(self):
        self.assertEqual(pour_la_voix("Packaging et packaging"), "pakadjine et pakadjine")

    def test_elision(self):
        self.assertEqual(pour_la_voix("Plan d'IP et d'UE"), "Plan d'i pé et d'u eux")

    def test_sigle_inconnu_epele(self):
        self.assertEqual(pour_la_voix("le XYZ"), "le ix i grec zède")

    def test_mots_francais_inchanges(self):
        phrase = "Cette roadmap s'adresse aux équipes d'exploitation."
        self.assertIn("équipes d'exploitation", pour_la_voix(phrase))
        self.assertEqual(pour_la_voix("Bienvenue à vous"), "Bienvenue à vous")

    def test_chiffres_conserves(self):
        self.assertEqual(pour_la_voix("36 compétences"), "36 compétences")
        self.assertEqual(epeler("N32"), "èn 3 2")

    def test_lexique_sans_doublon_ni_vide(self):
        lexique = charger_lexique()
        for section in lexique.values():
            for cle, valeur in section.items():
                self.assertTrue(valeur.strip(), cle)


if __name__ == "__main__":
    unittest.main()
