import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { modules, resources } from '../src/data.js'
import { localizeModules } from '../src/localizedData.js'
import { buildLessonMaterial } from '../src/lessonContent.js'
import { lessonPath, lessonRoutes } from '../src/lessonRoutes.js'
import { worldModules } from '../src/worldModelData.js'

const failures = []
const check = (value, message) => { if (!value) failures.push(message) }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const llmLessons = modules.flatMap(module => module.lessons)
const worldLessons = worldModules.flatMap(module => module.lessons)
const frontier = modules.find(module => module.id === 'frontier-llm')
const lesson = frontier?.lessons.find(item => item[0] === '8.7')
const englishFrontier = localizeModules(modules, 'en').find(module => module.id === 'frontier-llm')
const englishLesson = englishFrontier?.lessons.find(item => item[0] === '8.7')

check(llmLessons.length === 76, `Expected 76 LLM lessons, found ${llmLessons.length}`)
check(worldLessons.length === 12, `Expected 12 World Models lessons, found ${worldLessons.length}`)
check(lessonRoutes.length === 88, `Expected 88 total routes, found ${lessonRoutes.length}`)
check(frontier?.weeks === '4 周' && frontier?.hours === 32, 'Frontier module duration was not expanded to four weeks / 32 hours')
check(frontier?.lessons.at(-1)?.[0] === '8.7', 'Kimi K3 lesson must be the final frontier lesson')
check(Boolean(lesson) && Boolean(englishLesson), 'Kimi K3 lesson is missing in one locale')

if (lesson && englishLesson) {
  const zh = buildLessonMaterial(frontier, lesson, 'zh')
  const en = buildLessonMaterial(englishFrontier, englishLesson, 'en')
  const zhText = JSON.stringify(zh)
  const enText = JSON.stringify(en)

  for (const term of ['KDA', 'AttnRes', 'Stable LatentMoE', 'MXFP4', '2.8T', '104B', '896', '16', 'Kimi K3 License']) {
    check(zhText.includes(term), `Chinese Kimi K3 material is missing ${term}`)
    check(enText.includes(term), `English Kimi K3 material is missing ${term}`)
  }
  check(zh.concepts.length === 6 && en.concepts.length === 6, 'Kimi K3 concept map must contain six audited concepts')
  check(zh.practice.evidence.length >= 4 && en.practice.evidence.length >= 4, 'Kimi K3 practice lacks auditable evidence requirements')
  check(zh.spotlight?.title === '开放权重不是无条件开源', 'Chinese open-weight license boundary is missing')
  check(en.spotlight?.body.includes('US$20M'), 'English license threshold summary is missing')
  check(!/[\u3400-\u9fff]/.test(enText), 'English Kimi K3 material contains Chinese text')
  check(zh.code.includes('not the actual checkpoint'), 'Storage lower-bound caveat is missing from the calculation')
  check(lessonPath('8.7', 'zh') === '/zh/lesson/8-7-kimi-k3-audit-a-3t-class-open-weight-system/', 'Kimi K3 canonical route changed unexpectedly')
}

const requiredUrls = [
  'https://arxiv.org/abs/2607.24653',
  'https://github.com/MoonshotAI/Kimi-K3',
  'https://github.com/MoonshotAI/Kimi-K3/blob/main/LICENSE',
]
for (const url of requiredUrls) check(resources.some(resource => resource.url === url), `Missing official Kimi K3 resource: ${url}`)

const countExpectations = {
  'README.md': ['LLM 9 个阶段、76 节', '88 节课程'],
  'src/App.jsx': ['76 节中英双语课程', '<small>76 '],
  'src/auth.jsx': ['88 节课', 'all 88 lessons'],
  'src/seo.js': ['76节系统课程', 'A 76-lesson path'],
  'scripts/prerender-seo.mjs': ['76节深度课', '76 lessons spanning'],
  'docs/free-promotion-plan.md': ['88 节双路线'],
  'promotion/ready-to-post.md': ['88 节 AI 系统课', '目前有 88 节课', '88 节中英双语课'],
  'public/og-cover.svg': ['88 LESSONS'],
}
const countFileText = Object.fromEntries(Object.keys(countExpectations).map(file => [
  file,
  fs.readFileSync(path.join(root, file), 'utf8'),
]))
for (const [file, expectedCopies] of Object.entries(countExpectations)) {
  for (const expected of expectedCopies) {
    check(countFileText[file].includes(expected), `${file} is missing intended course-count copy: ${expected}`)
  }
}
const countText = Object.values(countFileText).join('\n')
for (const stale of ['75节', '75 节', '75 lessons', '87节', '87 节', '87 lessons', '69 LESSONS']) {
  check(!countText.includes(stale), `Stale course count remains: ${stale}`)
}

if (failures.length) {
  console.error(`Kimi K3 content check failed (${failures.length})`)
  failures.forEach(failure => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Kimi K3 content check passed: 76 LLM lessons, 88 total routes, bilingual audit material, official sources, and count consistency.')
