"""Validate source HTML, generated files and HTTP without executing JavaScript."""
from html.parser import HTMLParser
import json
from pathlib import Path
import sys
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SITE = 'https://musica-epica-ed.netlify.app/'
IMAGE = 'https://res.cloudinary.com/qbrotguz/image/upload/v1791588468/musica-epica-descrubre-tu-cancion.png'


class Document(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.tags = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

    def one(self, tag, **attrs):
        found = [a for t, a in self.tags if t == tag and all(a.get(k) == v for k, v in attrs.items())]
        assert len(found) == 1, (tag, attrs, len(found))
        return found[0]


def check(html, full=True, preview=False):
    doc = Document(html)
    doc.one('html', lang='es')
    doc.one('title')
    assert 'Música Épica | Encuentra canciones por su letra y descubre música</title>' in html
    assert len(doc.one('meta', name='description')['content']) > 80
    doc.one('meta', name='viewport')
    assert doc.one('link', rel='canonical')['href'] == SITE
    robots = doc.one('meta', name='robots')['content']
    assert robots == ('noindex, follow' if preview else 'index, follow, max-image-preview:large')
    expected = {'og:type': 'website', 'og:site_name': 'Música Épica', 'og:url': SITE,
                'og:image': IMAGE, 'og:image:secure_url': IMAGE, 'og:image:type': 'image/png',
                'og:image:width': '1731', 'og:image:height': '909', 'twitter:card': 'summary_large_image',
                'twitter:image': IMAGE}
    for name in ['og:title', 'og:description', 'og:image:alt', 'twitter:title', 'twitter:description', 'twitter:image:alt', *expected]:
        value = doc.one('meta', **{'property' if name.startswith('og:') else 'name': name})['content']
        assert value and (name not in expected or value == expected[name]), name
    assert not any('hreflang' in a for _, a in doc.tags)
    assert not any(t == 'img' and a.get('src') == IMAGE for t, a in doc.tags)
    if full:
        doc.one('h1', id='landing-title')
        doc.one('main')
        assert any(t == 'a' and a.get('href') == '#/registro' for t, a in doc.tags)
        for text in ['buscar una canción', 'no es un diagnóstico', 'Spotify', 'YouTube', 'JavaScript']:
            assert text in html, text
        for path in ['playlists', 'historial', 'analisis', 'perfil', 'cuenta']:
            assert f'href="#/{path}' not in html
        doc.one('script', type='application/ld+json')
        start = html.index('>', html.index('<script type="application/ld+json"')) + 1
        schema = json.loads(html[start:html.index('</script>', start)])
        assert schema['@context'] == 'https://schema.org'
        graph = schema['@graph']
        assert [item['@type'] for item in graph] == ['WebSite', 'WebApplication']
        assert all(item['url'] == SITE and item['inLanguage'] == 'es' for item in graph)
        assert graph[0]['about']['@id'] == graph[1]['@id']
        assert graph[1]['isPartOf']['@id'] == graph[0]['@id']
        for forbidden in ['aggregateRating', 'review', 'offers', 'email', 'accessToken', 'samantha@']:
            assert forbidden not in json.dumps(schema)
    return {a.get('name', a.get('property')): a['content'] for t, a in doc.tags if t == 'meta' and 'content' in a}


if __name__ == '__main__':
    full = '--head-only' not in sys.argv
    preview = '--preview' in sys.argv
    targets = [v for v in sys.argv[1:] if not v.startswith('--')]
    results = {}
    for target in targets or (['dist/index.html', 'index.html'] if full else ['dev.html', 'dist/index.html', 'index.html']):
        if target.startswith('http'):
            with urllib.request.urlopen(target) as response:
                assert response.status == 200
                assert response.headers.get_content_type() == 'text/html'
                html = response.read().decode()
        else:
            html = (ROOT / target).read_text()
        results[target] = check(html, full, preview)
        print('PASS', target)
    if full:
        for folder in ['public', 'dist']:
            xml = ET.parse(ROOT / folder / 'sitemap.xml')
            assert [e.text for e in xml.findall('.//{*}loc')] == [SITE]
            assert not xml.findall('.//{*}lastmod')
            robots = (ROOT / folder / 'robots.txt').read_text()
            assert 'Sitemap: ' + SITE + 'sitemap.xml' in robots
            assert 'GPTBot' not in robots
            assert 'Disallow: /' not in robots
    out = ROOT / 'evidence/seo-geo'
    out.mkdir(parents=True, exist_ok=True)
    (out / ('head-checks.json' if not full else 'html-checks.json')).write_text(json.dumps(results, ensure_ascii=False, indent=2) + '\n')
