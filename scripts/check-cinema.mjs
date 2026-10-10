// Local only. PW_MODULE and AXE_PATH may point to existing external QA tools.
// node scripts/check-cinema.mjs [--motion-only]
import assert from 'node:assert/strict'
import { mkdir, writeFile, readFile, readdir, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { preview } from 'vite'
const { chromium } = await import(process.env.PW_MODULE || 'playwright-core')
const out = new URL('../evidence/cinema/', import.meta.url)
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] })
const server = await preview({ preview: { host: '127.0.0.1', port: 4180, strictPort: true } })
const base = 'http://127.0.0.1:4180/'
const report = { scope: 'Local Chromium; zero real API calls; laboratory measurements, not field CWV.', motion: [], views: [], checks: [], errors: [], failed: [], externalRequests: [] }
const watch = page => {
  page.on('pageerror', e => report.errors.push(e.message))
  page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()) })
  page.on('response', r => { if (r.status() >= 400) report.failed.push({ url: r.url(), status: r.status() }) })
  page.on('requestfailed', r => report.failed.push({ url: r.url(), failure: r.failure()?.errorText }))
}
async function context(options = {}, monitor = true) {
  const ctx = await browser.newContext(options)
  await ctx.route('**/*', route => {
    const url = route.request().url()
    if (/^https?:/.test(url) && !url.startsWith(base)) {
      report.externalRequests.push(url)
      return route.abort()
    }
    return route.continue()
  })
  const page = await ctx.newPage()
  if (monitor) watch(page)
  return { ctx, page }
}
async function capture(page, name, fullPage = false) {
  await page.screenshot({ path: fileURLToPath(new URL(name + '.png', out)), fullPage })
}
const snapshot = page => page.evaluate(() => ({
  time: performance.now(), scene: document.querySelector('.landing-studio').dataset.scene,
  layers: [...document.querySelectorAll('.cinema-atmosphere,.cinema-subject,.cinema-near,.cinema-record')].map(n => ({ class: n.className, transform: getComputedStyle(n).transform, opacity: getComputedStyle(n).opacity })),
  animations: document.querySelector('.landing-studio').getAnimations({ subtree: true }).filter(a => a.effect.getTiming().iterations === Infinity).map(a => ({ time: a.currentTime, state: a.playState })),
}))
try {
  for (const width of [1440, 390]) {
    const { ctx, page } = await context({ viewport: { width, height: width === 390 ? 844 : 900 }, recordVideo: { dir: '/tmp/opencode/cinema-recordings', size: { width, height: width === 390 ? 844 : 900 } } })
    await page.goto(base)
    await page.waitForFunction(() => document.querySelector('.landing-studio')?.dataset.running === 'true')
    const frames = []
    for (const [index, second] of [0, 3, 6, 10].entries()) {
      if (index) await page.waitForTimeout((second - [0, 3, 6, 10][index - 1]) * 1000)
      await capture(page, `motion-${width}-${second}s`)
      frames.push({ second, ...await snapshot(page) })
    }
    assert.notDeepEqual(frames[0].layers, frames[1].layers, 'Artwork must actually move without scrolling')
    assert.notEqual(frames[0].scene, frames[3].scene, 'The timeline must change shots autonomously')
    assert.notEqual(frames[1].layers[0].transform, frames[1].layers.at(-1).transform, 'Depth layers must move independently')
    await page.getByRole('button', { name: 'Pausar animación', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('.landing-studio').getAnimations({ subtree: true }).filter(a => a.effect.getTiming().iterations === Infinity).every(a => a.playState === 'paused' && !a.pending))
    const paused = await snapshot(page)
    await page.waitForTimeout(800)
    const later = await snapshot(page)
    assert.deepEqual(later.animations, paused.animations, 'Pause must freeze EVERY animation including fades')
    assert.deepEqual(later.layers, paused.layers)
    await capture(page, `paused-${width}`)
    await page.getByRole('button', { name: 'Reanudar animación', exact: true }).click()
    await page.waitForTimeout(350)
    assert.notDeepEqual((await snapshot(page)).layers, paused.layers)
    for (let i = 0; i < 5; i++) {
      await page.locator('.landing-studio__steps button').nth(i).click()
      assert.equal(await page.locator('.landing-studio').getAttribute('data-scene'), String(i))
      await capture(page, `scene-${width}-${i + 1}`)
    }
    await page.locator('.landing-faq').scrollIntoViewIfNeeded()
    await page.waitForFunction(() => document.querySelector('.landing-studio').dataset.running === 'false')
    const offscreen = await snapshot(page)
    await page.waitForTimeout(350)
    assert.deepEqual((await snapshot(page)).animations, offscreen.animations)
    await page.evaluate(() => scrollTo(0, 0))
    await page.waitForFunction(() => document.querySelector('.landing-studio').dataset.running === 'true')
    await capture(page, `full-${width}`, true)
    report.motion.push({ width, frames, pause: 'PASS', resume: 'PASS', offscreen: 'PASS', manualScenes: 5, video: `evidence/cinema/motion-${width}.webm` })
    const video = page.video()
    await ctx.close()
    await video.saveAs(fileURLToPath(new URL(`motion-${width}.webm`, out)))
    await video.delete()
  }
  if (!process.argv.includes('--motion-only')) {
    const axe = await readFile(process.env.AXE_PATH, 'utf8')
    for (const [width, height] of [[320,700], [390,844], [768,1024], [1024,768], [1440,900], [844,390]]) {
      for (const language of ['es', 'en']) {
        for (const theme of ['dark', 'light', 'custom']) {
          const { ctx, page } = await context({ viewport: { width, height }, reducedMotion: 'reduce', hasTouch: width < 768 })
          await page.addInitScript(({ language, theme }) => {
            localStorage.setItem('me:language', JSON.stringify(language))
            localStorage.setItem('me:theme', JSON.stringify(theme))
            if (theme === 'custom') localStorage.setItem('me:customColors', JSON.stringify({ primary: '#38594e', background: '#161f21', surface: '#202c2e', text: '#f4f0e5', secondary: '#d9c196' }))
            window.metrics = { lcp: 0, cls: 0 }
            new PerformanceObserver(l => { for (const e of l.getEntries()) window.metrics.lcp = e.startTime }).observe({ type: 'largest-contentful-paint', buffered: true })
            new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.metrics.cls += e.value }).observe({ type: 'layout-shift', buffered: true })
          }, { language, theme })
          await page.goto(base)
          await page.waitForFunction(({ language, theme }) => document.documentElement.lang === language && document.documentElement.dataset.theme === theme && !document.querySelector('.landing-motion').disabled, { language, theme })
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow: ${width}/${language}/${theme}`)
          assert.equal(await page.locator('.home').count(), 0)
          assert.equal(await page.locator('h1').count(), 1)
          assert.ok(await page.locator('h1').evaluate(n => parseFloat(getComputedStyle(n).fontSize) <= 48))
          const boxes = await page.evaluate(() => {
            const caption = document.querySelector('.cinema-captions').getBoundingClientRect()
            const controls = document.querySelector('.cinema-controls').getBoundingClientRect()
            const buttons = [...document.querySelectorAll('.cinema-controls button')].map(n => n.getBoundingClientRect())
            return { clear: caption.bottom <= controls.top, separate: buttons.every((b, i) => !i || buttons[i - 1].right <= b.left + 1) }
          })
          assert.equal(boxes.clear && boxes.separate, true, 'Controls must never overlap text or each other')
          const before = await snapshot(page)
          await page.waitForTimeout(250)
          assert.deepEqual((await snapshot(page)).layers, before.layers, 'Reduced motion must be static')
          assert.equal(before.animations.length, 0)
          await page.locator('.landing-studio__steps button').nth(2).focus()
          await page.keyboard.press('Space')
          assert.equal(await page.locator('.landing-studio__steps button').nth(2).getAttribute('aria-pressed'), 'true')
          assert.notEqual(await page.locator('.landing-studio__steps button').nth(2).evaluate(n => getComputedStyle(n).outlineStyle), 'none')
          await page.keyboard.press('Tab')
          await page.keyboard.press('Enter')
          assert.equal(await page.locator('.landing-studio__steps button').nth(3).getAttribute('aria-pressed'), 'true')
          await page.locator('.landing-faq summary').first().focus()
          await page.keyboard.press('Enter')
          assert.equal(await page.locator('.landing-faq details').first().getAttribute('open'), '')
          await page.keyboard.press('Enter')
          await page.evaluate(axe)
          const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })))
          const name = `${width}-${language}-${theme}`
          report.views.push({ name, violations, ...await page.evaluate(() => ({ ...window.metrics, pageHeight: document.documentElement.scrollHeight })) })
          assert.deepEqual(violations, [], `axe ${name}`)
          if ([390, 1440].includes(width)) { await page.evaluate(() => { document.activeElement.blur(); scrollTo(0,0) }); await capture(page, name, true) }
          await ctx.close()
        }
      }
    }
    // CSS zoom exercises 200% layout magnification, not a field/browser-UI zoom claim.
    const { ctx, page } = await context({ viewport: { width: 1440, height: 900 } })
    await page.goto(base)
    await page.evaluate(() => { document.documentElement.style.zoom = '2' })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    await capture(page, 'zoom-200')
    report.checks.push('CSS zoom 200%: no horizontal overflow')
    await ctx.close()

    for (const mode of ['nojs', 'saveData', 'slowDevice', 'failedImage']) {
      const { ctx, page } = await context({ viewport: { width: 390, height: 844 }, javaScriptEnabled: mode !== 'nojs' }, mode !== 'failedImage')
      if (mode === 'saveData') await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true } }))
      if (mode === 'slowDevice') await page.addInitScript(() => Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2 }))
      if (mode === 'failedImage') await page.route('**/*memory*.svg', route => route.abort())
      await page.goto(base)
      if (mode !== 'nojs') await page.waitForFunction(() => document.querySelector('.landing-motion')?.disabled === false)
      if (mode === 'failedImage') await page.locator('.has-fallback').waitFor()
      assert.equal(await page.locator('h1').isVisible(), true)
      assert.equal(await page.locator('.landing-hero a').getAttribute('href'), '#/registro')
      assert.equal(await page.locator('.landing-studio').getAttribute('data-running'), 'false')
      assert.equal(await page.locator('.cinema-poster').evaluate(n => n.complete && n.naturalWidth > 0), true)
      await capture(page, mode)
      report.checks.push(`${mode}: poster + content + CTA visible, no automatic motion`)
      await ctx.close()
    }
  }
  assert.deepEqual(report.errors, [])
  assert.deepEqual(report.failed, [])
  assert.deepEqual(report.externalRequests, [], 'Visitors must not call any remote/private API')
  report.bundles = []
  for (const name of await readdir(new URL('../dist/assets/', import.meta.url))) report.bundles.push({ name, bytes: (await stat(new URL('../dist/assets/' + name, import.meta.url))).size })
  report.status = 'PASS'
} catch (error) { report.status = 'FAIL'; report.error = error.stack; throw error }
finally {
  await writeFile(new URL(process.argv.includes('--motion-only') ? 'motion-checks.json' : 'checks.json', out), JSON.stringify(report, null, 2) + '\n')
  await browser.close()
  await new Promise(resolve => server.httpServer.close(resolve))
}
console.log(`PASS: ${report.motion.length} motion sequences, ${report.views.length} responsive/theme/language views, ${report.checks.length} fallback checks`)
