import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { isPreview } from '../scripts/public-html-plugin.mjs'
import es from '../src/translations/es.js'
import en from '../src/translations/en.js'

test('only non-production Netlify contexts request noindex', () => {
  for (const context of ['deploy-preview', 'branch-deploy', 'dev']) assert.equal(isPreview(context), true)
  for (const context of [undefined, '', 'production']) assert.equal(isPreview(context), false)
})

test('public guidance is complete in both languages and reflects disabled analysis entry points', () => {
  for (const topic of ['Phrase', 'Identify', 'Related', 'Analysis', 'Personality', 'Save', 'Links']) {
    for (const locale of [es, en]) {
      assert.ok(locale.landing[`faq${topic}Q`].length > 15)
      assert.ok(locale.landing[`faq${topic}A`].length > 50)
    }
  }
  assert.match(es.landing.faqAnalysisA, /Próximamente/)
  assert.match(es.landing.faqLinksA, /Próximamente/)
  assert.match(en.landing.faqAnalysisA, /Coming soon/)
  assert.match(en.landing.faqLinksA, /Coming soon/)
  const publicEntry = readFileSync(new URL('../src/prerender.jsx', import.meta.url), 'utf8')
  assert.doesNotMatch(publicEntry, /import .*?(?:App|UserContext|services\/)/)
})
