import puppeteer from 'puppeteer-core'
import { lessonPath } from '../src/lessonRoutes.js'
import { browserLaunchOptions } from './browser-runtime.mjs'

const baseUrl = (process.env.QA_URL || 'http://127.0.0.1:4173').replace(/\/$/, '')
const browser = await puppeteer.launch(await browserLaunchOptions())
const failures = []
const errors = []
const check = (condition, message) => { if (!condition) failures.push(message) }
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))
const path = lessonPath('3.2', 'zh')
let eventNames = []
let noteEvent = null
let openedMedia = false

try {
  const page = await browser.newPage()
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    const text = message.text()
    if (message.type() === 'error' && !text.includes('/_vercel/insights/') && !text.includes('Failed to load resource')) errors.push(text)
  })
  page.on('response', response => {
    if (response.status() >= 400 && !response.url().includes('/_vercel/insights/')) {
      errors.push(`${response.status()} ${response.url()}`)
    }
  })

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
  await page.goto(`${baseUrl}${path}?utm_source=qa&utm_medium=browser&utm_campaign=telemetry_check&utm_content=qkv`, { waitUntil:'domcontentloaded' })
  await page.waitForSelector('.study-reading h1')
  const timestampBeforeEdit = await page.evaluate(() => localStorage.getItem('uth-lesson-3.2-note-updated'))
  check(timestampBeforeEdit === null, 'Opening a lesson refreshed the note timestamp before any edit')

  await page.$eval('#study-3', node => node.scrollIntoView())
  await wait(1100)
  await page.click('#study-3 button:nth-child(2)')

  await page.$eval('.notes-card', node => node.scrollIntoView())
  await page.type('.notes-card textarea', '用于验证统计只记录长度区间，不记录这段笔记正文。')
  await wait(1500)
  const timestampAfterEdit = await page.evaluate(() => localStorage.getItem('uth-lesson-3.2-note-updated'))
  check(Boolean(timestampAfterEdit), 'Editing a note did not create the note timestamp')

  const mediaButtons = await page.$$('.lesson-media button')
  for (const button of mediaButtons) {
    const text = await button.evaluate(node => node.textContent || '')
    if (!/加载|Load/.test(text)) continue
    await button.click()
    openedMedia = true
    break
  }
  check(openedMedia, 'Could not find the media load action')

  const events = await page.evaluate(() => (window.vaq || [])
    .filter(entry => entry[0] === 'event')
    .map(entry => entry[1]))
  eventNames = events.map(event => event.name)
  for (const name of ['lesson_depth_reached', 'lesson_engaged', 'quiz_answered', 'note_saved', 'resource_opened']) {
    check(eventNames.includes(name), `Browser did not queue ${name}`)
  }

  noteEvent = events.find(event => event.name === 'note_saved')
  check(noteEvent?.data?.length_bucket === '1-49', 'Note event did not use the expected length bucket')
  check(!JSON.stringify(noteEvent || {}).includes('用于验证'), 'Note content leaked into analytics')
  for (const event of events.filter(item => ['lesson_engaged', 'quiz_answered', 'note_saved', 'resource_opened'].includes(item.name))) {
    check(event.data?.lesson_id === '3.2', `${event.name} lost lesson attribution`)
    check(event.data?.source === 'qa', `${event.name} lost campaign attribution`)
  }

  await page.screenshot({ path:'/tmp/llmstudy-telemetry-browser.png', fullPage:false })
} finally {
  await browser.close()
}
check(errors.length === 0, `Browser errors: ${errors.join(' | ')}`)

console.log(JSON.stringify({ path, eventNames, noteEvent:noteEvent?.data, openedMedia, errors, failures }, null, 2))
if (failures.length) process.exit(1)
