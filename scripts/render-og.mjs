import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { chmodSync, createReadStream, createWriteStream, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { createBrotliDecompress } from 'node:zlib'

const executablePath = '/tmp/under-the-hood-chromium'
if (!existsSync(executablePath)) {
  await pipeline(createReadStream('node_modules/@sparticuz/chromium/bin/chromium.br'), createBrotliDecompress(), createWriteStream(executablePath))
  chmodSync(executablePath, 0o700)
}

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--single-process', '--no-zygote', '--allow-file-access-from-files'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 })
await page.goto(`file://${resolve('public/og-cover.svg')}`, { waitUntil: 'load' })
await page.evaluate(() => document.fonts?.ready)
await new Promise(resolveReady => setTimeout(resolveReady, 250))
await page.screenshot({ path: 'public/og-cover.png', type: 'png', omitBackground: false })
await browser.close()
console.log('Rendered public/og-cover.png at 1200×630.')
