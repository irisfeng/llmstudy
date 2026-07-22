import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { createReadStream, createWriteStream, existsSync, chmodSync } from 'node:fs'
import { createBrotliDecompress } from 'node:zlib'
import { pipeline } from 'node:stream/promises'
import { lessonPath } from '../src/lessonRoutes.js'

const executablePath = '/tmp/under-the-hood-chromium'
if (!existsSync(executablePath)) {
  await pipeline(createReadStream('node_modules/@sparticuz/chromium/bin/chromium.br'), createBrotliDecompress(), createWriteStream(executablePath))
  chmodSync(executablePath, 0o700)
}

const baseUrl = process.env.QA_URL || 'http://127.0.0.1:4173'
const browser = await puppeteer.launch({ executablePath, headless:true, args:['--no-sandbox','--disable-setuid-sandbox','--disable-gpu','--disable-dev-shm-usage','--single-process','--no-zygote'] })
const failures = []
const errors = []
const check = (value, message) => { if (!value) failures.push(message) }
const attach = page => {
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error' && !message.text().includes('Failed to load resource') && !message.text().includes('/_vercel/insights/')) errors.push(message.text()) })
}

const direct = await browser.newPage()
attach(direct)
await direct.setViewport({ width:1440, height:1000, deviceScaleFactor:1 })
const zhLesson = lessonPath('wm.3.1', 'zh')
await direct.goto(`${baseUrl}${zhLesson}`, { waitUntil:'domcontentloaded' })
await direct.waitForSelector('.study-reading h1')
check(new URL(direct.url()).pathname === zhLesson, 'World Models direct URL is not canonical')
check((await direct.$eval('.study-reading h1', node => node.textContent)).includes('Genie 1→3'), 'World Models direct lesson did not render')
check((await direct.$eval('link[rel="canonical"]', node => node.href)).endsWith(zhLesson), 'World Models client canonical is incorrect')
await direct.screenshot({ path:'/tmp/llmstudy-world-lesson-desktop.png', fullPage:false })
await direct.click('.study-topbar .language-toggle button:last-child')
const enLesson = lessonPath('wm.3.1', 'en')
await direct.waitForFunction(expected => location.pathname === expected, {}, enLesson)
check((await direct.$eval('.study-reading h1', node => node.textContent)).includes('Genie 1→3'), 'World Models language switch lost the lesson')

const home = await browser.newPage()
attach(home)
await home.setViewport({ width:390, height:844, deviceScaleFactor:1 })
await home.goto(`${baseUrl}/zh/`, { waitUntil:'domcontentloaded' })
await home.waitForSelector('.track-chooser button:nth-child(2)')
await home.click('.track-chooser button:nth-child(2)')
await home.waitForFunction(() => location.pathname === '/zh/world-models/')
check((await home.$eval('.hero-copy h1', node => node.textContent)).includes('预测世界'), 'World Models home hero did not render')
check((await home.$$eval('.road-stop', nodes => nodes.length)) === 5, 'World Models roadmap should have five phases')
const width = await home.evaluate(() => ({ client:document.documentElement.clientWidth, scroll:document.documentElement.scrollWidth }))
check(width.client === width.scroll, 'World Models mobile home has horizontal overflow')
await home.screenshot({ path:'/tmp/llmstudy-world-home-mobile.png', fullPage:true })
await home.click('.topbar .mobile-only')
await home.waitForSelector('.sidebar.open')
await new Promise(resolve => setTimeout(resolve, 350))
await home.click('.main-nav button:nth-child(2)')
check((await home.$$eval('.lesson-table > button', nodes => nodes.length)) === 3, 'First World Models phase should expose three lessons')
await home.$eval('.lesson-table > button', button => button.click())
await home.waitForFunction(expected => location.pathname === expected, {}, lessonPath('wm.0.1', 'zh'))

await browser.close()
check(errors.length === 0, `Browser errors: ${errors.join(' | ')}`)
console.log(JSON.stringify({ zhLesson, enLesson, width, errors, failures }, null, 2))
if (failures.length) process.exit(1)
