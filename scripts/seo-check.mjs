import { access, readFile } from 'node:fs/promises'
import { lessonPath, lessonRoutes } from '../src/lessonRoutes.js'
import { SITE_URL } from '../src/seo.js'

const dist = new URL('../dist/', import.meta.url)
const failures = []
const check = (condition, message) => { if (!condition) failures.push(message) }

const sitemap = await readFile(new URL('sitemap.xml', dist), 'utf8')
const robots = await readFile(new URL('robots.txt', dist), 'utf8')
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1])

check(urls.length === lessonRoutes.length * 2 + 2, `Expected ${lessonRoutes.length * 2 + 2} sitemap URLs, found ${urls.length}`)
check(new Set(urls).size === urls.length, 'Sitemap contains duplicate URLs')
check(!sitemap.includes('#lesson='), 'Sitemap contains legacy hash URLs')
check(robots.includes(`${SITE_URL}/sitemap.xml`), 'robots.txt does not reference the sitemap')

for (const route of lessonRoutes) {
  for (const locale of ['zh', 'en']) {
    const routePath = lessonPath(route.id, locale)
    const file = new URL(`.${routePath}index.html`, dist)
    await access(file)
    const html = await readFile(file, 'utf8')
    check(html.includes(`<link rel="canonical" href="${SITE_URL}${routePath}"`), `Missing canonical: ${routePath}`)
    check(html.includes('hreflang="zh-CN"') && html.includes('hreflang="en"'), `Missing alternates: ${routePath}`)
    check(html.includes('application/ld+json'), `Missing structured data: ${routePath}`)
    check(html.includes('data-seo-fallback'), `Missing prerendered content: ${routePath}`)
  }
}

console.log(JSON.stringify({ lessons: lessonRoutes.length, localizedLessonPages: lessonRoutes.length * 2, sitemapUrls: urls.length, failures }, null, 2))
if (failures.length) process.exit(1)
