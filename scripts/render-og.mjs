import puppeteer from 'puppeteer-core'
import { resolve } from 'node:path'
import { browserLaunchOptions } from './browser-runtime.mjs'

const browser = await puppeteer.launch(await browserLaunchOptions({ fileAccess: true }))
const page = await browser.newPage()
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 })
await page.goto(`file://${resolve('public/og-cover.svg')}`, { waitUntil: 'load' })
await page.evaluate(() => document.fonts?.ready)
await new Promise(resolveReady => setTimeout(resolveReady, 250))
await page.screenshot({ path: 'public/og-cover.png', type: 'png', omitBackground: false })
await browser.close()
console.log('Rendered public/og-cover.png at 1200×630.')
