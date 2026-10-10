// Actual frontend interactions against an in-memory, synthetic API.
// Every non-static request is fulfilled or blocked; never reaches production.
import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { preview } from 'vite'
import es from '../src/translations/es.js'
const { chromium } = await import(process.env.PW_MODULE || 'playwright-core')
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const server = process.env.QA_BASE_URL ? null : await preview({ preview: { host: '127.0.0.1', port: 4183, strictPort: true } })
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4183/'
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Regression fixtures must run on a local frontend')
const report = { scope: 'Local UI + synthetic in-memory API. No real account, database, AI, lyrics service or external network.', base, widths: [], calls: [], negativeCases: [], unexpectedRequests: [], runtimeErrors: [], consoleErrors: [], status: 'PENDING' }
const token = 'synthetic-regression-token'
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
    const user = { id: 'qa-regression-account', name: 'Cuenta QA', username: 'cuenta_qa', email: 'qa@example.invalid', phone: '0000000000', active: true, createdAt: '2026-01-01T00:00:00Z' }
    const source = { title: 'Recuerdo QA', artist: 'Artista de prueba', genre: 'Instrumental', songId: '000000000000000000000001' }
    const recommendations = Array.from({ length: 11 }, (_, i) => ({ title: `Hallazgo QA ${i + 1}`, artist: 'Artista de prueba', reason: 'Motivo sintético para verificar la interfaz.', songId: (i + 2).toString(16).padStart(24, '0') }))
    const playlists = new Map()
    let history = null, duplicate = true, invalidLogin = false, expired = false, phase = 'normal'
    const passed = []
    const ok = name => passed.push(name)
    await context.route('**/*', async route => {
      const req = route.request(), url = new URL(req.url()), path = url.pathname.replace(/^\/api(?=\/)/, ''), method = req.method()
      if (url.origin === new URL(base).origin && (path === '/' || ['/assets/', '/src/', '/node_modules/', '/@vite/', '/@react-refresh', '/@fs/'].some(prefix => path.startsWith(prefix)) || path === '/favicon.svg')) return route.continue()
      const payload = req.postDataJSON()
      report.calls.push({ width, method, path, synthetic: true })
      const reply = (data, status = 200, auth = false) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(auth ? data : { success: status < 400, data }) })
      if (path === '/auth/providers') return reply({ email: true, google: false, apple: false, spotify: false }, 200, true)
      if (path === '/auth/signup') {
        assert.equal(payload.email, user.email)
        assert.equal(payload.username, user.username)
        if (duplicate) return reply({ message: 'Synthetic duplicate account' }, 409, true)
        return reply({ token, user }, 200, true)
      }
      if (path === '/auth/login') {
        if (invalidLogin) return reply({ message: 'Synthetic invalid credentials' }, 401, true)
        return reply({ token, user }, 200, true)
      }
      if (path === '/auth/me') return expired ? reply({ message: 'Synthetic expired session' }, 401, true) : reply({ user }, 200, true)
      if (path === '/search-songs') {
        assert.equal(req.headers().authorization, `Bearer ${token}`)
        assert.equal(payload.lyrics, 'Fragmento completamente ficticio para una prueba local.')
        const result = { found: true, song: source, recommendations, history: { status: 'saved', id: 'history-qa' } }
        history = { id: 'history-qa', createdAt: new Date().toISOString(), status: 'found', song: source, result, input: { original: {}, resolved: {} } }
        return reply(result)
      }
      if (path === '/songs/lyrics') {
        assert.equal(req.headers().authorization, undefined)
        return reply({ status: 'available', title: url.searchParams.get('title'), artist: url.searchParams.get('artist'), songId: url.searchParams.get('songId'), lyrics: 'Texto sintético de QA. No pertenece a ninguna canción.', lyricsStorage: 'transient', emotionAnalysis: { status: 'estimated' }, emotions: [{ code: 'calm', score: 40 }, { code: 'hope', score: 35 }, { code: 'joy', score: 25 }] })
      }
      if (path.startsWith('/playlists') || path.startsWith('/search-history') || path.startsWith('/playlist-personality/history')) assert.equal(req.headers().authorization, `Bearer ${token}`)
      if (path === '/playlists' && method === 'GET') return reply({ playlists: [...playlists.values()] })
      if (path === '/playlists' && method === 'POST') {
        assert.ok(payload.songs?.length > 0)
        assert.equal(JSON.stringify(payload).includes('Fragmento completamente'), false)
        assert.equal(JSON.stringify(payload).includes('Texto sintético'), false)
        const playlist = { id: 'playlist-qa', name: payload.name, description: payload.description, songs: payload.songs.map((song, i) => ({ ...song, id: `item-${i}` })), songCount: payload.songs.length, updatedAt: new Date().toISOString() }
        playlists.set(playlist.id, playlist)
        return reply({ playlist, addedCount: playlist.songCount, skippedCount: 0 })
      }
      if (path === '/playlists/playlist-qa') {
        if (method === 'PATCH') Object.assign(playlists.get('playlist-qa'), payload)
        if (method === 'DELETE') { playlists.delete('playlist-qa'); return reply({ deleted: true }) }
        return reply({ playlist: playlists.get('playlist-qa') })
      }
      if (path === '/playlists/playlist-qa/songs/order') {
        const playlist = playlists.get('playlist-qa')
        playlist.songs = payload.songIds.map(id => playlist.songs.find(song => song.id === id))
        return reply({ playlist })
      }
      if (path.startsWith('/playlists/playlist-qa/songs/') && method === 'DELETE') {
        const playlist = playlists.get('playlist-qa')
        playlist.songs = playlist.songs.filter(song => song.id !== path.split('/').at(-1))
        playlist.songCount = playlist.songs.length
        return reply({ playlist })
      }
      if (path === '/search-history') return reply({ entries: history ? [history] : [], nextCursor: null })
      if (path === '/search-history/history-qa') {
        if (method === 'DELETE') { history = null; return reply({ deleted: true }) }
        return reply({ entry: history })
      }
      if (path === '/playlist-personality/history') return reply({ entries: [], nextCursor: null })
      report.unexpectedRequests.push({ method, path })
      return route.abort()
    })
    const page = await context.newPage()
    page.on('pageerror', error => report.runtimeErrors.push(error.message))
    page.on('console', message => {
      if (message.type() !== 'error') return
      const item = { phase, message: message.text() }
      if (phase !== 'normal' && (/Auth error:|status of (401|409)/.test(message.text()))) report.negativeCases.push(item)
      else report.consoleErrors.push(item)
    })
    const navigate = async path => { await page.evaluate(path => { location.hash = '#/' + path }, path) }
    const submit = () => page.locator('.login__form button[type=submit]').click()
    const waitText = text => page.getByText(text, { exact: true }).first().waitFor()
    const shot = name => page.screenshot({ path: fileURLToPath(new URL(`../evidence/cinema/regression-${process.env.QA_BASE_URL ? 'dev-' : ''}${width}-${name}.png`, import.meta.url)), fullPage: true })
    await page.goto(base)
    await page.locator('.landing-hero a').click()
    await page.locator('#auth-name').waitFor()
    const before = report.calls.filter(c => c.path === '/auth/signup').length
    await submit()
    await waitText(es.login.errors.required)
    assert.equal(report.calls.filter(c => c.path === '/auth/signup').length, before)
    for (const [id, value] of Object.entries({ 'auth-name': user.name, 'auth-username': user.username, 'auth-email': user.email, 'auth-phone': user.phone, 'auth-password': 'short' })) await page.locator('#' + id).fill(value)
    await submit()
    await waitText(es.login.errors.passwordLength)
    assert.equal(report.calls.filter(c => c.path === '/auth/signup').length, before)
    await page.locator('#auth-password').fill('synthetic-password')
    phase = 'duplicate-signup'
    await submit()
    await waitText(es.login.errors.exists)
    assert.equal(await page.evaluate(() => localStorage.getItem('me:token')), null)
    duplicate = false
    phase = 'normal'
    await shot('registration')
    await submit()
    await page.locator('.home').waitFor()
    assert.equal(await page.locator('.landing').count(), 0)
    assert.equal(await page.locator('#home-tab-1').isDisabled(), true)
    ok('Registration: required fields, short password, duplicate account, valid signup → workspace')
    await page.reload()
    await page.locator('.home').waitFor()
    ok('Session restored after reload via /auth/me')

    await page.locator('#lyrics').fill('Fragmento completamente ficticio para una prueba local.')
    await page.getByRole('button', { name: es.discovery.submit, exact: true }).click()
    await page.locator('.song-card--source').waitFor()
    assert.equal(await page.locator('.recommendations__grid .song-card').count(), 11)
    await page.locator('.song-card--source').getByRole('button', { name: es.lyrics.show, exact: true }).click()
    await waitText('Texto sintético de QA. No pertenece a ninguna canción.')
    await waitText(es.emotions.title)
    assert.ok((await page.locator('.song-card--source a').evaluateAll(links => links.map(a => a.href))).some(href => href.includes('spotify.com/search')))
    await page.locator('.song-card--source input[type=checkbox]').check()
    await page.getByRole('button', { name: es.discovery.all, exact: true }).click()
    await page.getByRole('button', { name: es.playlists.saveSelection, exact: true }).click()
    await page.getByRole('dialog').getByLabel(es.playlists.name, { exact: true }).fill('Colección QA')
    await page.getByRole('button', { name: es.playlists.createWithSelection, exact: true }).click()
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
    assert.equal(playlists.get('playlist-qa').songCount, 12)
    ok('Search → 11 recommendations → source lyrics/emotions → select 12 songs → save playlist without lyrics')
    await shot('search')
    await navigate('playlists')
    await page.getByRole('link', { name: 'Colección QA', exact: true }).click()
    await page.locator('.playlist-songs li').nth(11).waitFor()
    await page.getByRole('button', { name: es.playlists.edit, exact: true }).click()
    await page.getByRole('dialog').getByLabel(es.playlists.name, { exact: true }).fill('Colección QA revisada')
    await page.getByRole('dialog').getByRole('button', { name: es.playlists.save, exact: true }).click()
    await page.getByRole('heading', { name: 'Colección QA revisada', exact: true }).waitFor()
    await page.getByRole('button', { name: 'Subir Hallazgo QA 1', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('.playlist-songs li .song-card__title')?.textContent.includes('Hallazgo QA 1'))
    await page.getByRole('button', { name: 'Quitar Hallazgo QA 1', exact: true }).click()
    await page.getByRole('button', { name: es.table.confirmDelete, exact: true }).click()
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
    assert.equal(playlists.get('playlist-qa').songCount, 11)
    await shot('playlist')
    ok('Playlists: list/detail, edit, reorder and remove a song')

    await navigate('historial')
    await page.getByRole('link', { name: `${source.title} — ${source.artist}`, exact: true }).click()
    await page.locator('.history-page .song-card--source').waitFor()
    await shot('history')
    await page.getByRole('button', { name: es.history.delete, exact: true }).click()
    await page.getByRole('button', { name: es.table.confirmDelete, exact: true }).click()
    await waitText(es.history.empty)
    ok('Search history: list, detail, saved result and deletion')
    await navigate('playlists/playlist-qa')
    await page.getByRole('button', { name: es.playlists.delete, exact: true }).click()
    await page.getByRole('button', { name: es.table.confirmDelete, exact: true }).click()
    await waitText(es.playlists.empty)
    ok('Playlist deletion returns to the empty list')

    await navigate('perfil')
    await page.locator('.profile').waitFor()
    await page.getByRole('button', { name: es.profile.edit, exact: true }).click()
    await page.locator('#edit-display-name').fill('Cuenta QA editada')
    await page.getByRole('dialog').getByRole('button', { name: es.profile.save, exact: true }).click()
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
    await page.locator('.profile').getByText('Cuenta QA editada', { exact: true }).waitFor()
    await navigate('cuenta')
    await page.locator('.account__name').waitFor()
    assert.equal(await page.locator('.account__name').innerText(), 'Cuenta QA editada')
    ok('Profile edit and account view (existing local profile behavior)')
    await navigate('analisis')
    await waitText(es.personality.empty)
    ok('Analysis history remains navigable; new analysis still disabled')
    await navigate('ajustes')
    await page.getByRole('radio', { name: /Claro/ }).click()
    await page.getByRole('radio', { name: 'English', exact: true }).click()
    await page.reload()
    await page.waitForFunction(() => document.documentElement.lang === 'en' && document.documentElement.dataset.theme === 'light')
    await page.getByRole('radio', { name: 'Español', exact: true }).click()
    ok('Language/theme controls survive reload while signed in')

    await page.getByRole('button', { name: 'Abrir menú de perfil', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Cerrar sesión', exact: true }).click()
    await navigate('')
    await page.locator('.landing').waitFor()
    assert.equal(await page.evaluate(() => localStorage.getItem('me:token')), null)
    await navigate('playlists')
    await page.waitForURL('**/#/login')
    await page.locator('#auth-email').fill(user.email)
    await page.locator('#auth-password').fill('synthetic-wrong-password')
    invalidLogin = true
    phase = 'invalid-login'
    await submit()
    await waitText(es.login.errors.credentials)
    assert.equal(await page.evaluate(() => localStorage.getItem('me:token')), null)
    invalidLogin = false
    phase = 'normal'
    await page.locator('#auth-password').fill('synthetic-password')
    await submit()
    await page.waitForURL('**/#/playlists')
    await waitText(es.playlists.empty)
    ok('Logout, protected route, wrong password, valid login returns to requested private route')
    phase = 'expired-session'
    expired = true
    await page.reload()
    await page.waitForURL('**/#/login')
    await page.locator('#auth-email').waitFor()
    assert.equal(await page.evaluate(() => localStorage.getItem('me:token')), null)
    assert.equal(await page.locator('.playlist-page').count(), 0)
    ok('Expired session on reload clears token and guards private content')
    report.widths.push({ width, passed })
    await context.close()
  }
  assert.deepEqual(report.unexpectedRequests, [])
  assert.deepEqual(report.runtimeErrors, [])
  assert.deepEqual(report.consoleErrors, [])
  report.status = 'PASS'
} catch (error) { report.status = 'FAIL'; report.error = error.stack; throw error }
finally {
  await writeFile(new URL(`../evidence/cinema/product-${process.env.QA_BASE_URL ? 'dev-' : ''}regressions.json`, import.meta.url), JSON.stringify(report, null, 2) + '\n')
  await browser.close()
  if (server) await new Promise(resolve => server.httpServer.close(resolve))
}
console.log(`PASS: ${report.widths.length} desktop/mobile end-to-end frontend journeys; no real API calls`)
