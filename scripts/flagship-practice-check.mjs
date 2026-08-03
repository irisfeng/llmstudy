import { modules } from '../src/data.js'
import { buildLessonMaterial, getLessonMedia } from '../src/lessonContent.js'
import { spawnSync } from 'node:child_process'

const failures = []
const check = (value, message) => { if (!value) failures.push(message) }
const autogradModule = modules.find(module => module.id === 'autograd')
const lesson = autogradModule.lessons.find(item => item[0] === '1.3')
const zh = buildLessonMaterial(autogradModule, lesson, 'zh')
const en = buildLessonMaterial(autogradModule, lesson, 'en')
const media = getLessonMedia('1.3')

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
check(runtime.status === 0, `1.3 displayed Python must run cleanly: ${runtime.stderr.trim()}`)

if (failures.length) {
  console.error(`Flagship practice QA failed (${failures.length}):`)
  failures.forEach(failure => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Flagship practice QA passed')
console.log('- lesson: 1.3')
console.log(`- required_segments: ${media.segments.length}`)
console.log(`- evidence_items: ${zh.practice.evidence.length}`)
