import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { modules } from '../src/data.js'
import { buildLessonMaterial } from '../src/lessonContent.js'
import { lessonPath, lessonRoutes } from '../src/lessonRoutes.js'
import { DEFAULT_OG_IMAGE, getHomeSeo, getLessonSeo, lessonStructuredData, SITE_URL } from '../src/seo.js'

const dist = new URL('../dist/', import.meta.url)
const template = await readFile(new URL('index.html', dist), 'utf8')
const today = new Date().toISOString().slice(0, 10)

const escapeHtml = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;')

const jsonForHtml = value => JSON.stringify(value).replaceAll('<', '\\u003c')

function seoHead(meta, structuredData) {
  return `
    <!-- seo:generated -->
    <link rel="canonical" href="${escapeHtml(meta.canonical)}" />
    <link rel="alternate" hreflang="zh-CN" href="${escapeHtml(meta.alternates.zh)}" />
    <link rel="alternate" hreflang="en" href="${escapeHtml(meta.alternates.en)}" />
    <link rel="alternate" hreflang="x-default" href="${escapeHtml(meta.alternates.zh)}" />
    <meta property="og:site_name" content="LLM Study · Under the Hood" />
    <meta property="og:type" content="${meta.type}" />
    <meta property="og:title" content="${escapeHtml(meta.title)}" />
    <meta property="og:description" content="${escapeHtml(meta.description)}" />
    <meta property="og:url" content="${escapeHtml(meta.canonical)}" />
    <meta property="og:image" content="${DEFAULT_OG_IMAGE}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(meta.title)}" />
    <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
    <meta name="twitter:image" content="${DEFAULT_OG_IMAGE}" />
    ${structuredData ? `<script type="application/ld+json">${jsonForHtml(structuredData)}</script>` : ''}`
}

function staticLessonContent(meta, material) {
  const isZh = meta.locale === 'zh'
  return `<main class="seo-fallback" data-seo-fallback>
    <nav><a href="/${meta.locale}/">${isZh ? 'LLM Study 大模型系统课' : 'LLM Study'}</a> / ${escapeHtml(meta.module.title)}</nav>
    <article>
      <p>LESSON ${escapeHtml(material.id)} · ${escapeHtml(material.type)} · ${escapeHtml(material.duration)}</p>
      <h1>${escapeHtml(material.title)}</h1>
      <p>${escapeHtml(meta.description)}</p>
      <h2>${isZh ? '学完你应该能够' : 'Learning objectives'}</h2>
      <ol>${material.objectives.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ol>
      <h2>${isZh ? '核心概念' : 'Core concepts'}</h2>
      ${material.concepts.slice(0, 5).map(item => `<section><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.note)}</p></section>`).join('')}
      <h2>${isZh ? '实践任务' : 'Build and verify'}</h2>
      <p>${escapeHtml(material.practice.task)}</p>
      <ul>${material.practice.steps.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      <p><a href="${escapeHtml(meta.canonical)}">${isZh ? '进入完整互动课程' : 'Open the complete interactive lesson'}</a></p>
    </article>
  </main>`
}

function staticHomeContent(meta) {
  const isZh = meta.locale === 'zh'
  return `<main class="seo-fallback" data-seo-fallback>
    <h1>${isZh ? '从第一性原理掌握大模型' : 'Build large language models from first principles'}</h1>
    <p>${escapeHtml(meta.description)}</p>
    <p>${isZh ? '69节深度课，覆盖反向传播、Token、Transformer、训练、对齐、推理部署与Agent。' : '69 in-depth lessons spanning backpropagation, tokens, Transformers, training, post-training, inference, deployment, and agents.'}</p>
    <a href="${lessonPath('0.1', meta.locale)}">${isZh ? '开始第一节' : 'Start lesson one'}</a>
  </main>`
}

function renderPage(meta, body, structuredData) {
  return template
    .replace(/<html lang="[^"]*">/, `<html lang="${meta.locale === 'zh' ? 'zh-CN' : 'en'}">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${escapeHtml(meta.description)}" />`)
    .replace('</head>', `${seoHead(meta, structuredData)}</head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`)
}

async function writePage(relativePath, html) {
  const path = join(dist.pathname, relativePath, 'index.html')
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, html)
}

for (const locale of ['zh', 'en']) {
  const homeMeta = getHomeSeo(locale)
  await writePage(locale, renderPage(homeMeta, staticHomeContent(homeMeta)))

  for (const route of lessonRoutes) {
    const meta = getLessonSeo(route.id, locale)
    const module = locale === 'zh' ? route.module : route.englishModule
    const lesson = locale === 'zh' ? route.lesson : route.englishLesson
    const material = buildLessonMaterial(module, lesson, locale)
    const relativePath = lessonPath(route.id, locale).replace(/^\//, '').replace(/\/$/, '')
    await writePage(relativePath, renderPage(meta, staticLessonContent(meta, material), lessonStructuredData(meta)))
  }
}

const rootMeta = getHomeSeo('zh')
await writeFile(new URL('index.html', dist), renderPage(rootMeta, staticHomeContent(rootMeta)))

const sitemapEntries = lessonRoutes.flatMap(route => ['zh', 'en'].map(locale => {
  const loc = `${SITE_URL}${lessonPath(route.id, locale)}`
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <xhtml:link rel="alternate" hreflang="zh-CN" href="${SITE_URL}${lessonPath(route.id, 'zh')}" />
    <xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}${lessonPath(route.id, 'en')}" />
  </url>`
}))
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url><loc>${SITE_URL}/zh/</loc><lastmod>${today}</lastmod></url>
  <url><loc>${SITE_URL}/en/</loc><lastmod>${today}</lastmod></url>
${sitemapEntries.join('\n')}
</urlset>
`
await writeFile(new URL('sitemap.xml', dist), sitemap)
await writeFile(new URL('robots.txt', dist), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`)

console.log(`Prerendered ${lessonRoutes.length * 2 + 3} localized pages and ${lessonRoutes.length * 2 + 2} sitemap URLs.`)
