import { existsSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import puppeteer from 'puppeteer-core'
import { browserLaunchOptions } from './browser-runtime.mjs'

const outputDir = process.env.UI_CAPTURE_DIR || '/tmp/llmstudy-ui-redesign'
const beforeLabel = process.env.UI_COMPARE_BEFORE_LABEL || 'before'
const afterLabel = process.env.UI_COMPARE_AFTER_LABEL || 'after-light'
const comparisonLabel = process.env.UI_COMPARE_LABEL || 'comparison'
const names = [
  'learning-desktop',
  'learning-mobile',
  'reading-desktop',
  'reading-mobile',
  'share-dialog-desktop',
  'share-dialog-mobile',
  'share-card-light',
]
const pairs = names.map(name => [name, `${beforeLabel}-${name}.png`, `${afterLabel}-${name}.png`])

const asDataUrl = path => `data:image/png;base64,${readFileSync(path).toString('base64')}`
const browser = await puppeteer.launch(await browserLaunchOptions())

for (const [name, beforeName, afterName] of pairs) {
  const beforePath = join(outputDir, beforeName)
  const afterPath = join(outputDir, afterName)
  if (!existsSync(beforePath) || !existsSync(afterPath)) {
    throw new Error(`Missing comparison source: ${basename(beforePath)} or ${basename(afterPath)}`)
  }

  const mobile = name.includes('mobile')
  const page = await browser.newPage()
  await page.setViewport({ width: mobile ? 940 : 2000, height: 1000, deviceScaleFactor: 1 })
  await page.setContent(`<!doctype html>
    <html lang="zh"><head><meta charset="utf-8"><style>
      *{box-sizing:border-box}
      html,body{margin:0;background:#e7ede9;color:#0d241c;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans SC",sans-serif}
      main{width:100%;padding:28px}
      header{display:flex;align-items:end;justify-content:space-between;gap:24px;margin:0 0 18px}
      h1{margin:0;font-size:26px;letter-spacing:-.03em}
      p{margin:0;color:#527066;font:600 12px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start}
      figure{min-width:0;margin:0;padding:12px;border:1px solid #b7cbc3;border-radius:12px;background:#f8faf8;box-shadow:8px 10px 0 rgba(7,122,86,.08)}
      figcaption{display:flex;justify-content:space-between;margin:0 0 10px;padding:0 2px;color:#087c5b;font:700 12px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em}
      img{display:block;width:100%;height:auto;border:1px solid #d7e2dd;background:white}
    </style></head><body><main>
      <header><h1>UNDER THE HOOD · ${name.replaceAll('-', ' ')}</h1><p>VISUAL ACCEPTANCE · 2026</p></header>
      <div class="grid">
        <figure><figcaption><span>BEFORE</span><span>原版</span></figcaption><img src="${asDataUrl(beforePath)}"></figure>
        <figure><figcaption><span>AFTER</span><span>重做</span></figcaption><img src="${asDataUrl(afterPath)}"></figure>
      </div>
    </main></body></html>`, { waitUntil: 'load' })
  await page.evaluate(async () => {
    await Promise.all([...document.images].map(image => image.decode()))
    if (document.fonts?.ready) await document.fonts.ready
  })
  await page.screenshot({ path: join(outputDir, `${comparisonLabel}-${name}.png`), fullPage: true })
  await page.close()
}

await browser.close()
console.log(JSON.stringify({ outputDir, comparisons: pairs.length }, null, 2))
