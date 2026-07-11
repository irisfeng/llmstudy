import { modules } from './data.js'
import { localizeModules } from './localizedData.js'

const slugify = value => value
  .toLowerCase()
  .replaceAll('–', '-')
  .replaceAll('—', '-')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const englishModules = localizeModules(modules, 'en')

export const lessonRoutes = modules.flatMap((module, moduleIndex) => module.lessons.map((lesson, lessonIndex) => {
  const englishModule = englishModules[moduleIndex]
  const englishLesson = englishModule.lessons[lessonIndex]
  const titleSlug = slugify(englishLesson[1]).split('-').slice(0, 9).join('-')
  const idSlug = lesson[0].replace('.', '-')
  return {
    id: lesson[0],
    slug: `${idSlug}-${titleSlug}`,
    module,
    lesson,
    englishModule,
    englishLesson,
    moduleIndex,
    lessonIndex,
  }
}))

const routeById = new Map(lessonRoutes.map(route => [route.id, route]))
const routeBySlug = new Map(lessonRoutes.map(route => [route.slug, route]))

export function getLessonRoute(id) {
  return routeById.get(id) || null
}

export function lessonPath(id, locale = 'zh') {
  const route = getLessonRoute(id)
  return route ? `/${locale}/lesson/${route.slug}/` : `/${locale}/`
}

export function homePath(locale = 'zh') {
  return `/${locale}/`
}

export function matchSitePath(pathname = '/') {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  const lessonMatch = normalized.match(/^\/(zh|en)\/lesson\/([^/]+)$/)
  if (lessonMatch) {
    const route = routeBySlug.get(lessonMatch[2])
    if (route) return { type: 'lesson', locale: lessonMatch[1], route }

    const idMatch = lessonMatch[2].match(/^(\d+)-(\d+)/)
    const byId = idMatch ? routeById.get(`${idMatch[1]}.${idMatch[2]}`) : null
    if (byId) return { type: 'lesson', locale: lessonMatch[1], route: byId, needsCanonical: true }
  }

  const homeMatch = normalized.match(/^\/(zh|en)$/)
  if (homeMatch) return { type: 'home', locale: homeMatch[1] }
  return { type: 'home', locale: null }
}

export function legacyLessonId(hash = '') {
  const match = hash.match(/^#lesson=(.+)$/)
  return match && routeById.has(decodeURIComponent(match[1])) ? decodeURIComponent(match[1]) : null
}
