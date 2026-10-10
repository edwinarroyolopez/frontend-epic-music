// Regression: a production optimizer/build must not poison a live dev JSX runtime.
// QA_BASE_URL=http://localhost:3000/ uses the user's existing local dev server.
import assert from 'node:assert/strict'
import { fork, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

if (process.argv.includes('--production-worker')) {
  const server = await createServer({ mode: 'development', server: { host: '127.0.0.1', port: 4191, strictPort: true, hmr: false } })
  await server.listen()
  process.send({ ready: true, cacheDir: server.config.cacheDir, isProduction: server.config.isProduction })
  process.on('message', async message => { if (message === 'close') { await server.close(); process.exit(0) } })
} else {
  const { chromium } = await import(process.env.PW_MODULE || 'playwright-core')
  const ownedServer = process.env.QA_BASE_URL ? null : await createServer({ server: { host: '127.0.0.1', port: 4190, strictPort: true } })
  await ownedServer?.listen()
  const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4190/'
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname))
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
  const report = { base, scope: 'Actual local dev server, production optimizer in a separate process, production build, then dev reload. No live authentication requests.', checks: [], errors: [], status: 'PENDING' }
  let worker
  async function pageFor(url) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await context.route('**/*', route => {
      const req = new URL(route.request().url())
      if (req.pathname.endsWith('/auth/providers')) return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ email: true }) })
      if (/^https?:/.test(req.protocol) && req.origin !== new URL(url).origin) return route.abort()
      return route.continue()
    })
    const page = await context.newPage()
    page.on('pageerror', error => report.errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()) })
    return { context, page }
  }
  async function inspectDev(page, stage) {
    await page.goto(base + '#/login')
    await page.locator('#auth-email').waitFor()
    assert.equal(await page.locator('.landing').count(), 0, 'React must replace the prerendered landing on #/login')
    const runtime = await page.evaluate(async () => {
      const main = await (await fetch('/src/main.jsx')).text()
      const path = main.match(/"([^"\n]*react_jsx-dev-runtime[^"\n]*)"/)?.[1]
      if (!path) return { jsxDevCalled: main.includes('_jsxDEV('), path: null }
      const module = await import(path)
      return { jsxDevCalled: main.includes('_jsxDEV('), path, jsxDEV: typeof (module.default?.jsxDEV || module.jsxDEV) }
    })
    assert.equal(runtime.jsxDevCalled, true, 'Exercise the actual development transform')
    assert.equal(runtime.jsxDEV, 'function')
    await page.locator('.brand').click()
    await page.waitForFunction(() => document.querySelector('.landing-motion')?.disabled === false)
    await page.locator('.landing-studio__steps button').nth(4).click()
    assert.equal(await page.locator('.landing-studio').getAttribute('data-scene-id'), 'archive')
    report.checks.push({ stage, loginFormMounted: true, interactiveScenes: true, runtime })
  }
  try {
    const { context, page } = await pageFor(base)
    await inspectDev(page, 'before-production-process')
    worker = fork(fileURLToPath(import.meta.url), ['--production-worker'], { env: { ...process.env, NODE_ENV: 'production' }, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] })
    const ready = await new Promise((resolve, reject) => {
      worker.once('message', resolve)
      worker.once('error', reject)
      worker.once('exit', code => reject(new Error(`Production worker exited before readiness: ${code}`)))
    })
    assert.equal(ready.isProduction, true)
    assert.match(ready.cacheDir, /client-development-production$/)
    report.productionOptimizer = ready
    const other = await pageFor('http://127.0.0.1:4191/')
    await other.page.goto('http://127.0.0.1:4191/#/login')
    await other.page.locator('#auth-email').waitFor()
    await other.context.close()
    await inspectDev(page, 'after-production-optimizer')
    const { stdout, stderr } = await promisify(execFile)('npm', ['run', 'build'], { cwd: new URL('../', import.meta.url) })
    report.build = { status: 'PASS', stdout, stderr }
    const pages = await Promise.all(Array.from({ length: 6 }, () => fetch(base).then(r => r.text())))
    assert.ok(pages.every(html => html.includes('id="landing-title"') && html.includes('application/ld+json')))
    await inspectDev(page, 'after-build-and-six-prerenders')
    await page.goto(base + '#/login')
    await page.locator('#auth-email').waitFor()
    await page.screenshot({ path: fileURLToPath(new URL('../evidence/cinema/dev-runtime-login-fixed.png', import.meta.url)), fullPage: true })
    assert.deepEqual(report.errors, [])
    await context.close()
    report.status = 'PASS'
  } catch (error) { report.status = 'FAIL'; report.error = error.stack; throw error }
  finally {
    if (worker?.connected) { worker.send('close'); await new Promise(resolve => worker.once('exit', resolve)) }
    await writeFile(new URL('../evidence/cinema/dev-runtime-checks.json', import.meta.url), JSON.stringify(report, null, 2) + '\n')
    await browser.close()
    await ownedServer?.close()
  }
  console.log('PASS: dev jsxDEV remains a function before/after production optimization, build and repeated prerender; login and scenes respond')
}
