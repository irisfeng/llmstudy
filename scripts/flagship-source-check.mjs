import { modules } from '../src/data.js'
import { buildLessonMaterial, getLessonMedia, resolveMediaSource } from '../src/lessonContent.js'

const flagshipIds = ['p.1', '0.1', '1.3', '3.2', '6.2', 'wm.0.1']
const failures = []
const check = (value, message) => { if (!value) failures.push(message) }
const hasLocator = source => Boolean(
  source?.id
  || source?.url
  || source?.referenceUrl
  || source?.parts?.some(part => part.id || part.url),
)
const hasGuidance = media => Boolean(
  (media?.before && media?.after)
  || (media?.segments?.length && media.segments.every(segment => segment.before && segment.after)),
)

for (const id of flagshipIds) {
  const media = getLessonMedia(id)
  check(Boolean(media), `${id} has no lesson media`)
  if (!media) continue
  const domestic = resolveMediaSource(media, 'cn')
  const global = resolveMediaSource(media, 'global')

  check(domestic?.platform === 'Bilibili', `${id} has no domestic Bilibili source`)
  check(hasLocator(domestic), `${id} domestic source has no resolvable locator`)
  check(Boolean(domestic?.sourceType), `${id} domestic source lacks provenance`)
  check(Boolean(global), `${id} has no international source`)
  check(hasLocator(global), `${id} international source has no resolvable locator`)
  check(Boolean(global?.sourceType), `${id} international source lacks provenance`)
  check(hasGuidance(media), `${id} lacks complete watch-before/watch-after guidance`)
}

const attentionGlobal = resolveMediaSource(getLessonMedia('3.2'), 'global')
const attentionModule = modules.find(module => module.lessons.some(lesson => lesson[0] === '3.2'))
const attentionLesson = attentionModule?.lessons.find(lesson => lesson[0] === '3.2')
const attentionEnglish = attentionModule && attentionLesson
  ? buildLessonMaterial(attentionModule, attentionLesson, 'en')
  : null
check(attentionGlobal?.platform === 'YouTube', '3.2 international source must be the official YouTube lesson')
check(attentionGlobal?.id === 'eMlx5fFNoYc', '3.2 official attention video changed')
check(attentionGlobal?.author === '3Blue1Brown', '3.2 international source author changed')
check(attentionGlobal?.sourceType === 'official', '3.2 international source provenance changed')
check(
  attentionGlobal?.referenceUrl === 'https://www.3blue1brown.com/lessons/attention/',
  '3.2 official lesson reference changed',
)
check(attentionEnglish?.media?.before === getLessonMedia('3.2')?.beforeEn, '3.2 English watch-before guidance is not lesson-specific')
check(attentionEnglish?.media?.after === getLessonMedia('3.2')?.afterEn, '3.2 English watch-after guidance is not lesson-specific')

if (failures.length) {
  console.error(`Flagship source QA failed (${failures.length}):`)
  failures.forEach(failure => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Flagship source QA passed')
console.log(`- flagship_lessons: ${flagshipIds.length}`)
console.log(`- domestic_sources: ${flagshipIds.map(getLessonMedia).filter(Boolean).filter(media => resolveMediaSource(media, 'cn')).length}`)
console.log(`- international_sources: ${flagshipIds.map(getLessonMedia).filter(Boolean).filter(media => resolveMediaSource(media, 'global')).length}`)
