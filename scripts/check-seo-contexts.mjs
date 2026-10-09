import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const run = promisify(execFile)
const results = []
for (const context of ['production', 'deploy-preview', 'branch-deploy']) {
  const dir = await mkdtemp('/tmp/opencode/epic-seo-context-')
  const { stdout } = await run('npm', ['run', 'build', '--', '--outDir', dir], { cwd: root, env: { ...process.env, CONTEXT: context } })
  const html = await readFile(`${dir}/index.html`, 'utf8')
  const headers = await readFile(`${dir}/_headers`, 'utf8').catch(() => '')
  assert.ok(html.includes(context === 'production' ? 'content="index, follow, max-image-preview:large"' : 'content="noindex, follow"'))
  assert.equal(headers, context === 'production' ? '' : '/*\n  X-Robots-Tag: noindex, follow\n')
  assert.ok(html.includes('href="https://musica-epica-ed.netlify.app/"'))
  await run('python3', ['scripts/check-seo.py', ...(context === 'production' ? [] : ['--preview']), `${dir}/index.html`], { cwd: root })
  results.push({ context, status: 'PASS', robots: context === 'production' ? 'index, follow, max-image-preview:large' : 'noindex, follow', headers, stdout })
  console.log('PASS', context)
}
await writeFile(new URL('../evidence/seo-geo/context-checks.json', import.meta.url), JSON.stringify(results, null, 2) + '\n')
