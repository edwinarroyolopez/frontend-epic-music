"""Read-only HTTP audit without credentials; private probes record status only."""
import hashlib
import json
from pathlib import Path
import struct
import urllib.request
import urllib.error

OUT = Path(__file__).resolve().parents[1] / 'evidence/seo-geo'
OUT.mkdir(parents=True, exist_ok=True)
SITE = 'https://musica-epica-ed.netlify.app/'
IMAGE = 'https://res.cloudinary.com/qbrotguz/image/upload/v1791588468/musica-epica-descrubre-tu-cancion.png'
results = []
for name, url, method, agent in [
    ('production', SITE, 'GET', 'SEO-audit'),
    ('production-head', SITE, 'HEAD', 'SEO-audit'),
    ('production-facebook', SITE, 'GET', 'facebookexternalhit/1.1'),
    ('production-searchbot', SITE, 'GET', 'OAI-SearchBot/1.4'),
    ('production-robots', SITE + 'robots.txt', 'GET', 'SEO-audit'),
    ('production-sitemap', SITE + 'sitemap.xml', 'GET', 'SEO-audit'),
    ('production-missing', SITE + 'seo-audit-nonexistent-20261009', 'GET', 'SEO-audit'),
    ('social-image', IMAGE, 'GET', 'SEO-audit'),
    ('social-image-head', IMAGE, 'HEAD', 'SEO-audit'),
]:
    request = urllib.request.Request(url, method=method, headers={'User-Agent': agent})
    try:
        try:
            response = urllib.request.urlopen(request, timeout=30)
        except urllib.error.HTTPError as error:
            response = error
        body = response.read()
        row = dict(name=name, url=url, finalUrl=response.url, method=method,
                   agent=agent, status=response.status, headers=dict(response.headers),
                   bytes=len(body), sha256=hashlib.sha256(body).hexdigest())
        if name == 'social-image' and body[:8] == b'\x89PNG\r\n\x1a\n':
            width, height = struct.unpack('>II', body[16:24])
            row.update(width=width, height=height, ratio=width / height)
            (OUT / 'social-image.png').write_bytes(body)
        elif method == 'GET':
            (OUT / f'{name}.html').write_bytes(body)
        results.append(row)
        print(name, response.status, len(body), row.get('width', ''), row.get('height', ''))
    except Exception as error:
        results.append(dict(name=name, url=url, error=str(error)))
(OUT / 'public-http.json').write_text(json.dumps(results, ensure_ascii=False, indent=2) + '\n')

api_results = []
API = 'https://backend-epic-music-production.up.railway.app'
for path in ['/auth/providers', '/playlist-personality/providers', '/auth/me', '/playlists', '/search-history', '/playlist-personality/history']:
    try:
        request = urllib.request.Request(API + path, headers={'Origin': SITE.rstrip('/'), 'User-Agent': 'SEO-audit'})
        try:
            response = urllib.request.urlopen(request, timeout=30)
        except urllib.error.HTTPError as error:
            response = error
        row = dict(url=API + path, status=response.status, date=response.headers.get('Date'),
                   allowOrigin=response.headers.get('Access-Control-Allow-Origin'))
        # Only public capability flags; never store account/history response bodies.
        if path.endswith('/providers') and response.status == 200:
            data = json.loads(response.read())
            if path == '/auth/providers':
                row['capabilities'] = {key: data.get(key) for key in ['email', 'apple', 'google', 'spotify']}
            else:
                row['capabilities'] = {provider: {key: value.get(key) for key in ['status', 'metadata_access', 'import', 'analysis']} for provider, value in data['data'].items()}
        response.close()
        api_results.append(row)
        print(path, row['status'])
    except Exception as error:
        api_results.append(dict(url=API + path, error=str(error)))
(OUT / 'api-boundaries.json').write_text(json.dumps(api_results, ensure_ascii=False, indent=2) + '\n')
