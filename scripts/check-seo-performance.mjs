// LH_MODULE=/path/to/lighthouse/core/index.js CHROME_LAUNCHER_MODULE=/path/to/chrome-launcher/dist/index.js node scripts/check-seo-performance.mjs
import { writeFile } from 'node:fs/promises'
import { preview } from 'vite'
import { pathToFileURL } from 'node:url'

const { default: lighthouse } = await import(process.env.LH_MODULE || 'lighthouse')
const { default: desktopConfig } = await import(process.env.LH_MODULE ? new URL('./config/desktop-config.js', pathToFileURL(process.env.LH_MODULE)).href : 'lighthouse/core/config/desktop-config.js')
const { launch } = await import(process.env.CHROME_LAUNCHER_MODULE || 'chrome-launcher')
const server = await preview({ preview: { port: 4176, host: '127.0.0.1', strictPort: true } })
const chrome = await launch({ chromePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', chromeFlags: ['--headless', '--no-sandbox'] })
const results = []
try {
  for (const preset of ['mobile', 'desktop']) {
    const { lhr } = await lighthouse('http://127.0.0.1:4176/', {
      port: chrome.port, onlyCategories: ['performance', 'accessibility', 'seo'],
    }, preset === 'desktop' ? desktopConfig : undefined)
    const ids = ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index', 'total-byte-weight', 'render-blocking-resources', 'unused-javascript', 'font-display']
    results.push({ preset, fetchTime: lhr.fetchTime, lighthouseVersion: lhr.lighthouseVersion, formFactor: lhr.configSettings.formFactor,
      scores: Object.fromEntries(Object.entries(lhr.categories).map(([id, c]) => [id, c.score])),
      audits: Object.fromEntries(ids.filter(id => lhr.audits[id]).map(id => [id, { score: lhr.audits[id].score, numericValue: lhr.audits[id].numericValue, displayValue: lhr.audits[id].displayValue }])),
      failedAudits: Object.values(lhr.audits).filter(a => a.score !== null && a.score < 1).map(a => ({ id: a.id, title: a.title, score: a.score, displayValue: a.displayValue })),
      warnings: lhr.runWarnings, scope: 'Single local lab run, not field Core Web Vitals; no INP claim.' })
    console.log(preset, JSON.stringify(results.at(-1).scores))
  }
  await writeFile(new URL('../evidence/seo-geo/performance.json', import.meta.url), JSON.stringify(results, null, 2) + '\n')
} finally {
  await chrome.kill()
  await new Promise(resolve => server.httpServer.close(resolve))
}
