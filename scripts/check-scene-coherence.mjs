// Each selector must expose its own original image AND matching translated copy.
import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { preview } from 'vite'
import es from '../src/translations/es.js'
import en from '../src/translations/en.js'
const { chromium } = await import(process.env.PW_MODULE || 'playwright-core')
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const server = await preview({ preview: { host: '127.0.0.1', port: 4182, strictPort: true } })
const base = 'http://127.0.0.1:4182/'
const ids = ['memory', 'record', 'constellation', 'affinity', 'archive']
const sources = await Promise.all(ids.map(id => readFile(new URL(`../src/assets/cinema/${id}.svg`, import.meta.url), 'utf8')))
const report = { scope: 'Local browser, original SVG source comparison; no live API', scenes: [], fallbacks: [], errors: [], status: 'PENDING' }
async function inspect(page, i, language, source = true) {
  const locale = language === 'es' ? es : en
  const selected = page.locator('.landing-studio__steps button').nth(i)
  assert.equal(await selected.getAttribute('aria-pressed'), 'true')
  assert.equal(await page.locator('.landing-studio').getAttribute('data-scene-id'), ids[i])
  const scene = page.locator(`#cinema-scene-${ids[i]}`)
  const caption = page.locator(`#cinema-caption-${ids[i]}`)
  assert.equal(await caption.locator('strong').innerText(), locale.landing[`film${i}Title`])
  assert.equal(await caption.getAttribute('aria-hidden'), 'false')
  assert.equal(await page.locator('.cinema-caption[aria-hidden=false]').count(), 1)
  assert.ok(await scene.evaluate(n => Number(getComputedStyle(n).opacity) > .99))
  assert.ok(await caption.evaluate(n => Number(getComputedStyle(n).opacity) > .99))
  if (source) {
    assert.equal(await scene.locator('.cinema-subject').evaluate(n => n.complete && n.naturalWidth > 0 && getComputedStyle(n).visibility === 'visible'), true)
    const matches = await scene.locator('.cinema-subject').evaluate(async (n, original) => {
      const normalize = text => new DOMParser().parseFromString(text, 'image/svg+xml').documentElement.outerHTML.replace(/>\s+</g, '><').trim()
      return normalize(await (await fetch(n.src)).text()) === normalize(original)
    }, sources[i])
    assert.equal(matches, true, `${ids[i]} must use its own original SVG, not another scene's poster`)
  }
  return { id: ids[i], title: await caption.locator('strong').innerText(), originalImageMatches: source }
}
try {
  for (const width of [390, 1440]) for (const language of ['es', 'en']) for (const mode of ['autoplay', 'paused', 'reduced']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference' })
    await context.addInitScript(language => localStorage.setItem('me:language', JSON.stringify(language)), language)
    await context.route('**/*', route => /^https?:/.test(route.request().url()) && !route.request().url().startsWith(base) ? route.abort() : route.continue())
    const page = await context.newPage()
    page.on('pageerror', e => report.errors.push(e.message))
    await page.goto(base)
    await page.waitForFunction(lang => !document.querySelector('.landing-motion').disabled && document.documentElement.lang === lang, language)
    if (mode !== 'reduced') await page.waitForFunction(() => document.querySelector('.landing-studio').dataset.running === 'true')
    if (mode === 'paused') await page.locator('.landing-motion').click()
    for (let i = 0; i < ids.length; i++) {
      await page.locator('.landing-studio__steps button').nth(i).click()
      report.scenes.push({ width, language, mode, ...await inspect(page, i, language) })
    }
    await page.getByRole('button', { name: language === 'es' ? 'Escena siguiente' : 'Next scene', exact: true }).click()
    await inspect(page, 0, language)
    await page.getByRole('button', { name: language === 'es' ? 'Escena anterior' : 'Previous scene', exact: true }).click()
    await inspect(page, 4, language)
    await context.close()
  }
  // A failure in an inactive shot must not replace all the images with memory.
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  await context.route('**/*constellation-*.svg', route => route.abort())
  const page = await context.newPage()
  await page.goto(base)
  await page.waitForFunction(() => !document.querySelector('.landing-motion').disabled)
  await page.locator('#cinema-scene-constellation.is-unavailable').waitFor({ state: 'attached' })
  await inspect(page, 0, 'es')
  await page.locator('.landing-studio__steps button').nth(2).click()
  await inspect(page, 2, 'es', false)
  assert.equal(await page.locator('#cinema-scene-constellation .cinema-scene-fallback').innerText(), es.landing.film2Title)
  assert.equal(await page.locator('.landing-studio__caption').innerText(), es.landing.sceneUnavailable)
  await page.screenshot({ path: fileURLToPath(new URL('../evidence/cinema/coherent-fallback-390.png', import.meta.url)) })
  await page.locator('.landing-studio__steps button').nth(4).click()
  await inspect(page, 4, 'es')
  assert.equal(await page.locator('.landing-studio.has-fallback').count(), 0)
  report.fallbacks.push({ failed: 'constellation', otherShotsStillUsable: ['memory', 'archive'], matchingFallbackAndCaption: true })
  await context.close()
  assert.deepEqual(report.errors, [])
  report.status = 'PASS'
} catch (error) { report.status = 'FAIL'; report.error = error.stack; throw error }
finally {
  await writeFile(new URL('../evidence/cinema/scene-coherence.json', import.meta.url), JSON.stringify(report, null, 2) + '\n')
  await browser.close()
  await new Promise(resolve => server.httpServer.close(resolve))
}
console.log(`PASS: ${report.scenes.length} image/copy/selector checks; arrows and per-scene image fallback`)
