import { mkdirSync, writeFileSync } from 'node:fs'
import puppeteer from 'puppeteer-core'
import { lessonPath } from '../src/lessonRoutes.js'
import { browserLaunchOptions } from './browser-runtime.mjs'

const baseUrl = (process.env.QA_URL || 'http://127.0.0.1:4173').replace(/\/$/, '')
const outputDir = process.env.UI_CAPTURE_DIR || '/tmp/llmstudy-ui-redesign'
const label = process.env.UI_CAPTURE_LABEL || 'capture'
const theme = process.env.UI_CAPTURE_THEME || 'light'
const readingLessonId = process.env.UI_LESSON_ID || 'p.2'

mkdirSync(outputDir, { recursive: true })

const browser = await puppeteer.launch(await browserLaunchOptions())

async function preparePage(width, height) {
  const page = await browser.newPage()
  await page.setViewport({ width, height, deviceScaleFactor: 1 })
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.evaluateOnNewDocument(({ selectedTheme }) => {
    localStorage.setItem('uth-theme', selectedTheme)
    localStorage.setItem('uth-locale', 'zh')
    localStorage.setItem('uth-network', 'cn')
  }, { selectedTheme: theme })
  return page
}

async function settle(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready
  })
  await new Promise(resolve => setTimeout(resolve, 180))
}

async function assertNoHorizontalOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
  }))
  if (dimensions.document > dimensions.viewport + 1) {
    throw new Error(`${label}: horizontal overflow ${dimensions.document}px > ${dimensions.viewport}px`)
  }
}

async function captureLearningPath(width, height, viewport) {
  const page = await preparePage(width, height)
  await page.goto(`${baseUrl}/zh/`, { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.querySelector('[data-qa="nav-path"]')?.click())
  await page.waitForSelector('.curriculum-page .module-detail')
  await settle(page)
  await assertNoHorizontalOverflow(page, `learning-${viewport}`)
  await page.screenshot({ path: `${outputDir}/${label}-learning-${viewport}.png`, fullPage: true })
  await page.close()
}

async function captureReadingAndShare(width, height, viewport) {
  const page = await preparePage(width, height)
  await page.goto(`${baseUrl}${lessonPath(readingLessonId, 'zh')}`, { waitUntil: 'networkidle0' })
  await page.waitForSelector('.study-reading h1')
  await settle(page)
  await assertNoHorizontalOverflow(page, `reading-${viewport}`)
  await page.screenshot({ path: `${outputDir}/${label}-reading-${viewport}.png`, fullPage: false })

  await page.$eval('#study-2', node => node.scrollIntoView({ block:'start' }))
  await settle(page)
  await assertNoHorizontalOverflow(page, `practice-${viewport}`)
  await page.screenshot({ path: `${outputDir}/${label}-practice-${viewport}.png`, fullPage: false })

  await page.click('[data-qa="share-trigger"]')
  await page.waitForSelector('[data-qa="share-dialog"]')
  await page.waitForSelector('[data-share-card-preview]')
  await settle(page)
  await assertNoHorizontalOverflow(page, `share-dialog-${viewport}`)
  const renderedTheme = await page.$eval('[data-qa="share-card-preview"]', node => node.dataset.shareCardTheme)
  if (renderedTheme !== theme) throw new Error(`share-dialog-${viewport}: expected ${theme}, got ${renderedTheme}`)
  await page.screenshot({ path: `${outputDir}/${label}-share-dialog-${viewport}.png`, fullPage: false })

  if (viewport === 'desktop') {
    const dataUrl = await page.$eval('[data-share-card-preview]', async image => {
      const blob = await fetch(image.src).then(response => response.blob())
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    })
    const cardDimensions = await page.$eval('[data-share-card-preview]', image => ({
      width: image.naturalWidth,
      height: image.naturalHeight,
    }))
    if (cardDimensions.width !== 1080 || cardDimensions.height !== 1440) {
      throw new Error(`share-card: expected 1080x1440, got ${cardDimensions.width}x${cardDimensions.height}`)
    }
    writeFileSync(`${outputDir}/${label}-share-card-${theme}.png`, Buffer.from(dataUrl.split(',')[1], 'base64'))
  }
  await page.close()
}

await captureLearningPath(1440, 1000, 'desktop')
await captureLearningPath(390, 844, 'mobile')
await captureReadingAndShare(1440, 1000, 'desktop')
await captureReadingAndShare(390, 844, 'mobile')

await browser.close()
console.log(JSON.stringify({ outputDir, label, theme, readingLessonId, files: 9 }, null, 2))
