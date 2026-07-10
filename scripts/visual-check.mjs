import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { createReadStream, createWriteStream, existsSync, chmodSync } from 'node:fs'
import { createBrotliDecompress } from 'node:zlib'
import { pipeline } from 'node:stream/promises'
import { resolve } from 'node:path'

const localChromium = '/tmp/under-the-hood-chromium'
if (!existsSync(localChromium)) {
  await pipeline(
    createReadStream('node_modules/@sparticuz/chromium/bin/chromium.br'),
    createBrotliDecompress(),
    createWriteStream(localChromium),
  )
  chmodSync(localChromium, 0o700)
}

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--single-process', '--no-zygote', '--allow-file-access-from-files', '--disable-web-security'],
  defaultViewport: null,
  executablePath: localChromium,
  headless: true,
  dumpio: true,
})

const errors = []
const targetUrl = process.env.QA_URL || `file://${resolve('dist/index.html')}`
const page = await browser.newPage()
await page.evaluateOnNewDocument(() => localStorage.setItem('uth-theme', 'dark'))
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
page.on('pageerror', err => errors.push(err.message))

await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 })
await page.goto(targetUrl, { waitUntil: 'networkidle0' })
await page.screenshot({ path: 'qa-dashboard.png', fullPage: true })

await page.click('.topbar .account-trigger')
const accountFormReady = await page.$eval('.account-modal', el => Boolean(el.querySelector('input[type="email"]')))
const accountDesktopWidth = await page.$eval('.account-modal', el => Math.round(el.getBoundingClientRect().width))
await page.screenshot({ path: 'qa-account-desktop.png' })
await page.click('.account-modal header .icon-button')

await page.click('.search-trigger')
await page.type('.command-modal input', '梯度')
const searchResults = await page.$$eval('.command-results button', els => els.length)
await page.keyboard.press('Escape')

await page.click('nav.main-nav button:nth-child(2)')
const curriculumVideoBadges = await page.$$eval('.lesson-video', els => els.length)
await page.screenshot({ path: 'qa-curriculum.png', fullPage: true })

await page.click('.lesson-table > button:nth-child(2)')
const studyTitle = await page.$eval('.study-reading h1', el => el.textContent)
const objectiveCount = await page.$$eval('.objective-card li', els => els.length)
const sectionCount = await page.$$eval('.study-nav nav button', els => els.length)
const lessonHash = await page.evaluate(() => location.hash)
await page.click('.worked-example > button')
const workedReveal = await page.$eval('.worked-example > p', el => el.textContent.length > 20)
await page.click('.quiz-card button:first-child')
const quizCorrect = await page.$eval('.quiz-card button:first-child', el => el.classList.contains('correct'))
await page.click('.complete-lesson')
await page.click('.study-topbar .theme-toggle')
const lightTheme = await page.evaluate(() => document.documentElement.dataset.theme)
await page.screenshot({ path: 'qa-study-light.png', fullPage: true })
await page.click('.study-footer .primary')
const nextTitle = await page.$eval('.study-reading h1', el => el.textContent)
await page.click('.study-footer .primary')
await page.click('.work-actions .primary')
const gradientAfterRun = await page.$eval('.node.a em', el => el.textContent)
const mediaTitle = await page.$eval('.lesson-media .media-meta h3', el => el.textContent)
const mediaDeferred = await page.$eval('.media-frame', el => !el.querySelector('iframe') && Boolean(el.querySelector('button')))
await page.click('.network-switch button:first-child')
const chinaDirect = await page.$eval('.media-frame', el => !el.querySelector('.cn-fallback') && Boolean(el.querySelector('button')))
const sourceBadge = await page.$eval('.source-badge', el => el.textContent)
await page.screenshot({ path: 'qa-lesson.png', fullPage: true })
await page.click('.lesson-outline > button:first-child')
const completedRows = await page.$$eval('.lesson-table > button.completed-row', els => els.length)
const progressLabel = await page.$eval('.top-progress b', el => el.textContent)

await page.$$eval('.module-index button', buttons => buttons.find(button => button.textContent.includes('从注意力到 GPT'))?.click())
await page.$$eval('.lesson-table > button', buttons => buttons.find(button => button.textContent.includes('3.3'))?.click())
const mediaParts = await page.$$eval('.media-parts button', els => els.length)
await page.click('.media-parts button:nth-child(2)')
const selectedPart = await page.$eval('.media-parts button:nth-child(2)', el => el.classList.contains('active'))
const partExternal = await page.$eval('.media-meta a', el => el.getAttribute('href'))
await page.screenshot({ path: 'qa-media-parts.png', fullPage: true })

const mobile = await browser.newPage()
mobile.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
await mobile.goto(targetUrl, { waitUntil: 'networkidle0' })
await mobile.click('.topbar .account-trigger')
const accountMobileWidth = await mobile.$eval('.account-modal', el => Math.round(el.getBoundingClientRect().width))
const accountMobileBottom = await mobile.$eval('.account-modal', el => Math.round(el.getBoundingClientRect().bottom))
const mobileAccountPageWidth = await mobile.evaluate(() => document.documentElement.scrollWidth)
await mobile.screenshot({ path: 'qa-account-mobile.png' })
await mobile.click('.account-modal header .icon-button')
await mobile.click('.topbar .mobile-only')
const mobileMenuOpen = await mobile.$eval('.sidebar', el => el.classList.contains('open'))
await mobile.screenshot({ path: 'qa-mobile.png', fullPage: true })
await mobile.click('.main-nav button:nth-child(2)')
const mobileCurriculumWidth = await mobile.evaluate(() => document.documentElement.scrollWidth)
await mobile.$$eval('.module-index button', buttons => buttons.find(button => button.textContent.includes('从注意力到 GPT'))?.click())
await mobile.$$eval('.lesson-table > button', buttons => buttons.find(button => button.textContent.includes('3.3'))?.click())
const mobileMediaParts = await mobile.$$eval('.media-parts button', els => els.length)
const mobileStudyWidth = await mobile.evaluate(() => document.documentElement.scrollWidth)
await mobile.screenshot({ path: 'qa-mobile-media.png', fullPage: true })

console.log(JSON.stringify({ errors, title: await page.title(), accountFormReady, accountDesktopWidth, accountMobileWidth, accountMobileBottom, mobileAccountPageWidth, searchResults, curriculumVideoBadges, studyTitle, nextTitle, objectiveCount, sectionCount, lessonHash, workedReveal, quizCorrect, lightTheme, gradientAfterRun, mediaTitle, mediaDeferred, chinaDirect, sourceBadge, mediaParts, selectedPart, partExternal, completedRows, progressLabel, mobileMenuOpen, mobileMediaParts, mobileCurriculumWidth, mobileStudyWidth }, null, 2))
await browser.close()
