"""Regression checks that ensure the HTML validator rejects broken SEO output."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('seo', Path(__file__).with_name('check-seo.py'))
seo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(seo)


class SEORegression(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (seo.ROOT / 'dist/index.html').read_text()

    def test_build_valid(self):
        seo.check(self.html)

    def test_duplicate_canonical_rejected(self):
        with self.assertRaises(AssertionError):
            seo.check(self.html.replace('</head>', f'<link rel="canonical" href="{seo.SITE}" /></head>'))

    def test_image_typo_rejected(self):
        with self.assertRaises(AssertionError):
            seo.check(self.html.replace('descrubre', 'descubre'))

    def test_private_link_rejected(self):
        with self.assertRaises(AssertionError):
            seo.check(self.html.replace('</main>', '<a href="#/playlists/private">Private</a></main>'))

    def test_production_noindex_rejected(self):
        with self.assertRaises(AssertionError):
            seo.check(self.html.replace('index, follow, max-image-preview:large', 'noindex, follow'))

    def test_preview_noindex_accepted(self):
        seo.check(self.html.replace('index, follow, max-image-preview:large', 'noindex, follow'), preview=True)

    def test_empty_shell_rejected(self):
        with self.assertRaises(AssertionError):
            seo.check(self.html.replace('id="landing-title"', 'id="missing-title"'))

    def test_invented_rating_rejected(self):
        with self.assertRaises(AssertionError):
            seo.check(self.html.replace('"applicationCategory":', '"aggregateRating": {"ratingValue":5}, "applicationCategory":'))


if __name__ == '__main__':
    unittest.main()
