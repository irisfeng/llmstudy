import puppeteer from 'puppeteer-core'
import { lessonPath } from '../src/lessonRoutes.js'
import { browserLaunchOptions } from './browser-runtime.mjs'

const baseUrl = (process.env.QA_URL || 'http://127.0.0.1:4173').replace(/\/$/, '')
const browser = await puppeteer.launch(await browserLaunchOptions())

async function pageFor(locale, width = 1440, height = 1000) {
  const page = await browser.newPage()
  await page.setViewport({ width, height, deviceScaleFactor: 1 })
  await page.evaluateOnNewDocument(selectedLocale => {
    localStorage.setItem('uth-theme', 'light')
    localStorage.setItem('uth-locale', selectedLocale)
  }, locale)
  return page
}

async function computed(page, selector) {
  await page.waitForSelector(selector)
  return page.$eval(selector, (node, selected) => {
    const style = getComputedStyle(node)
    return {
      selector: selected,
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight,
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
    }
  }, selector)
}

function expectFont(record, family) {
  if (!record.fontFamily.includes(family)) {
    throw new Error(`${record.selector}: expected ${family}, got ${record.fontFamily}`)
  }
}

function expectTracking(record, minPx, maxPx) {
  const value = Number.parseFloat(record.letterSpacing)
  if (!Number.isFinite(value) || value < minPx || value > maxPx) {
    throw new Error(`${record.selector}: expected letter spacing ${minPx}..${maxPx}px, got ${record.letterSpacing}`)
  }
}

async function auditZh() {
  const page = await pageFor('zh')
  await page.goto(`${baseUrl}/zh/`, { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.querySelector('[data-qa="nav-path"]')?.click())
  await page.evaluate(() => document.fonts?.ready)
  const learning = {
    pageTitle: await computed(page, '.path-lead-copy h1'),
    moduleTitle: await computed(page, '.module-head h2'),
    body: await computed(page, '.path-lead-copy > p'),
    label: await computed(page, '.path-lead-copy .section-no'),
  }
  expectFont(learning.pageTitle, 'Noto Serif SC Variable')
  expectFont(learning.moduleTitle, 'Noto Serif SC Variable')
  expectFont(learning.body, 'Noto Sans SC Variable')
  expectFont(learning.label, 'IBM Plex Mono')
  expectTracking(learning.pageTitle, -2, 0)
  expectTracking(learning.moduleTitle, -1, 0)

  await page.goto(`${baseUrl}${lessonPath('p.2', 'zh')}`, { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.fonts?.ready)
  const reading = {
    pageTitle: await computed(page, '.reading-hero > h1'),
    sectionTitle: await computed(page, '.study-section > h2'),
    body: await computed(page, '.study-section > p'),
  }
  expectFont(reading.pageTitle, 'Noto Serif SC Variable')
  expectFont(reading.sectionTitle, 'Noto Serif SC Variable')
  expectFont(reading.body, 'Noto Sans SC Variable')
  expectTracking(reading.pageTitle, -2, 0)
  expectTracking(reading.sectionTitle, -1, 0)
  await page.close()
  return { learning, reading }
}

async function auditEn() {
  const page = await pageFor('en')
  await page.goto(`${baseUrl}${lessonPath('p.2', 'en')}`, { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.fonts?.ready)
  const reading = {
    pageTitle: await computed(page, '.reading-hero > h1'),
    sectionTitle: await computed(page, '.study-section > h2'),
    body: await computed(page, '.study-section > p'),
  }
  expectFont(reading.pageTitle, 'Newsreader Variable')
  expectFont(reading.sectionTitle, 'Newsreader Variable')
  expectFont(reading.body, 'Manrope Variable')
  await page.close()
  return { reading }
}

async function auditResponsive(width) {
  const page = await pageFor('zh', width, width === 320 ? 720 : 900)
  const assertPage = async label => {
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
    }))
    if (dimensions.document > dimensions.viewport + 1) {
      throw new Error(`${label}@${width}: horizontal overflow ${dimensions.document}px > ${dimensions.viewport}px`)
    }
    return dimensions
  }

  await page.goto(`${baseUrl}/zh/`, { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.querySelector('[data-qa="nav-path"]')?.click())
  await page.waitForSelector('.path-lead-copy h1')
  const learning = await assertPage('learning')

  await page.goto(`${baseUrl}${lessonPath('p.2', 'zh')}`, { waitUntil: 'networkidle0' })
  await page.waitForSelector('.reading-hero > h1')
  const reading = await assertPage('reading')
  await page.close()
  return { width, learning, reading }
}

try {
  const [zh, en, ...responsive] = await Promise.all([
    auditZh(),
    auditEn(),
    ...[320, 768, 1024, 1440].map(auditResponsive),
  ])
  console.log(JSON.stringify({ ok: true, baseUrl, zh, en, responsive }, null, 2))
} finally {
  await browser.close()
}
