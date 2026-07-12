import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { chmodSync, createReadStream, createWriteStream, existsSync } from 'node:fs'
import { createBrotliDecompress } from 'node:zlib'
import { pipeline } from 'node:stream/promises'
import { lessonPath } from '../src/lessonRoutes.js'

const executablePath = '/tmp/under-the-hood-chromium'
if (!existsSync(executablePath)) {
  await pipeline(createReadStream('node_modules/@sparticuz/chromium/bin/chromium.br'), createBrotliDecompress(), createWriteStream(executablePath))
  chmodSync(executablePath, 0o700)
}

const baseUrl = (process.env.QA_URL || 'http://127.0.0.1:4173/').replace(/\/$/, '')
const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--single-process', '--no-zygote'],
})
const failures = []
const errors = []
const check = (condition, message) => { if (!condition) failures.push(message) }
const attachErrors = page => {
  page.on('pageerror', error => errors.push(error.message))
  page.on('response', response => {
    const url = response.url()
    if (response.status() >= 400 && !url.includes('/_vercel/insights/')) errors.push(`${response.status()} ${url}`)
  })
  page.on('console', message => {
    const text = message.text()
    if (message.type() === 'error' && !text.includes('Failed to load resource') && !text.includes('/_vercel/insights/')) errors.push(text)
  })
}

const direct = await browser.newPage()
attachErrors(direct)
await direct.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 })
const zhPath = lessonPath('3.2', 'zh')
await direct.goto(`${baseUrl}${zhPath}`, { waitUntil: 'domcontentloaded' })
await direct.waitForSelector('.study-reading h1')
check(new URL(direct.url()).pathname === zhPath, 'Direct lesson URL did not remain canonical')
check((await direct.$eval('.study-reading h1', node => node.textContent)).includes('Scaled Dot-Product Attention'), 'Direct Chinese lesson did not render')
check((await direct.$eval('.geo-answer h2', node => node.textContent)).includes('Q、K、V'), 'GEO direct-answer block did not render')
check((await direct.$$eval('.geo-answer footer a', nodes => nodes.length)) >= 3, 'GEO primary-source links are missing')
check((await direct.$$eval('.geo-answer [data-share-button]', nodes => nodes.length)) === 1, 'Lesson share action is missing')
check((await direct.title()).includes('Scaled Dot-Product Attention'), 'Lesson document title was not applied')
check((await direct.$eval('link[rel="canonical"]', node => node.href)).endsWith(zhPath), 'Client canonical URL is incorrect')
await direct.screenshot({ path: '/tmp/llmstudy-geo-desktop.png', fullPage: false })

await direct.click('.study-topbar .language-toggle button:last-child')
await direct.waitForFunction(expected => location.pathname === expected, {}, lessonPath('3.2', 'en'))
check((await direct.$eval('.study-reading h1', node => node.textContent)).includes('Scaled dot-product attention'), 'Language switch did not localize the direct lesson')

const legacy = await browser.newPage()
attachErrors(legacy)
await legacy.evaluateOnNewDocument(() => localStorage.setItem('uth-locale', 'zh'))
await legacy.goto(`${baseUrl}/#lesson=1.3`, { waitUntil: 'domcontentloaded' })
await legacy.waitForSelector('.study-reading h1')
check(new URL(legacy.url()).pathname === lessonPath('1.3', 'zh'), 'Legacy hash URL did not migrate to the canonical route')
check(new URL(legacy.url()).hash === '', 'Legacy hash remained after migration')
check(await legacy.$eval('.geo-answer', node => Boolean(node)), 'Legacy-routed pillar lesson lost its GEO content')

const navigation = await browser.newPage()
attachErrors(navigation)
await navigation.evaluateOnNewDocument(() => localStorage.setItem('uth-locale', 'zh'))
await navigation.goto(`${baseUrl}/zh/`, { waitUntil: 'domcontentloaded' })
await navigation.waitForSelector('.hero-copy h1')
await navigation.click('.main-nav button:nth-child(2)')
await navigation.$$eval('.module-index button', buttons => buttons.find(button => button.textContent.includes('从注意力到 GPT'))?.click())
await navigation.$$eval('.lesson-table > button', buttons => buttons.find(button => button.textContent.includes('3.2'))?.click())
await navigation.waitForFunction(expected => location.pathname === expected, {}, zhPath)
await navigation.goBack({ waitUntil: 'domcontentloaded' })
await navigation.waitForSelector('.hero-copy h1')
check(new URL(navigation.url()).pathname === '/zh/', 'Browser back did not return to the localized homepage')

const mobile = await browser.newPage()
attachErrors(mobile)
await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
const mobilePath = lessonPath('7.1', 'zh')
await mobile.goto(`${baseUrl}${mobilePath}`, { waitUntil: 'domcontentloaded' })
await mobile.waitForSelector('.study-reading h1')
await mobile.waitForSelector('.geo-answer')
await mobile.waitForSelector('.geo-answer [data-share-button]')
check((await mobile.$eval('.geo-answer-alignment', node => node.textContent)).includes('goal/state'), 'Lecture-alignment note is missing on the second-wave GEO lesson')
const mobileWidth = await mobile.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
check(mobileWidth.client === mobileWidth.scroll, 'Direct mobile lesson has horizontal overflow')
await mobile.screenshot({ path: '/tmp/llmstudy-geo-mobile.png', fullPage: true })

await browser.close()
check(errors.length === 0, `Browser errors: ${errors.join(' | ')}`)
console.log(JSON.stringify({ direct: zhPath, legacy: lessonPath('1.3', 'zh'), mobile: mobilePath, mobileWidth, errors, failures }, null, 2))
if (failures.length) process.exit(1)
