// Optional QA tools live outside the application dependency tree.
// PW_MODULE=/path/to/playwright-core/index.mjs AXE_PATH=/path/to/axe.min.js npm run test:seo:browser
import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createServer as httpServer } from 'node:http'
import { preview, createServer } from 'vite'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const root = fileURLToPath(new URL('../', import.meta.url))
const out = new URL('../evidence/seo-geo/', import.meta.url)
await mkdir(out, { recursive: true })
const { chromium } = await import(process.env.PW_MODULE || 'playwright-core')
const axe = await readFile(process.env.AXE_PATH, 'utf8')
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] })
const server = await preview({ root, preview: { host: '127.0.0.1', port: 4173, strictPort: true } })
const dev = await createServer({ root, server: { host: '127.0.0.1', port: 4174, strictPort: true } })
await dev.listen()
const standaloneHtml = await readFile(new URL('../index.html', import.meta.url))
const standalone = httpServer((_req, res) => { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(standaloneHtml) })
await new Promise(resolve => standalone.listen(4175, '127.0.0.1', resolve))
const base = 'http://127.0.0.1:4173/'
const results = { browser: browser.version(), http: [], views: [], flows: [], scope: 'Local build; authentication API responses are fixtures, not a live account.' }
const image = 'https://res.cloudinary.com/qbrotguz/image/upload/v1791588468/musica-epica-descrubre-tu-cancion.png'

async function capture(page, name) {
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0) })
  await page.screenshot({ path: fileURLToPath(new URL(name + '.png', out)), fullPage: true, animations: 'disabled' })
}

async function auditA11y(page) {
  await page.evaluate(axe)
  const { violations } = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }))
  return violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }))
}

function observe(page) {
  const errors = [], failed = [], requests = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('request', r => requests.push(r.url()))
  page.on('requestfailed', r => failed.push({ url: r.url(), error: r.failure()?.errorText }))
  page.on('response', r => { if (r.status() >= 400) failed.push({ url: r.url(), status: r.status() }) })
  return { errors, failed, requests }
}

