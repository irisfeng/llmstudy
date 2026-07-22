import { getLessonRoute, lessonPath, trackPath } from './lessonRoutes.js'
import { GEO_UPDATED_AT, getGeoBrief } from './geoContent.js'

export const SITE_URL = 'https://llmstudy.shddai.net'
export const SITE_NAME = 'LLM Study · Under the Hood'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-cover.png`

const absolute = path => `${SITE_URL}${path}`

export function getHomeSeo(locale = 'zh', trackId = 'llm') {
  const isZh = locale === 'zh'
  const isWorld = trackId === 'world-models'
  return {
    locale, trackId,
    title: isWorld
      ? (isZh ? 'World Models · 从状态、预测到空间智能' : 'World Models · From State and Prediction to Spatial Intelligence')
      : (isZh ? 'LLM Study · 从原理到系统的大模型课程' : 'LLM Study · Build Large Language Models from First Principles'),
    description: isWorld
      ? (isZh ? '12节世界模型系统课：POMDP、隐空间动力学、Dreamer、MuZero、JEPA、Genie、Marble、Cosmos与评测。' : 'A 12-lesson world-model path through POMDPs, latent dynamics, Dreamer, MuZero, JEPA, Genie, Marble, Cosmos, and evaluation.')
      : (isZh ? '75节系统课程，从Token、反向传播和Transformer，到推理模型、训练、对齐、部署与Agent。' : 'A 75-lesson path from tokens, backpropagation, and Transformers to reasoning models, training, post-training, inference, and agents.'),
    canonical: absolute(trackPath(trackId, locale)),
    alternates: { zh: absolute(trackPath(trackId, 'zh')), en: absolute(trackPath(trackId, 'en')) },
    type: 'website',
  }
}

export function getLessonSeo(id, locale = 'zh') {
  const route = getLessonRoute(id)
  if (!route) return getHomeSeo(locale)
  const lesson = locale === 'zh' ? route.lesson : route.englishLesson
  const module = locale === 'zh' ? route.module : route.englishModule
  const isZh = locale === 'zh'
  const geoBrief = getGeoBrief(id, locale)
  const description = geoBrief?.answer || (isZh
    ? `${lesson[1]}：理解${lesson[4]}，完成“${lesson[5]}”。属于「${module.title}」学习阶段。`
    : `${lesson[1]}. Learn ${lesson[4]} and complete: ${lesson[5]}. Part of the “${module.title}” learning path.`)
  return {
    locale,
    id,
    trackId: route.trackId,
    title: `${lesson[1]} · ${route.trackId === 'world-models' ? 'World Models' : (isZh ? '大模型系统课' : 'LLM Study')}`,
    description: description.slice(0, 180),
    canonical: absolute(lessonPath(id, locale)),
    alternates: { zh: absolute(lessonPath(id, 'zh')), en: absolute(lessonPath(id, 'en')) },
    type: 'article',
    lesson,
    module,
    geoBrief,
  }
}

const upsertMeta = (selector, attributes) => {
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value))
}

const upsertLink = (selector, attributes) => {
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('link')
    document.head.appendChild(element)
  }
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value))
}

export function applyDocumentSeo(meta) {
  document.title = meta.title
  upsertMeta('meta[name="description"]', { name: 'description', content: meta.description })
  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: meta.title })
  upsertMeta('meta[property="og:description"]', { property: 'og:description', content: meta.description })
  upsertMeta('meta[property="og:type"]', { property: 'og:type', content: meta.type })
  upsertMeta('meta[property="og:url"]', { property: 'og:url', content: meta.canonical })
  upsertMeta('meta[property="og:image"]', { property: 'og:image', content: DEFAULT_OG_IMAGE })
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: meta.title })
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: meta.description })
  upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: DEFAULT_OG_IMAGE })
  upsertLink('link[rel="canonical"]', { rel: 'canonical', href: meta.canonical })
  upsertLink('link[rel="alternate"][hreflang="zh-CN"]', { rel: 'alternate', hreflang: 'zh-CN', href: meta.alternates.zh })
  upsertLink('link[rel="alternate"][hreflang="en"]', { rel: 'alternate', hreflang: 'en', href: meta.alternates.en })
  upsertLink('link[rel="alternate"][hreflang="x-default"]', { rel: 'alternate', hreflang: 'x-default', href: meta.alternates.zh })
}

export function lessonStructuredData(meta) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: meta.title,
    description: meta.description,
    url: meta.canonical,
    inLanguage: meta.locale === 'zh' ? 'zh-CN' : 'en',
    learningResourceType: 'lesson',
    isAccessibleForFree: true,
    educationalLevel: 'Intermediate',
    isPartOf: {
      '@type': 'Course',
      name: meta.trackId === 'world-models'
        ? (meta.locale === 'zh' ? 'World Models · 世界模型学习路径' : 'World Models Learning Path')
        : (meta.locale === 'zh' ? 'LLM Study · 大模型系统课' : 'LLM Study · From Principles to Systems'),
      url: absolute(trackPath(meta.trackId, meta.locale)),
      provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    },
  }
  if (meta.geoBrief) {
    data.dateModified = GEO_UPDATED_AT
    data.about = meta.geoBrief.question
    data.citation = meta.geoBrief.sources.map(source => source.url)
  }
  return data
}
