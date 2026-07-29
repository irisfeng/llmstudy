import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { modules, resources } from '../src/data.js'
import { localizeModules } from '../src/localizedData.js'
import {
  buildLessonMaterial,
  getLessonMedia,
  karpathyDeepResource,
} from '../src/lessonContent.js'
import { lessonPath, lessonRoutes } from '../src/lessonRoutes.js'
import { worldModules } from '../src/worldModelData.js'

const failures = []
const check = (value, message) => { if (!value) failures.push(message) }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const llmLessons = modules.flatMap(module => module.lessons)
const allLessonIds = new Set(llmLessons.map(lesson => lesson[0]))
const englishModules = localizeModules(modules, 'en')
const prerequisite = modules.find(module => module.id === 'prerequisites')
const englishPrerequisite = englishModules.find(module => module.id === 'prerequisites')

check(modules.length === 10, `Expected 10 LLM phases, found ${modules.length}`)
check(llmLessons.length === 80, `Expected 80 LLM lessons, found ${llmLessons.length}`)
check(lessonRoutes.length === 92, `Expected 92 total routes, found ${lessonRoutes.length}`)
check(worldModules.flatMap(module => module.lessons).length === 12, 'World Models lesson count changed')
check(prerequisite?.weeks === '3 周' && prerequisite?.hours === 12, 'Prerequisite sprint duration changed')
check(
  prerequisite?.lessons.map(lesson => lesson[0]).join(',') === 'p.1,p.2,p.3,p.4',
  'Prerequisite lesson IDs or order changed',
)
check(englishPrerequisite?.lessons.length === 4, 'English prerequisite sprint is incomplete')
check(lessonPath('p.1', 'zh') === '/zh/lesson/p-1-python-from-zero-expressions-to-testable-functions/', 'p.1 canonical route changed')

const requiredResourceUrls = [
  'https://cs50.harvard.edu/python/',
  'https://docs.python.org/3/tutorial/',
  'https://numpy.org/doc/stable/user/absolute_beginners.html',
  'https://docs.pytorch.org/tutorials/beginner/basics/intro.html',
]
for (const url of requiredResourceUrls) {
  check(resources.some(resource => resource.url === url), `Missing primary prerequisite source: ${url}`)
}

const visibleMaterial = material => ({
  objectives:material.objectives,
  opening:material.opening,
  concepts:material.concepts,
  workflow:material.workflow,
  practice:material.practice,
  worked:material.worked,
  misconception:material.misconception,
  quiz:material.quiz,
  mastery:material.mastery,
  references:material.references,
  media:material.media ? {
    before:material.media.before,
    after:material.media.after,
    segments:material.media.segments?.map(segment => ({
      title:segment.title,
      before:segment.before,
      after:segment.after,
    })),
  } : null,
})
const hasChinese = value => /[\u3000-\u303f\uff00-\uffef\u3400-\u4dbf\u4e00-\u9fff]/.test(JSON.stringify(value))

for (let index = 0; index < (prerequisite?.lessons.length || 0); index += 1) {
  const lesson = prerequisite.lessons[index]
  const englishLesson = englishPrerequisite.lessons[index]
  const zh = buildLessonMaterial(prerequisite, lesson, 'zh')
  const en = buildLessonMaterial(englishPrerequisite, englishLesson, 'en')
  check(zh.concepts.length >= 5 && en.concepts.length >= 5, `${lesson[0]} lacks detailed bilingual concepts`)
  check(zh.practice.evidence.length >= 4 && en.practice.evidence.length >= 4, `${lesson[0]} lacks auditable evidence`)
  check(zh.mastery.length >= 4 && en.mastery.length >= 4, `${lesson[0]} lacks a real mastery gate`)
  check(!hasChinese(visibleMaterial(en)), `${lesson[0]} English material contains Chinese text`)
}

const chapters = karpathyDeepResource.chapters
check(chapters.length === 24, `Expected all 24 timestamp rows from the source map, found ${chapters.length}`)
check(chapters[0]?.start === 0, 'Karpathy chapters do not start at zero')
check(chapters.at(-1)?.end === karpathyDeepResource.durationSeconds, 'Karpathy chapters do not end at 3:31:24')
check(new Set(chapters.map(chapter => chapter.id)).size === chapters.length, 'Karpathy chapter IDs are not unique')
for (let index = 0; index < chapters.length; index += 1) {
  const chapter = chapters[index]
  check(chapter.start < chapter.end, `Invalid chapter interval: ${chapter.id}`)
  if (index > 0) {
    check(chapters[index - 1].end === chapter.start, `Chapter gap or overlap before ${chapter.id}`)
  }
}

