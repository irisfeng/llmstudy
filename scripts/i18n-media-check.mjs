import puppeteer from 'puppeteer-core'
import { resolve } from 'node:path'
import { browserLaunchOptions } from './browser-runtime.mjs'

const browser = await puppeteer.launch(await browserLaunchOptions({ fileAccess: true, disableWebSecurity: true }))
const errors = []
const url = process.env.QA_URL || `file://${resolve('dist/index.html')}`

const page = await browser.newPage()
page.on('console', message => { if (message.type() === 'error' && !message.text().includes('Failed to load resource')) errors.push(message.text()) })
page.on('response', response => { if (response.status() >= 400 && !response.url().includes('/_vercel/insights/')) errors.push(`${response.status()} ${response.url()}`) })
page.on('pageerror', error => errors.push(error.message))
await page.evaluateOnNewDocument(() => {
  localStorage.setItem('uth-locale','zh')
  localStorage.setItem('uth-network','cn')
})
await page.setViewport({ width:1440, height:1000, deviceScaleFactor:1 })
await page.goto(url, { waitUntil:'networkidle0' })
const zhHero = await page.$eval('.hero-copy h1', element => element.textContent)
await page.click('.topbar .language-toggle button:last-child')
const enHero = await page.$eval('.hero-copy h1', element => element.textContent)
const htmlLang = await page.evaluate(() => document.documentElement.lang)
await page.click('.main-nav button:nth-child(2)')
await page.waitForSelector('.lesson-table > button', { timeout:5000 }).catch(async () => {
  console.error(JSON.stringify({ errors, body:(await page.$eval('body', element => element.innerText)).slice(0,2000) }))
  await page.screenshot({ path:'/tmp/llmstudy-error.png', fullPage:true })
  process.exit(1)
})
const englishLessonRows = await page.$$eval('.lesson-table > button', rows => rows.every(row => !/[\u3400-\u9fff]/.test(row.textContent)))
await page.click('.lesson-table > button')
const englishStudyTitle = await page.$eval('.study-reading h1', element => element.textContent)
const domesticPlatform = await page.$eval('.media-heading .section-no', element => element.textContent)
await page.click('.network-switch button:last-child')
const globalPlatform = await page.$eval('.media-heading .section-no', element => element.textContent)
const globalExternal = await page.$eval('.media-meta a', element => element.href)
const globalTitle = await page.$eval('.lesson-media .media-meta h3', element => element.textContent)
await page.screenshot({ path:'/tmp/llmstudy-desktop-en.png', fullPage:true })

const mobile = await browser.newPage()
mobile.on('console', message => { if (message.type() === 'error' && !message.text().includes('Failed to load resource')) errors.push(message.text()) })
mobile.on('response', response => { if (response.status() >= 400 && !response.url().includes('/_vercel/insights/')) errors.push(`${response.status()} ${response.url()}`) })
mobile.on('pageerror', error => errors.push(error.message))
await mobile.evaluateOnNewDocument(() => {
  localStorage.setItem('uth-locale','en')
  localStorage.setItem('uth-network','global')
})
await mobile.setViewport({ width:390, height:844, deviceScaleFactor:1 })
await mobile.goto(`${url}#lesson=1.1`, { waitUntil:'networkidle0' })
const mobileWidth = await mobile.evaluate(() => ({ scroll:document.documentElement.scrollWidth, client:document.documentElement.clientWidth }))
const mobileControls = await mobile.$$eval('.study-topbar .language-toggle button', buttons => buttons.map(button => button.textContent))
const mobilePlatform = await mobile.$eval('.media-heading .section-no', element => element.textContent)
await mobile.screenshot({ path:'/tmp/llmstudy-mobile-en.png', fullPage:true })

console.log(JSON.stringify({ errors, zhHero, enHero, htmlLang, englishLessonRows, englishStudyTitle, domesticPlatform, globalPlatform, globalExternal, globalTitle, mobileWidth, mobileControls, mobilePlatform }, null, 2))
await browser.close()
