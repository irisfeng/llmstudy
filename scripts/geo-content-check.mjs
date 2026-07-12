import { GEO_UPDATED_AT, geoLessonIds, getGeoBrief } from '../src/geoContent.js'
import { lessonRoutes } from '../src/lessonRoutes.js'

const failures = []
const check = (condition, message) => { if (!condition) failures.push(message) }
const routeIds = new Set(lessonRoutes.map(route => route.id))

check(/^\d{4}-\d{2}-\d{2}$/.test(GEO_UPDATED_AT), 'GEO_UPDATED_AT must use YYYY-MM-DD')
check(new Set(geoLessonIds).size === geoLessonIds.length, 'Duplicate GEO lesson IDs')

for (const id of geoLessonIds) {
  check(routeIds.has(id), `Unknown GEO lesson ID: ${id}`)
  const localized = Object.fromEntries(['zh', 'en'].map(locale => [locale, getGeoBrief(id, locale)]))

  for (const [locale, brief] of Object.entries(localized)) {
    check(Boolean(brief), `Missing ${locale} GEO brief: ${id}`)
    if (!brief) continue
    check(brief.question.length >= 15, `Question is too short: ${id}/${locale}`)
    check(brief.answer.length >= 120, `Answer is too short: ${id}/${locale}`)
    check(Array.isArray(brief.points) && brief.points.length === 3, `Expected exactly 3 takeaways: ${id}/${locale}`)
    check(brief.boundaries.length >= 50, `Boundary is too short: ${id}/${locale}`)
    check(Array.isArray(brief.sources) && brief.sources.length >= 3, `Expected at least 3 sources: ${id}/${locale}`)
    check(brief.sources.every(source => source.title && source.url.startsWith('https://')), `Invalid source: ${id}/${locale}`)
    check(new Set(brief.sources.map(source => source.url)).size === brief.sources.length, `Duplicate source URL: ${id}/${locale}`)
  }

  if (localized.zh && localized.en) {
    check(
      JSON.stringify(localized.zh.sources.map(source => source.url)) === JSON.stringify(localized.en.sources.map(source => source.url)),
      `Chinese and English source URLs differ: ${id}`,
    )
    check(Boolean(localized.zh.alignment) === Boolean(localized.en.alignment), `Lecture alignment differs by locale: ${id}`)
  }
}

console.log(JSON.stringify({ updatedAt: GEO_UPDATED_AT, geoLessons: geoLessonIds.length, failures }, null, 2))
if (failures.length) process.exit(1)
