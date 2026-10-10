// Run with xvfb-run -a for a genuine foreground/background-tab test.
import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { preview } from 'vite'
const { chromium } = await import(process.env.PW_MODULE || 'playwright-core')
const { launch } = await import(process.env.CHROME_LAUNCHER_MODULE || 'chrome-launcher')
const server = await preview({ preview: { host: '127.0.0.1', port: 4181, strictPort: true } })
// Attach without Playwright's forced-active-page override: otherwise every tab
// reports document.hidden=false even in headed mode, invalidating this test.
const chrome = await launch({ chromePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', chromeFlags: ['--no-sandbox', '--window-size=1440,1000'] })
const browser = await chromium.connectOverCDP(`http://127.0.0.1:${chrome.port}`, { noDefaults: true })
const results = { browser: browser.version(), checks: [], status: 'PENDING' }
const state = page => page.evaluate(() => ({ hidden: document.hidden, running: document.querySelector('.landing-studio').dataset.running, animations: document.querySelector('.landing-studio').getAnimations({ subtree: true }).filter(a => a.effect.getTiming().iterations === Infinity).map(a => ({ state: a.playState, time: a.currentTime })) }))
try {
  const context = browser.contexts()[0]
  await context.route('**/*', route => /^https?:/.test(route.request().url()) && !route.request().url().startsWith('http://127.0.0.1:4181/') ? route.abort() : route.continue())
  const page = await context.newPage()
  await page.bringToFront()
  await page.goto('http://127.0.0.1:4181/')
  await page.waitForFunction(() => document.querySelector('.landing-studio').dataset.running === 'true')
  await page.waitForTimeout(1000)
  const tab = await context.newPage()
  await tab.goto('about:blank')
  await tab.bringToFront()
  // Background tabs suspend requestAnimationFrame, so poll via timers here.
  await page.waitForFunction(() => document.hidden && document.querySelector('.landing-studio').dataset.running === 'false', null, { polling: 100 })
  await page.waitForTimeout(200)
  const paused = await state(page)
  await page.waitForTimeout(1200)
  assert.deepEqual(await state(page), paused)
  assert.ok(paused.animations.every(a => a.state === 'paused'))
  await page.bringToFront()
  await page.waitForFunction(() => !document.hidden && document.querySelector('.landing-studio').dataset.running === 'true')
  await page.waitForTimeout(350)
  assert.notDeepEqual((await state(page)).animations, paused.animations)
  results.checks.push({ backgroundTab: 'PASS', realDocumentHidden: paused.hidden, paused, resumed: await state(page) })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForFunction(() => document.querySelector('.landing-studio').dataset.running === 'false')
  assert.equal((await state(page)).animations.length, 0)
  await page.locator('.landing-studio__steps button').nth(4).click()
  assert.equal(await page.locator('.landing-studio').getAttribute('data-scene'), '4')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.waitForFunction(() => document.querySelector('.landing-studio').dataset.running === 'true')
  results.checks.push({ liveReducedMotionChange: 'PASS', manualSelectionInReducedMotion: 'PASS' })
  await page.getByRole('button', { name: 'Pausar animación', exact: true }).click()
  await tab.bringToFront()
  await page.waitForFunction(() => document.hidden, null, { polling: 100 })
  await page.bringToFront()
  await page.waitForTimeout(350)
  assert.equal((await state(page)).running, 'false', 'Returning to tab must not override user pause')
  results.checks.push({ userPauseSurvivesTabReturn: 'PASS' })
  await tab.close()
  await page.close()

  const fileContext = await browser.newContext()
  const filePage = await fileContext.newPage()
  const errors = []
  filePage.on('pageerror', e => errors.push(e.message))
  filePage.on('requestfailed', r => errors.push(r.url()))
  await filePage.goto(new URL('../index.html', import.meta.url).href)
  await filePage.bringToFront()
  await filePage.waitForTimeout(500)
  await filePage.waitForFunction(() => document.querySelector('.landing-studio')?.dataset.running === 'true')
  assert.equal(await filePage.locator('h1').count(), 1)
  assert.equal(await filePage.locator('.cinema-frame img').evaluateAll(nodes => nodes.every(n => n.complete && n.naturalWidth > 0)), true)
  await filePage.locator('.landing-studio__steps button').nth(2).click()
  assert.equal(await filePage.locator('.landing-studio').getAttribute('data-scene'), '2')
  assert.deepEqual(errors, [])
  results.checks.push({ standaloneFileProtocol: 'PASS', allSceneImagesLoaded: true, errors })
  await fileContext.close()
  results.status = 'PASS'
} catch (error) { results.status = 'FAIL'; results.error = error.stack; throw error }
finally {
  await writeFile(new URL('../evidence/cinema/context-checks.json', import.meta.url), JSON.stringify(results, null, 2) + '\n')
  await browser.close()
  await chrome.kill()
  await new Promise(r => server.httpServer.close(r))
}
console.log('PASS: real background tab, runtime reduced motion, pause persistence, standalone file://')
