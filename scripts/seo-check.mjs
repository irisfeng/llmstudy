import { access, readFile } from 'node:fs/promises'
import { lessonPath, lessonRoutes } from '../src/lessonRoutes.js'
import { SITE_URL } from '../src/seo.js'
import { GEO_UPDATED_AT, geoLessonIds, getGeoBrief } from '../src/geoContent.js'

const dist = new URL('../dist/', import.meta.url)
const failures = []
const check = (condition, message) => { if (!condition) failures.push(message) }
const escapeHtml = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;')

const sitemap = await readFile(new URL('sitemap.xml', dist), 'utf8')
const robots = await readFile(new URL('robots.txt', dist), 'utf8')
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1])

check(urls.length === lessonRoutes.length * 2 + 4, `Expected ${lessonRoutes.length * 2 + 4} sitemap URLs, found ${urls.length}`)
check(new Set(urls).size === urls.length, 'Sitemap contains duplicate URLs')
check(!sitemap.includes('#lesson='), 'Sitemap contains legacy hash URLs')
check(robots.includes('User-agent: *\nAllow: /'), 'robots.txt does not allow general-purpose crawlers')
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

for (const id of geoLessonIds) {
  for (const locale of ['zh', 'en']) {
    const routePath = lessonPath(id, locale)
    const html = await readFile(new URL(`.${routePath}index.html`, dist), 'utf8')
    const brief = getGeoBrief(id, locale)
    check(html.includes('data-geo-answer'), `Missing GEO answer block: ${routePath}`)
    check(html.includes(brief.question), `Missing GEO question: ${routePath}`)
    if (brief.alignment) check(html.includes(escapeHtml(brief.alignment)), `Missing lecture alignment: ${routePath}`)
    check(html.includes(brief.sources[0].url), `Missing primary citation: ${routePath}`)
    check(html.includes(`"dateModified":"${GEO_UPDATED_AT}"`), `Missing GEO dateModified schema: ${routePath}`)
  }
}

console.log(JSON.stringify({ lessons: lessonRoutes.length, localizedLessonPages: lessonRoutes.length * 2, geoPilotLessons: geoLessonIds.length, sitemapUrls: urls.length, failures }, null, 2))
if (failures.length) process.exit(1)
