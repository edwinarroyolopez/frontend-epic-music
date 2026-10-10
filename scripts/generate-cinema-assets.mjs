// Original vector art, authored for Música Épica. No external images or fonts.
// Run: node scripts/generate-cinema-assets.mjs. Deterministic, editable source.
import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const out = new URL('../src/assets/cinema/', import.meta.url)
await mkdir(out, { recursive: true })
const defs = `<defs>
<linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff0c5"/><stop offset=".24" stop-color="#ac7753"/><stop offset=".48" stop-color="#f1d5a0"/><stop offset=".7" stop-color="#835441"/><stop offset="1" stop-color="#d5b979"/></linearGradient>
<linearGradient id="wine" x2=".8" y2="1"><stop stop-color="#b77975"/><stop offset=".45" stop-color="#732248"/><stop offset="1" stop-color="#241927"/></linearGradient>
<linearGradient id="jade" x2="1" y2="1"><stop stop-color="#a4b5a0"/><stop offset=".5" stop-color="#4e736a"/><stop offset="1" stop-color="#1b3438"/></linearGradient>
<linearGradient id="night" x2="1" y2="1"><stop stop-color="#9c91ac"/><stop offset=".5" stop-color="#514461"/><stop offset="1" stop-color="#221a30"/></linearGradient>
<radialGradient id="light"><stop stop-color="#bf8059" stop-opacity=".38"/><stop offset="1" stop-color="#22131f" stop-opacity="0"/></radialGradient>
<radialGradient id="disc"><stop stop-color="#332b37"/><stop offset=".45" stop-color="#17141e"/><stop offset=".7" stop-color="#34303b"/><stop offset="1" stop-color="#100e16"/></radialGradient>
<linearGradient id="sheen"><stop stop-color="#f7e5c3" stop-opacity="0"/><stop offset=".5" stop-color="#f7e5c3" stop-opacity=".26"/><stop offset="1" stop-color="#f7e5c3" stop-opacity="0"/></linearGradient>
<filter id="shadow" x="-.5" y="-.5" width="2" height="2"><feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#08070d" flood-opacity=".55"/></filter>
</defs>`
const svg = body => `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700">${defs}${body}</svg>`
const lines = (count, fn) => Array.from({ length: count }, (_, i) => fn(i)).join('')
const atmosphere = `<rect width="1000" height="700" fill="#1a141d"/><ellipse cx="760" cy="220" rx="620" ry="440" fill="url(#light)"/><path d="M760 -80 220 700H900L970 -80Z" fill="url(#sheen)" opacity=".13"/>
${lines(18, i => `<path d="M${-400 + i * 90} 700 620 255 ${1100 + i * 70} 700" fill="none" stroke="#d5b979" stroke-opacity=".055"/>`)}
${lines(11, i => `<ellipse cx="590" cy="630" rx="${140 + i * 64}" ry="${18 + i * 18}" fill="none" stroke="#d5b979" stroke-opacity=".06"/>`)}
${lines(85, i => `<circle cx="${(i * 173 + 21) % 1000}" cy="${(i * 97 + 43) % 700}" r="${i % 3 === 0 ? 1 : .5}" fill="#ecd7b0" opacity=".13"/>`)}`
const memory = `<ellipse cx="510" cy="580" rx="260" ry="28" fill="#0d0a14" opacity=".5"/>
<g transform="translate(505 320) rotate(-24)">
${lines(16, i => `<ellipse rx="${100 + i * 10}" ry="${160 + i * 4}" transform="rotate(${i * 4})" fill="none" stroke="url(#metal)" stroke-width="${i === 0 ? 4 : 1.3}" opacity="${(.88 - i * .035).toFixed(2)}"/>`)}
<ellipse rx="94" ry="156" fill="none" stroke="#efd4a1" stroke-width=".6"/>
</g><circle cx="505" cy="320" r="9" fill="#ffe3ad"/><circle cx="505" cy="320" r="31" fill="none" stroke="#e8c895" stroke-opacity=".2"/>
${lines(9, i => `<path d="M-60 ${360 + i * 13}C190 ${160 + i * 17} 305 ${550 - i * 7} 510 320S800 ${190 + i * 18} 1070 ${280 + i * 19}" fill="none" stroke="url(#metal)" opacity="${.22 + i * .04}"/>`)}
<g fill="#ead4ad" opacity=".5"><path d="m220 210 8-17 8 17m-12-6h9" fill="none" stroke="#ead4ad"/><path d="M780 422v-24h15m-15 11h10" fill="none" stroke="#ead4ad"/><path d="m310 507 12-13 12 13-12 13Z" fill="none" stroke="#ead4ad"/></g>`
function cover(x, y, scale, angle, color = 'wine', motif = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})" filter="url(#shadow)"><rect x="-6" y="4" width="220" height="280" rx="2" fill="#15121b"/><rect width="220" height="280" rx="2" fill="url(#${color})" stroke="#f1d7a1" stroke-opacity=".45"/><path d="M12 12h196v256H12Z" fill="none" stroke="#f7e6c6" stroke-opacity=".22"/>
${motif === 0 ? `<circle cx="110" cy="106" r="52" fill="url(#metal)"/>${lines(9, i => `<path d="M0 ${172 + i * 9}Q65 ${110 + i * 12} 220 ${183 + i * 7}" fill="none" stroke="#efd4aa" stroke-opacity=".45"/>`)}` : motif === 1 ? lines(11, i => `<ellipse cx="110" cy="130" rx="${25 + i * 5}" ry="${45 + i * 5}" transform="rotate(${i * 10} 110 130)" fill="none" stroke="#f0dcb6" stroke-opacity=".55"/>`) : `<path d="M28 190 102 46l92 146Z" fill="none" stroke="#efd4a1" stroke-width="2"/>${lines(10, i => `<path d="M${35 + i * 14} 191v-${30 + Math.sin(i * .6) * 50 + 45}" stroke="#efd4a1" stroke-opacity=".65"/>`)}`}
<path d="M25 240h68m-68 9h43M176 240h19m-19 9h19" stroke="#f3e2bf" stroke-opacity=".6" stroke-width="2"/></g>`
}
const vinyl = `<g transform="translate(610 320)" filter="url(#shadow)"><circle r="220" fill="url(#disc)" stroke="#786073" stroke-width="2"/>${lines(28, i => `<circle r="${75 + i * 5}" fill="none" stroke="#d1b3c8" stroke-opacity="${i % 4 ? '.09' : '.19'}"/>`)}<path d="M0 0 90-200A220 220 0 0 1 200-90ZM0 0-90 200A220 220 0 0 1-200 90Z" fill="url(#sheen)"/><circle r="68" fill="url(#wine)" stroke="#d5b979" stroke-opacity=".6"/><circle r="53" fill="none" stroke="#d5b979" stroke-opacity=".3"/><path d="M-28-16h56m-44 9h32M-25 25h50" stroke="#e7c897" stroke-width="2"/><circle r="7" fill="#17121d" stroke="#d5b979"/></g>`
const record = cover(230, 145, 1.38, -10)
const constellation = `<g fill="none" stroke="#d5b979" stroke-opacity=".38"><path d="M175 335 410 190 675 260 803 475 485 475 175 335 675 260M410 190 485 475"/>${lines(3, i => `<ellipse cx="500" cy="335" rx="${270 + i * 65}" ry="${145 + i * 37}" transform="rotate(-15 500 335)" stroke-opacity=".13"/>`)}</g>
${cover(107, 239, .66, -15, 'jade', 1)}${cover(337, 104, .69, 7, 'night', 2)}${cover(565, 158, .91, -6)}${cover(723, 385, .54, 12, 'night', 1)}${cover(403, 405, .60, -8, 'jade', 2)}
<g fill="#f3d9a5"><circle cx="280" cy="398" r="4"/><circle cx="538" cy="242" r="4"/><circle cx="690" cy="483" r="4"/></g>`
const affinity = `<g transform="translate(500 325) rotate(-18)">${lines(26, i => `<ellipse rx="${110 + i * 5}" ry="${75 + i * 6}" transform="rotate(${i * 6})" fill="none" stroke="url(#${i < 13 ? 'metal' : 'wine'})" stroke-width="${i % 5 === 0 ? 3 : 1.4}" opacity=".8"/>`)}<ellipse rx="285" ry="110" fill="none" stroke="#b8cabb" stroke-opacity=".45"/><circle cx="-256" cy="46" r="13" fill="url(#jade)"/><circle cx="197" cy="-79" r="9" fill="url(#metal)"/><circle cx="80" cy="218" r="7" fill="#b188a5"/></g>`
const archive = `<path d="m145 570 140-72h490l95 72-80 31H230Z" fill="#2b222b" stroke="#d5b979" stroke-opacity=".25"/><path d="M145 570h725v14H145Z" fill="url(#metal)" opacity=".6"/>
${cover(220, 236, 1.08, -14, 'jade', 1)}${cover(354, 170, 1.18, -5, 'night', 2)}${cover(501, 196, 1.17, 7)}
<path d="M242 584h512" stroke="#f2dcb5" stroke-opacity=".6"/>`
const glints = `<g fill="none" stroke="url(#metal)" opacity=".35"><path d="M-60 510Q140 130 370 180M720 590Q790 280 1060 180" stroke-width="2"/><path d="M-60 522Q140 142 370 192M720 604Q790 294 1060 194"/></g>`
const files = { atmosphere, memory, record, vinyl, constellation, affinity, archive, glints, poster: atmosphere + memory }
const manifest = { version: 1, source: 'scripts/generate-cinema-assets.mjs', provenance: 'Original procedural vector compositions authored for Música Épica; no third-party images, lyrics, fonts or AI generation.', rights: 'Original project artwork; no third-party licensing requirements. Reuse under the project’s applicable terms.', assets: [] }
for (const [name, body] of Object.entries(files)) {
  const source = svg(body).replace(/\n/g, '')
  await writeFile(new URL(name + '.svg', out), source + '\n')
  manifest.assets.push({ file: `src/assets/cinema/${name}.svg`, width: 1000, height: 700, bytes: Buffer.byteLength(source + '\n'), sha256: createHash('sha256').update(source + '\n').digest('hex'), method: 'Deterministic SVG paths, gradients, static drop shadows; optimized numeric geometry; no raster', use: name === 'poster' ? 'Early static fallback / no JavaScript' : name === 'glints' || name === 'atmosphere' || name === 'vinyl' ? 'Independent depth layer' : 'Original scene composition; transparent for compositing' })
}
await writeFile(new URL('manifest.json', out), JSON.stringify(manifest, null, 2) + '\n')
console.log(`${manifest.assets.length} original SVG assets, ${manifest.assets.reduce((n, a) => n + a.bytes, 0)} bytes`)
