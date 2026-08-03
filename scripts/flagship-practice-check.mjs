import { modules } from '../src/data.js'
import { buildLessonMaterial, getLessonMedia } from '../src/lessonContent.js'
import { spawnSync } from 'node:child_process'

const failures = []
const check = (value, message) => { if (!value) failures.push(message) }
const requireLesson = (moduleId, lessonId) => {
  const module = modules.find(item => item.id === moduleId)
  const lesson = Array.isArray(module?.lessons) ? module.lessons.find(item => item[0] === lessonId) : null
  if (!module || !lesson) throw new Error(`Flagship practice QA cannot locate ${moduleId}/${lessonId}`)
  return { module, lesson }
}
const normalizeRuntime = runtime => ({
  ok: runtime.status === 0 && !runtime.error,
  detail: runtime.error?.message
    || (typeof runtime.stderr === 'string' ? runtime.stderr.trim() : '')
    || `exit status ${runtime.status ?? 'unavailable'}`,
})

const { module:autogradModule, lesson } = requireLesson('autograd', '1.3')
const zh = buildLessonMaterial(autogradModule, lesson, 'zh')
const en = buildLessonMaterial(autogradModule, lesson, 'en')
const media = getLessonMedia('1.3')
const { module:inferenceModule, lesson:cacheLesson } = requireLesson('inference', '6.2')
const cacheZh = buildLessonMaterial(inferenceModule, cacheLesson, 'zh')
const cacheEn = buildLessonMaterial(inferenceModule, cacheLesson, 'en')
const cacheMedia = getLessonMedia('6.2')

for (const [label, material] of [['zh', zh], ['en', en]]) {
  check(/class Value/.test(material.code), `1.3 ${label} code must define Value`)
  check(/__add__/.test(material.code) && /__mul__/.test(material.code), `1.3 ${label} code must implement add and multiply`)
  check(/def backward/.test(material.code), `1.3 ${label} code must implement backward`)
  check(/\.grad \+=/.test(material.code), `1.3 ${label} code must accumulate shared-node gradients`)
  check(!/autodiff\(/.test(material.code), `1.3 ${label} code still calls an undefined autodiff helper`)
  check(material.practice.evidence.length >= 4, `1.3 ${label} needs four inspectable evidence items`)
  check(/pytest|test/i.test(material.practice.evidence.join(' ')), `1.3 ${label} evidence must require executable tests`)
  check(material.mastery.length >= 4, `1.3 ${label} needs a specific mastery gate`)
}

check(media?.segments?.length >= 4, '1.3 must use at least four bounded source segments')
check(media?.segments?.every(segment => segment.start < segment.end), '1.3 source segments need valid time bounds')
check(media?.segments?.every(segment => segment.before && segment.after), '1.3 source segments need before/after guidance')
check(media?.requiredDuration, '1.3 must disclose required video duration')

const runtime = spawnSync('python3', ['-c', zh.code], { encoding:'utf8' })
const runtimeResult = normalizeRuntime(runtime)
check(runtimeResult.ok, `1.3 displayed Python must run cleanly: ${runtimeResult.detail}`)

for (const [label, material] of [['zh', cacheZh], ['en', cacheEn]]) {
  check(/def decode_step/.test(material.code), `6.2 ${label} code must implement incremental decode`)
  check(/cache\["k"\]\.append/.test(material.code) && /cache\["v"\]\.append/.test(material.code), `6.2 ${label} code must append K/V once per token`)
  check(/def kv_cache_bytes/.test(material.code), `6.2 ${label} code must expose the memory formula`)
  check(/reference/.test(material.code), `6.2 ${label} code must compare cached and recomputed outputs`)
  check(!/accepted_tokens|t_draft|t_verify/.test(material.code), `6.2 ${label} still shows unrelated speculative-decoding code`)
  check(material.practice.evidence.length >= 4, `6.2 ${label} needs four inspectable evidence items`)
}
check(cacheMedia?.requiredDuration === '12:08', '6.2 must disclose the full 12:08 required video')
const cacheRuntime = spawnSync('python3', ['-c', cacheZh.code], { encoding:'utf8' })
const cacheRuntimeResult = normalizeRuntime(cacheRuntime)
check(cacheRuntimeResult.ok, `6.2 displayed Python must run cleanly: ${cacheRuntimeResult.detail}`)

if (failures.length) {
  console.error(`Flagship practice QA failed (${failures.length}):`)
  failures.forEach(failure => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Flagship practice QA passed')
console.log('- lessons: 1.3, 6.2')
console.log(`- required_segments: ${media.segments.length}`)
console.log(`- evidence_items: ${zh.practice.evidence.length}`)
