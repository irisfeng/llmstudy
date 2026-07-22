import puppeteer from 'puppeteer-core'
import { resolve } from 'node:path'
import { browserLaunchOptions } from './browser-runtime.mjs'

const browser = await puppeteer.launch({
  ...await browserLaunchOptions({ fileAccess: true, disableWebSecurity: true }),
})
const url = process.env.QA_URL || `file://${resolve('dist/index.html')}`
const errors = []

const prepare = async (page, width, height) => {
  page.on('console', message => { if (message.type() === 'error' && !message.text().includes('Failed to load resource')) errors.push(message.text()) })
  page.on('response', response => { if (response.status() >= 400 && !response.url().includes('/_vercel/insights/')) errors.push(`${response.status()} ${response.url()}`) })
  page.on('pageerror', error => errors.push(error.message))
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('uth-locale','en')
    localStorage.setItem('uth-theme','light')
  })
  await page.setViewport({ width, height, deviceScaleFactor:1 })
  await page.goto(url, { waitUntil:'domcontentloaded', timeout:45000 })
  await page.waitForSelector('.hero-copy h1', { timeout:15000 })
}

const mobile = await browser.newPage()
await prepare(mobile, 390, 844)
const mobileMetrics = await mobile.evaluate(() => {
  const rect = selector => {
    const box = document.querySelector(selector)?.getBoundingClientRect()
    return box && { left:box.left, right:box.right, width:box.width, height:box.height }
  }
  const title = getComputedStyle(document.querySelector('.hero-copy h1'))
  return {
    viewport:document.documentElement.clientWidth,
    scrollWidth:document.documentElement.scrollWidth,
    page:rect('.page'),
    topbar:rect('.topbar'),
    search:rect('.search-trigger'),
    sidebarShadow:getComputedStyle(document.querySelector('.sidebar')).boxShadow,
    searchLabel:getComputedStyle(document.querySelector('.search-trigger span')).display,
    searchShortcut:getComputedStyle(document.querySelector('.search-trigger kbd')).display,
    topbarTheme:getComputedStyle(document.querySelector('.topbar > .theme-toggle')).display,
    titleFont:title.fontFamily,
    titleSize:title.fontSize,
    titleTracking:title.letterSpacing,
    heroHeight:rect('.hero-copy')?.height,
    shareCount:document.querySelectorAll('.hero-actions [data-share-button]').length,
    share:rect('.hero-actions [data-share-button]'),
    trackColumns:getComputedStyle(document.querySelector('.track-chooser')).gridTemplateColumns,
    visibleSignals:[...document.querySelectorAll('.signal-map > span')].filter(node => getComputedStyle(node).display !== 'none').map(node => node.textContent),
  }
})
await mobile.screenshot({ path:'/tmp/llmstudy-mobile-home-after.png', fullPage:true })
await mobile.click('.topbar .mobile-only')
await new Promise(resolve => setTimeout(resolve, 350))
const openSidebar = await mobile.$eval('.sidebar', element => ({ transform:getComputedStyle(element).transform, shadow:getComputedStyle(element).boxShadow }))

const desktop = await browser.newPage()
await prepare(desktop, 1440, 1000)
const desktopMetrics = await desktop.evaluate(() => ({
  viewport:document.documentElement.clientWidth,
  scrollWidth:document.documentElement.scrollWidth,
  sidebarWidth:document.querySelector('.sidebar').getBoundingClientRect().width,
  heroColumns:getComputedStyle(document.querySelector('.hero-grid')).gridTemplateColumns,
  trackColumns:getComputedStyle(document.querySelector('.track-chooser')).gridTemplateColumns,
  searchLabel:getComputedStyle(document.querySelector('.search-trigger span')).display,
  topbarTheme:getComputedStyle(document.querySelector('.topbar > .theme-toggle')).display,
}))
await desktop.screenshot({ path:'/tmp/llmstudy-desktop-home-after.png', fullPage:false })

const assertions = [
  ['mobile has no horizontal overflow', mobileMetrics.scrollWidth === mobileMetrics.viewport],
  ['mobile page fills viewport', mobileMetrics.page?.width === mobileMetrics.viewport],
  ['closed sidebar has no shadow', mobileMetrics.sidebarShadow === 'none'],
  ['mobile search copy is hidden', mobileMetrics.searchLabel === 'none' && mobileMetrics.searchShortcut === 'none'],
  ['mobile topbar theme is moved to sidebar', mobileMetrics.topbarTheme === 'none'],
  ['mobile signal map is reduced', mobileMetrics.visibleSignals.length === 3],
  ['mobile share action is present and fits the viewport', mobileMetrics.shareCount === 1 && mobileMetrics.share?.right <= mobileMetrics.viewport],
  ['mobile track chooser is a single column', mobileMetrics.trackColumns.split(' ').length === 1],
  ['open sidebar is visible and has a shadow', (openSidebar.transform === 'none' || openSidebar.transform === 'matrix(1, 0, 0, 1, 0, 0)') && openSidebar.shadow !== 'none'],
  ['desktop has no horizontal overflow', desktopMetrics.scrollWidth === desktopMetrics.viewport],
  ['desktop controls remain visible', desktopMetrics.searchLabel !== 'none' && desktopMetrics.topbarTheme !== 'none'],
  ['desktop hero remains two-column', desktopMetrics.heroColumns.split(' ').length === 2],
  ['desktop track chooser remains two-column in light theme', desktopMetrics.trackColumns.split(' ').length === 2],
  ['no browser errors', errors.length === 0],
]
const failed = assertions.filter(([,passed]) => !passed).map(([name]) => name)
console.log(JSON.stringify({ errors, failed, mobileMetrics, openSidebar, desktopMetrics }, null, 2))
await browser.close()
if (failed.length) process.exit(1)
