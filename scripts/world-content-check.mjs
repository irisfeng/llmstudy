import { buildLessonMaterial } from '../src/lessonContent.js'
import { localizeWorldModules, worldModules } from '../src/worldModelData.js'

const failures = []
const check = (condition, message) => { if (!condition) failures.push(message) }
const forbiddenWorldSignatures = [
  [/BPE|字符串与模型之间|高频相邻单元|词表、字节边界/, 'text-tokenizer template'],
  [/执行工具|工具副作用|判断终止|更长的思维文本|嵌入状态机/, 'LLM-agent template'],
  [/Q 与 K|softmax 归一化|路由权重/, 'Transformer-attention template'],
  [/优势函数降低方差|KL 控制策略漂移/, 'policy-optimization template'],
  [/可训练查表|离散 id 选择参数矩阵/, 'lookup-embedding template'],
]
const forbiddenEnglishSignatures = [
  [/\bBPE\b|frequent adjacent units|byte boundaries/, 'text-tokenizer template'],
  [/execute tools|tool side effects|tool loop|longer reasoning text/, 'LLM-agent template'],
  [/Q and K|softmax|routing weights/, 'Transformer-attention template'],
  [/advantage function|policy drift/, 'policy-optimization template'],
  [/trainable lookup table|discrete id selects/, 'lookup-embedding template'],
]

const materials = new Map()
const englishMaterials = new Map()
const englishModules = new Map(localizeWorldModules('en').map(module => [module.id, module]))
for (const module of worldModules) {
  for (const lesson of module.lessons) {
    const englishModule = englishModules.get(module.id)
    const englishLesson = englishModule.lessons.find(candidate => candidate[0] === lesson[0])
    const material = buildLessonMaterial(module, lesson, 'zh')
    const english = buildLessonMaterial(englishModule, englishLesson, 'en')
    materials.set(lesson[0], material)
    englishMaterials.set(lesson[0], english)
    check(material.concepts.length > 0, `${lesson[0]} has no mechanism concepts`)
    for (const concept of material.concepts) {
      check(concept.note.length >= 45, `${lesson[0]}/${concept.name} explanation is too thin`)
      for (const [pattern, label] of forbiddenWorldSignatures) {
        check(!pattern.test(concept.note), `${lesson[0]}/${concept.name} leaked ${label}`)
      }
    }
    check(english.concepts.length > 0, `${lesson[0]} has no English mechanism concepts`)
    for (const concept of english.concepts) {
      check(concept.note.length >= 80, `${lesson[0]}/${concept.name}/en explanation is too thin`)
      for (const [pattern, label] of forbiddenEnglishSignatures) {
        check(!pattern.test(concept.note), `${lesson[0]}/${concept.name}/en leaked ${label}`)
      }
    }
  }
}

const genie = materials.get('wm.3.1')
const genieConcept = name => genie?.concepts.find(concept => concept.name === name)?.note || ''
check(/时空.*离散|离散.*时空/.test(genieConcept('video tokenizer')), 'Genie video tokenizer must explain discrete spatiotemporal representation')
check(/无动作标签/.test(genieConcept('latent action')), 'Genie latent action must explain learning without action labels')
check(/后续|下一帧/.test(genieConcept('autoregressive dynamics')), 'Genie dynamics must explain next-state or next-frame prediction')
check(/逐帧|交互延迟|实时/.test(genieConcept('real-time interaction')), 'Genie real-time interaction must explain the closed interaction loop')
const genieEnglish = englishMaterials.get('wm.3.1')
const genieEnglishConcept = name => genieEnglish?.concepts.find(concept => concept.name === name)?.note || ''
check(/discrete spatiotemporal/.test(genieEnglishConcept('video tokenization')), 'English Genie video tokenization must explain discrete spatiotemporal representation')
check(/without action labels/.test(genieEnglishConcept('latent actions')), 'English Genie latent actions must explain action-free learning')
check(/next frame|next.*latent/.test(genieEnglishConcept('autoregressive dynamics')), 'English Genie dynamics must explain next-state or next-frame prediction')
check(/frame-by-frame|interaction-latency/.test(genieEnglishConcept('interaction')), 'English Genie interaction must explain the real-time loop')

console.log(JSON.stringify({
  lessons: materials.size,
  concepts: [...materials.values()].reduce((count, material) => count + material.concepts.length, 0),
  locales: 2,
  forbiddenSignatures: forbiddenWorldSignatures.length + forbiddenEnglishSignatures.length,
  failures,
}, null, 2))
if (failures.length) process.exit(1)