try {
  for (const path of ['', 'robots.txt', 'sitemap.xml', 'seo-unknown-path', 'playlists']) {
    const response = await fetch(base + path)
    const body = await response.text()
    const type = response.headers.get('content-type')
    assert.equal(response.status, ['seo-unknown-path', 'playlists'].includes(path) ? 404 : 200)
    if (path === 'robots.txt') assert.match(type, /text\/plain/)
    if (path === 'sitemap.xml') assert.match(type, /(?:text|application)\/xml/)
    if (!path) await writeFile(new URL('local-http.html', out), body)
    results.http.push({ url: base + path, status: response.status, type, bytes: Buffer.byteLength(body) })
  }
  for (const agent of ['facebookexternalhit/1.1', 'Twitterbot/1.0', 'OAI-SearchBot/1.4', 'Googlebot', 'bingbot']) {
    const response = await fetch(base, { headers: { 'User-Agent': agent } })
    assert.equal(await response.text(), await readFile(new URL('local-http.html', out), 'utf8'))
    results.http.push({ agent, status: response.status, sameHTML: true })
  }
  const htmlCheck = await promisify(execFile)('python3', ['scripts/check-seo.py', 'dist/index.html', 'index.html', base, 'http://127.0.0.1:4174/', 'http://127.0.0.1:4174/?utm_source=qa', 'http://127.0.0.1:4175/'], { cwd: root })
  console.log(htmlCheck.stdout)

  let initialFaq
  for (const javaScriptEnabled of [false, true]) {
    for (const language of javaScriptEnabled ? ['es', 'en'] : ['es']) {
      for (const width of [320, 390, 768, 1366, 1440]) {
        const context = await browser.newContext({ javaScriptEnabled, viewport: { width, height: 900 }, reducedMotion: 'reduce' })
        if (language === 'en') await context.addInitScript(() => localStorage.setItem('me:language', JSON.stringify('en')))
        await context.addInitScript(() => {
          window.__shifts = 0
          new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__shifts += e.value }).observe({ type: 'layout-shift', buffered: true })
        })
        const page = await context.newPage()
        const log = observe(page)
        await page.goto(base)
        await page.locator('.landing-faq').waitFor()
        if (javaScriptEnabled) await page.waitForFunction(lang => document.documentElement.lang === lang && !document.querySelector('.landing-motion')?.disabled, language)
        assert.equal(await page.locator('h1').count(), 1)
        assert.equal(await page.locator('html').getAttribute('lang'), language)
        assert.equal(await page.locator('.landing-faq details').count(), 7)
        const faq = await page.locator('.landing-faq').textContent()
        if (!javaScriptEnabled) initialFaq = faq
        else if (language === 'es') assert.equal(faq, initialFaq)
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow ${width}/${language}/${javaScriptEnabled}`)
        const summary = page.locator('.landing-faq summary').first()
        await summary.focus()
        await page.keyboard.press('Enter')
        assert.equal(await page.locator('.landing-faq details').first().getAttribute('open'), '')
        await page.keyboard.press('Enter')
        const name = `${javaScriptEnabled ? 'js' : 'nojs'}-${language}-${width}`
        if ([390, 1366].includes(width)) await capture(page, name)
        // axe relies on page timers; with JS disabled use the native keyboard,
        // heading, overflow and visual checks above instead of re-enabling JS.
        const axeRun = javaScriptEnabled && [390, 1366].includes(width)
        const violations = axeRun ? await auditA11y(page) : []
        const cls = javaScriptEnabled ? await page.evaluate(() => window.__shifts) : null
        results.views.push({ name, h1: await page.locator('h1').innerText(), axeRun, violations, cls, errors: log.errors, failed: log.failed, socialImageDownloaded: log.requests.includes(image) })
        assert.deepEqual(violations, [], `a11y ${name}`)
        assert.deepEqual(log.errors, [], `console ${name}`)
        assert.deepEqual(log.failed, [], `network ${name}`)
        assert.equal(log.requests.includes(image), false)
        await context.close()
      }
    }
  }

  // Browser contracts for authentication, never send fixture credentials to a real API.
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const calls = []
  const user = { id: 'qa-account', name: 'QA Fixture', username: 'qa_fixture', email: 'qa@example.invalid', active: true, createdAt: '2026-01-01T00:00:00Z' }
  await context.route('**/auth/**', async route => {
    const path = new URL(route.request().url()).pathname
    calls.push({ path, method: route.request().method() })
    const body = path.endsWith('/providers') ? { email: true } : path.endsWith('/me') ? { user } : { token: 'qa-fixture-token-not-a-real-jwt', user }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) })
  })
  const page = await context.newPage()
  const log = observe(page)
  await page.goto(base)
  await page.locator('.landing-hero a').click()
  await page.locator('#auth-name').waitFor()
  assert.ok(page.url().endsWith('#/registro'))
  await capture(page, 'registration-390')
  // Fill/submit actual registration form against fixtures.
  for (const [id, value] of Object.entries({ 'auth-name': 'QA Fixture', 'auth-username': 'qa_fixture', 'auth-email': 'qa@example.invalid', 'auth-phone': '0000000000', 'auth-password': 'fixture-password' })) await page.locator('#' + id).fill(value)
  await page.locator('form button[type=submit]').click()
  await page.locator('.home').waitFor()
  assert.equal(await page.locator('.landing').count(), 0)
  assert.equal(await page.locator('#home-tab-1').isDisabled(), true)
  await page.reload()
  await page.locator('.home').waitFor()
  assert.ok(calls.some(c => c.path.endsWith('/me')))
  await page.getByRole('button', { name: 'Abrir menú de perfil', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Cerrar sesión', exact: true }).click()
  await page.locator('.landing').waitFor()
  assert.equal(await page.evaluate(() => localStorage.getItem('me:token')), null)
  for (const path of ['playlists', 'historial', 'analisis', 'perfil', 'cuenta']) {
    await page.goto(base + '#/' + path)
    await page.waitForURL('**/#/login')
    await page.locator('#auth-email').waitFor()
    assert.equal(await page.locator('.landing-faq').count(), 0)
  }
  // A fresh root login has no private return path.
  await page.goto(base)
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
  await page.locator('#auth-email').fill('qa@example.invalid')
  await page.locator('#auth-password').fill('fixture-password')
  await page.locator('form button[type=submit]').click()
  await page.locator('.home').waitFor()
  await page.reload()
  await page.locator('.home').waitFor()
  results.flows.push({ registration: 'PASS (fixture API)', login: 'PASS (fixture API)', reentry: 'PASS (fixture API)', logout: 'PASS', guards: 5, analysisDisabled: true, calls, errors: log.errors, failed: log.failed })
  assert.deepEqual(log.errors, [])
  assert.deepEqual(log.failed, [])
  await context.close()

  // UI language switch, persisted preference, theme and unchanged illustration controls.
  const preferences = await browser.newContext({ viewport: { width: 1366, height: 900 } })
  const prefPage = await preferences.newPage()
  await prefPage.goto(base)
  await prefPage.getByRole('button', { name: 'Ajustes', exact: true }).click()
  await prefPage.getByRole('radio', { name: 'English', exact: true }).click()
  await prefPage.locator('.brand').click()
  await prefPage.locator('.landing-faq').waitFor()
  assert.equal(await prefPage.locator('html').getAttribute('lang'), 'en')
  await prefPage.reload()
  await prefPage.waitForFunction(() => document.documentElement.lang === 'en')
  await prefPage.locator('.landing-studio__steps button').nth(1).click()
  assert.equal(await prefPage.locator('.landing-studio__steps button').nth(1).getAttribute('aria-pressed'), 'true')
  await prefPage.getByRole('button', { name: 'Pause animation', exact: true }).click()
  assert.match(await prefPage.locator('.landing-studio').getAttribute('class'), /is-paused/)
  await prefPage.evaluate(() => localStorage.setItem('me:theme', JSON.stringify('light')))
  await prefPage.reload()
  await prefPage.waitForFunction(() => document.documentElement.dataset.theme === 'light')
  await capture(prefPage, 'js-en-light-1366')
  assert.deepEqual(await auditA11y(prefPage), [])
  results.flows.push({ languageSwitchAndReload: 'PASS', lightTheme: 'PASS', illustrationAndPause: 'PASS' })
  await preferences.close()

  for (const url of ['http://127.0.0.1:4174/', 'http://127.0.0.1:4175/']) {
    const page = await browser.newPage()
    const log = observe(page)
    await page.goto(url)
    await page.waitForFunction(() => document.querySelector('.landing-motion')?.disabled === false)
    assert.equal(await page.locator('h1').count(), 1)
    assert.deepEqual(log.errors, [])
    results.flows.push({ url, landing: 'PASS', errors: log.errors })
    await page.close()
  }
  results.status = 'PASS'
} catch (error) {
  results.status = 'FAIL'
  results.error = error.stack
  throw error
} finally {
  await writeFile(new URL('browser-checks.json', out), JSON.stringify(results, null, 2) + '\n')
  await browser.close()
  await dev.close()
  await new Promise(resolve => server.httpServer.close(resolve))
  await new Promise(resolve => standalone.close(resolve))
}
console.log(`PASS: ${results.views.length} responsive/language/JS views; HTTP, a11y and fixture-auth flows. See evidence/seo-geo/browser-checks.json`)