const mapModule = modules.find(module => module.lessons.some(lesson => lesson[0] === '0.1'))
const alignmentModule = modules.find(module => module.lessons.some(lesson => lesson[0] === '5.1'))
const mapLesson = mapModule.lessons.find(lesson => lesson[0] === '0.1')
const alignmentLesson = alignmentModule.lessons.find(lesson => lesson[0] === '5.1')
const mapMaterial = buildLessonMaterial(mapModule, mapLesson, 'zh')
const alignmentMaterial = buildLessonMaterial(alignmentModule, alignmentLesson, 'zh')
const mapEnglishModule = englishModules.find(module => module.id === mapModule.id)
const alignmentEnglishModule = englishModules.find(module => module.id === alignmentModule.id)
const mapEnglish = buildLessonMaterial(mapEnglishModule, mapEnglishModule.lessons.find(lesson => lesson[0] === '0.1'), 'en')
const alignmentEnglish = buildLessonMaterial(alignmentEnglishModule, alignmentEnglishModule.lessons.find(lesson => lesson[0] === '5.1'), 'en')
const mapMedia = getLessonMedia('0.1')
const alignmentMedia = getLessonMedia('5.1')
const durationOf = segments => segments.reduce((total, segment) => total + segment.end - segment.start, 0)

check(mapLesson[3] === '45 分钟', '0.1 no longer promises a 45-minute lesson')
check(mapMedia.segments.length === 6, '0.1 must use six required segments')
check(durationOf(mapMedia.segments) === 1856, `0.1 required duration must be 30:56, found ${durationOf(mapMedia.segments)} seconds`)
check(durationOf(mapMedia.segments) <= 1920, '0.1 required video exceeds 32 minutes')
check(mapMedia.requiredDuration === '30:56' && mapMedia.activityDuration.includes('14'), '0.1 does not separate video and activity duration')
check(
  mapMedia.cn?.segmentTiming?.startSupported && mapMedia.cn?.segmentTiming?.endSupported === false,
  'Bilibili mirror must declare start-only segment timing',
)
check(mapMaterial.code.includes('flowchart LR') && !mapMaterial.code.includes('x @ w'), '0.1 still uses the generic tensor-multiply exercise')
check(alignmentMedia.segments.length === 3, '5.1 must use three relevant segments')
check(durationOf(alignmentMedia.segments) === 2260, `5.1 required duration must be 37:40, found ${durationOf(alignmentMedia.segments)} seconds`)
check(alignmentMedia.requiredDuration === '37:40', '5.1 does not expose its required segment duration')

for (const [id, material] of [['5.1 zh', alignmentMaterial], ['5.1 en', alignmentEnglish]]) {
  const text = JSON.stringify(visibleMaterial(material))
  check(!/DPO|chosen_logp|rejected_logp/i.test(text), `${id} leaks the later DPO lesson`)
}
check(!hasChinese(visibleMaterial(mapEnglish)), '0.1 English material contains Chinese text')
check(!hasChinese(visibleMaterial(alignmentEnglish)), '5.1 English material contains Chinese text')

for (const media of [mapMedia, alignmentMedia]) {
  for (const segment of media.segments) {
    check(segment.role === 'required', `${segment.id} has the wrong learning role`)
    check(Boolean(segment.before) && Boolean(segment.after), `${segment.id} lacks before/after retrieval guidance`)
    check(segment.linksTo.length > 0, `${segment.id} has no downstream lesson links`)
    for (const target of segment.linksTo) check(allLessonIds.has(target), `${segment.id} links to missing lesson ${target}`)
  }
}

const appSource = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8')
for (const implementationMarker of [
  'mediaProgress:',
  'video_segment_progressed',
  '&start=${start}',
  '&end=${end}',
  'data-media-segments',
  'aria-current=',
  'aria-pressed=',
  'sourceStopsAtSegmentEnd',
]) {
  check(appSource.includes(implementationMarker), `Segment player is missing ${implementationMarker}`)
}

if (failures.length) {
  console.error(`Foundations + AK content check failed (${failures.length})`)
  failures.forEach(failure => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Foundations + AK content check passed: 4 bilingual prerequisites, 24 continuous source chapters, 6/3 lesson segments, 80 LLM lessons, and 92 total routes.')
