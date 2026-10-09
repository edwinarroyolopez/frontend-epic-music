// Final, reproducible regression log and source diff (evidence excluded).
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile, writeFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const out = new URL('../evidence/seo-geo/', import.meta.url)
const run = promisify(execFile)
const checks = []
for (const [command, args] of [['npm', ['run', 'lint']], ['npm', ['test']], ['git', ['diff', '--check']]]) {
  const { stdout, stderr } = await run(command, args, { cwd: root })
  checks.push({ command: [command, ...args].join(' '), exitCode: 0, stdout, stderr })
  console.log('PASS', checks.at(-1).command)
}
const tracked = await run('git', ['diff', '--', '.', ':!evidence'], { cwd: root })
const untracked = (await run('git', ['ls-files', '--others', '--exclude-standard'], { cwd: root })).stdout.trim().split('\n').filter(path => path && !path.startsWith('evidence/'))
let patch = tracked.stdout
for (const path of untracked) {
  try { patch += (await run('git', ['diff', '--no-index', '--', '/dev/null', path], { cwd: root })).stdout }
  catch (error) { if (error.code !== 1) throw error; patch += error.stdout }
}
const files = ['dist/index.html', 'index.html', ...(await readdir(new URL('../dist/assets/', import.meta.url))).map(name => `dist/assets/${name}`)]
const artifacts = []
for (const path of files) {
  const bytes = await readFile(new URL('../' + path, import.meta.url))
  artifacts.push({ path, bytes: bytes.length, gzipBytes: gzipSync(bytes).length, sha256: createHash('sha256').update(bytes).digest('hex') })
}
const backendStatus = (await run('git', ['status', '--short'], { cwd: new URL('../../backend-epic-music/', import.meta.url) })).stdout
await writeFile(new URL('source.diff', out), patch)
await writeFile(new URL('regression-checks.json', out), JSON.stringify({ checks, artifacts, backendStatus }, null, 2) + '\n')
console.log('Recorded source.diff and regression-checks.json')
