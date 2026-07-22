import { modules } from './data.js'
import { localizeModules } from './localizedData.js'
import { localizeWorldModules, worldModules } from './worldModelData.js'

const slugify = value => value
  .toLowerCase()
  .replaceAll('–', '-')
  .replaceAll('—', '-')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

export const trackCatalog = {
  llm: { id: 'llm', modules, englishModules: localizeModules(modules, 'en') },
  'world-models': { id: 'world-models', modules: worldModules, englishModules: localizeWorldModules('en') },
}

export const lessonRoutes = Object.values(trackCatalog).flatMap(track =>
  track.modules.flatMap((module, moduleIndex) => module.lessons.map((lesson, lessonIndex) => {
    const englishModule = track.englishModules[moduleIndex]
    const englishLesson = englishModule.lessons[lessonIndex]
    const titleSlug = slugify(englishLesson[1]).split('-').slice(0, 10).join('-')
    const idSlug = lesson[0].replaceAll('.', '-')
    return {
      id: lesson[0], slug: `${idSlug}-${titleSlug}`, trackId: track.id,
      module, lesson, englishModule, englishLesson, moduleIndex, lessonIndex,
    }
  })),
)

const routeById = new Map(lessonRoutes.map(route => [route.id, route]))
const routeByTrackSlug = new Map(lessonRoutes.map(route => [`${route.trackId}:${route.slug}`, route]))

export function getLessonRoute(id) {
  return routeById.get(id) || null
}

export function trackPath(trackId = 'llm', locale = 'zh') {
  return trackId === 'world-models' ? `/${locale}/world-models/` : `/${locale}/`
}

export function lessonPath(id, locale = 'zh') {
  const route = getLessonRoute(id)
  if (!route) return trackPath('llm', locale)
  const prefix = route.trackId === 'world-models' ? `/${locale}/world-models/lesson/` : `/${locale}/lesson/`
  return `${prefix}${route.slug}/`
}

export function homePath(locale = 'zh') {
  return trackPath('llm', locale)
}

export function matchSitePath(pathname = '/') {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  const worldLesson = normalized.match(/^\/(zh|en)\/world-models\/lesson\/([^/]+)$/)
  const llmLesson = normalized.match(/^\/(zh|en)\/lesson\/([^/]+)$/)
  const lessonMatch = worldLesson || llmLesson
  if (lessonMatch) {
    const trackId = worldLesson ? 'world-models' : 'llm'
    const route = routeByTrackSlug.get(`${trackId}:${lessonMatch[2]}`)
    if (route) return { type: 'lesson', locale: lessonMatch[1], route, trackId }

    const idMatch = lessonMatch[2].match(trackId === 'world-models' ? /^(wm)-(\d+)-(\d+)/ : /^(\d+)-(\d+)/)
    const fallbackId = trackId === 'world-models'
      ? idMatch && `wm.${idMatch[2]}.${idMatch[3]}`
      : idMatch && `${idMatch[1]}.${idMatch[2]}`
    const byId = fallbackId ? routeById.get(fallbackId) : null
    if (byId) return { type: 'lesson', locale: lessonMatch[1], route: byId, trackId, needsCanonical: true }
  }

  const worldHome = normalized.match(/^\/(zh|en)\/world-models$/)
  if (worldHome) return { type: 'home', locale: worldHome[1], trackId: 'world-models' }
  const llmHome = normalized.match(/^\/(zh|en)$/)
  if (llmHome) return { type: 'home', locale: llmHome[1], trackId: 'llm' }
  return { type: 'home', locale: null, trackId: 'llm' }
}

export function legacyLessonId(hash = '') {
  const match = hash.match(/^#lesson=(.+)$/)
  return match && routeById.has(decodeURIComponent(match[1])) ? decodeURIComponent(match[1]) : null
}
