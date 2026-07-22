import puppeteer from 'puppeteer-core'
import { lessonPath } from '../src/lessonRoutes.js'
import { worldModules } from '../src/worldModelData.js'
import { getLessonMedia, lessonHasMedia, resolveMediaSource } from '../src/lessonContent.js'
import { browserLaunchOptions } from './browser-runtime.mjs'

const baseUrl = (process.env.QA_URL || 'http://127.0.0.1:4173').replace(/\/+$/, '')
const browser = await puppeteer.launch(await browserLaunchOptions())
const failures = []
const errors = []
const check = (value, message) => { if (!value) failures.push(message) }
const attach = page => {
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error' && !message.text().includes('Failed to load resource') && !message.text().includes('/_vercel/insights/')) errors.push(message.text()) })
}

const worldLessonIds = worldModules.flatMap(module => module.lessons.map(lesson => lesson[0]))
check(worldLessonIds.length === 12, 'World Models track should contain twelve lessons')
for (const id of worldLessonIds) {
  check(lessonHasMedia(id), `${id} is missing a video seminar`)
  const media = getLessonMedia(id)
  const domestic = resolveMediaSource(media, 'cn')
  const global = resolveMediaSource(media, 'global')
  check(domestic?.platform === 'Bilibili' && /^BV/.test(domestic?.id || ''), `${id} is missing a valid Bilibili source`)
  check(global?.platform === 'YouTube' && /^[\w-]{11}$/.test(global?.id || ''), `${id} is missing a valid YouTube source`)
  check(Boolean(media?.before) && Boolean(media?.after), `${id} is missing course-specific watch guidance`)
}

const direct = await browser.newPage()
attach(direct)
await direct.evaluateOnNewDocument(() => localStorage.setItem('uth-network', 'cn'))
await direct.setViewport({ width:1440, height:1000, deviceScaleFactor:1 })
const zhLesson = lessonPath('wm.3.1', 'zh')
await direct.goto(`${baseUrl}${zhLesson}`, { waitUntil:'domcontentloaded' })
await direct.waitForSelector('.study-reading h1')
check(new URL(direct.url()).pathname === zhLesson, 'World Models direct URL is not canonical')
check((await direct.$eval('.study-reading h1', node => node.textContent)).includes('Genie 1→3'), 'World Models direct lesson did not render')
check((await direct.$eval('link[rel="canonical"]', node => node.href)).endsWith(zhLesson), 'World Models client canonical is incorrect')
check((await direct.$eval('.media-heading .section-no', node => node.textContent)).includes('Bilibili'), 'World Models domestic source did not render')
await direct.click('.network-switch button:last-child')
check((await direct.$eval('.media-heading .section-no', node => node.textContent)).includes('YouTube'), 'World Models international source did not render')
check((await direct.$eval('.media-meta a', node => node.href)).includes('PDKhUknuQDg'), 'Genie international source is incorrect')
check(Boolean(await direct.$('.media-frame > button')), 'Privacy-preserving deferred player control is missing')
await direct.screenshot({ path:'/tmp/llmstudy-world-lesson-desktop.png', fullPage:false })
await direct.click('.media-frame > button')
await direct.waitForSelector('.media-frame iframe')
check((await direct.$eval('.media-frame iframe', node => node.src)).includes('PDKhUknuQDg'), 'Genie player did not load the selected source')
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
await home.waitForSelector('.lesson-media')
await new Promise(resolve => setTimeout(resolve, 350))
await home.$eval('.lesson-media', node => node.scrollIntoView({ block:'start', behavior:'instant' }))
await new Promise(resolve => setTimeout(resolve, 150))
const mobileMediaWidth = await home.evaluate(() => ({ client:document.documentElement.clientWidth, scroll:document.documentElement.scrollWidth, media:Math.round(document.querySelector('.lesson-media').getBoundingClientRect().width) }))
check(mobileMediaWidth.client === mobileMediaWidth.scroll, 'World Models mobile media has horizontal overflow')
check(mobileMediaWidth.media <= mobileMediaWidth.client, 'World Models mobile media exceeds the viewport')
await home.screenshot({ path:'/tmp/llmstudy-world-media-mobile.png', fullPage:false })

await browser.close()
check(errors.length === 0, `Browser errors: ${errors.join(' | ')}`)
console.log(JSON.stringify({ zhLesson, enLesson, worldVideoLessons:worldLessonIds.length, width, mobileMediaWidth, errors, failures }, null, 2))
if (failures.length) process.exit(1)
