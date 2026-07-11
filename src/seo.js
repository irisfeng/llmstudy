import { getLessonRoute, homePath, lessonPath } from './lessonRoutes.js'

export const SITE_URL = 'https://llmstudy.shddai.net'
export const SITE_NAME = 'LLM Study · Under the Hood'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-cover.png`

const absolute = path => `${SITE_URL}${path}`

export function getHomeSeo(locale = 'zh') {
  const isZh = locale === 'zh'
  return {
    locale,
    title: isZh ? 'LLM Study · 从原理到系统的大模型课程' : 'LLM Study · Build Large Language Models from First Principles',
    description: isZh
      ? '69节系统课程，从Token、反向传播和Transformer，到训练、对齐、推理部署与Agent。包含推导、代码、实验、国内外视频与学习进度。'
      : 'A 69-lesson path from tokens, backpropagation, and Transformers to training, post-training, inference, deployment, and agents.',
    canonical: absolute(homePath(locale)),
    alternates: { zh: absolute(homePath('zh')), en: absolute(homePath('en')) },
    type: 'website',
  }
}

export function getLessonSeo(id, locale = 'zh') {
  const route = getLessonRoute(id)
  if (!route) return getHomeSeo(locale)
  const lesson = locale === 'zh' ? route.lesson : route.englishLesson
  const module = locale === 'zh' ? route.module : route.englishModule
  const isZh = locale === 'zh'
  const description = isZh
    ? `${lesson[1]}：理解${lesson[4]}，完成“${lesson[5]}”。属于大模型系统课「${module.title}」阶段。`
    : `${lesson[1]}. Learn ${lesson[4]} and complete: ${lesson[5]}. Part of the “${module.title}” LLM learning path.`
  return {
    locale,
    id,
    title: `${lesson[1]} · ${isZh ? '大模型系统课' : 'LLM Study'}`,
    description: description.slice(0, 180),
    canonical: absolute(lessonPath(id, locale)),
    alternates: { zh: absolute(lessonPath(id, 'zh')), en: absolute(lessonPath(id, 'en')) },
    type: 'article',
    lesson,
    module,
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
  return {
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
      name: meta.locale === 'zh' ? 'LLM Study · 大模型系统课' : 'LLM Study · From Principles to Systems',
      url: absolute(homePath(meta.locale)),
      provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    },
  }
}
