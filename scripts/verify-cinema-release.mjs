// Reproducible local release gate + bounded changed-file/hash inventory.
// Browser suites are separate; their actual reports must already be PASS.
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const run = promisify(execFile)
const root = new URL('../', import.meta.url)
const results = { commands: [], checks: [], status: 'PENDING' }
const hash = value => createHash('sha256').update(value).digest('hex')
if (!process.argv.includes('--inventory-only')) {
try {
  for (const [command, args] of [['npm', ['test']], ['npm', ['run', 'lint']], ['npm', ['run', 'test:seo']], ['git', ['diff', '--check']]]) {
    const { stdout, stderr } = await run(command, args, { cwd: root, maxBuffer: 4 * 1024 * 1024 })
    results.commands.push({ command: [command, ...args].join(' '), status: 'PASS', stdout, stderr })
    console.log('PASS', command, ...args)
  }
  for (const file of ['evidence/cinema/checks.json', 'evidence/cinema/context-checks.json', 'evidence/cinema/scene-coherence.json', 'evidence/cinema/product-regressions.json', 'evidence/cinema/product-dev-regressions.json', 'evidence/cinema/dev-runtime-checks.json', 'evidence/seo-geo/browser-checks.json']) {
    const report = JSON.parse(await readFile(new URL(file, root), 'utf8'))
    assert.equal(report.status, 'PASS', file)
    results.checks.push({ file, status: report.status, sha256: hash(await readFile(new URL(file, root))) })
  }
  // Vite config/public-html-plugin are intentionally changed to fix JSX runtime
  // cache pollution; their SEO/output contracts are exercised by browser tests.
  const protectedPaths = ['src/App.jsx', 'src/main.jsx', 'src/prerender.jsx', 'src/context', 'src/services', 'src/hooks', 'src/themes', 'src/pages/Login.jsx', 'src/pages/Home.jsx', 'src/pages/Playlists.jsx', 'src/pages/Profile.jsx', 'src/pages/Account.jsx', 'dev.html', 'netlify.toml', 'public/robots.txt', 'public/sitemap.xml', 'package.json', 'package-lock.json', 'test']
  const { stdout: protectedDiff } = await run('git', ['diff', '--name-only', '--', ...protectedPaths], { cwd: root })
  assert.equal(protectedDiff, '')
  for (const lang of ['es', 'en']) {
    const path = `src/translations/${lang}.js`
    const { stdout: original } = await run('git', ['show', `HEAD:${path}`], { cwd: root })
    assert.equal((await readFile(new URL(path, root), 'utf8')).split('  reidentify:')[1], original.split('  reidentify:')[1], 'Only landing translations may change')
  }
  results.checks.push({ protectedPaths, nonLandingTranslations: 'unchanged', status: 'PASS' })
  const manifest = JSON.parse(await readFile(new URL('src/assets/cinema/manifest.json', root), 'utf8'))
  for (const asset of manifest.assets) {
    const source = await readFile(new URL(asset.file, root))
    assert.equal(source.length, asset.bytes)
    assert.equal(hash(source), asset.sha256)
    assert.match(source.toString(), /<svg[^>]+viewBox="0 0 1000 700"/)
  }
  results.checks.push({ originalAssets: manifest.assets.length, totalBytes: manifest.assets.reduce((n, a) => n + a.bytes, 0), hashes: 'PASS' })
  results.status = 'PASS'
} catch (error) { results.status = 'FAIL'; results.error = error.stack; throw error }
finally { await writeFile(new URL('evidence/cinema/release-checks.json', root), JSON.stringify(results, null, 2) + '\n') }
}

const { stdout } = await run('git', ['ls-files', '--modified', '--others', '--exclude-standard', '-z'], { cwd: root })
const files = [...new Set(stdout.split('\0').filter(Boolean))].filter(file => !['evidence/cinema/changed-files.json', 'evidence/cinema/SHA256SUMS'].includes(file)).sort()
await writeFile(new URL('evidence/cinema/changed-files.json', root), JSON.stringify({ scope: 'Exact modified/untracked deliverables; excludes this inventory and SHA256SUMS themselves. Ignored dist/ and standalone index.html are reproducible build outputs.', files }, null, 2) + '\n')
files.push('evidence/cinema/changed-files.json')
const sums = []
for (const file of files) sums.push(`${hash(await readFile(new URL(file, root)))}  ${file}`)
await writeFile(new URL('evidence/cinema/SHA256SUMS', root), sums.join('\n') + '\n')
console.log(`Inventory: ${files.length} deliverables hashed. See evidence/cinema/release-checks.json for gate results.`)
