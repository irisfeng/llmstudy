import { readFile } from 'node:fs/promises'
import { modules } from '../src/data.js'
import { worldModules } from '../src/worldModelData.js'
import { lessonHasMedia } from '../src/lessonContent.js'

const ledgerPath = new URL('../content/lesson-operations.json', import.meta.url)
const failures = []
const check = (condition, message) => {
  if (!condition) failures.push(message)
}

const expectedLessons = [
  ...modules.flatMap(module => module.lessons.map(lesson => ({
    id: lesson[0],
    track: 'llm',
    module: module.id,
    title: lesson[1],
    has_media: lessonHasMedia(lesson[0]),
  }))),
  ...worldModules.flatMap(module => module.lessons.map(lesson => ({
    id: lesson[0],
    track: 'world-models',
    module: module.id,
    title: lesson[1],
    has_media: lessonHasMedia(lesson[0]),
  }))),
]

const expectedById = new Map(expectedLessons.map(lesson => [lesson.id, lesson]))
check(expectedById.size === expectedLessons.length, 'Source lesson IDs are not unique')
const mediaLessonCount = expectedLessons.filter(lesson => lesson.has_media).length
const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8')
check(readme.includes(`${mediaLessonCount} 节课程配有视频研讨`), `README media count must match source (${mediaLessonCount})`)

let ledger
try {
  ledger = JSON.parse(await readFile(ledgerPath, 'utf8'))
} catch (error) {
  failures.push(`Unable to read ${ledgerPath.pathname}: ${error.code || error.message}`)
}

const rows = ledger && !Array.isArray(ledger) && Array.isArray(ledger.lessons)
  ? ledger.lessons
  : null
check(Array.isArray(rows), 'Ledger must be an object with a lessons array')

const requiredFields = [
  'id',
  'track',
  'module',
  'title',
  'has_media',
  'priority',
  'assessment_status',
  'score',
  'hard_gates',
  'promotion_eligible',
  'last_verified_at',
  'next_review_at',
  'change_reason',
]
const validPriorities = new Set(['P0', 'P1', 'P2'])
const validStatuses = new Set(['pending', 'verified'])
const datePattern = /^\d{4}-\d{2}-\d{2}$/
const flagshipIds = new Set(['p.1', '0.1', '1.3', '3.2', '6.2', 'wm.0.1'])
const isValidDate = value => {
  if (value === null) return true
  if (typeof value !== 'string' || !datePattern.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

if (rows) {
  const rowIds = rows.map(row => row?.id)
  const duplicateIds = rowIds.filter((id, index) => rowIds.indexOf(id) !== index)
  const missingIds = expectedLessons.filter(lesson => !rowIds.includes(lesson.id)).map(lesson => lesson.id)
  const extraIds = rowIds.filter(id => !expectedById.has(id))

  check(rows.length === expectedLessons.length, `Expected ${expectedLessons.length} ledger rows, found ${rows.length}`)
  check(duplicateIds.length === 0, `Duplicate ledger IDs: ${[...new Set(duplicateIds)].join(', ')}`)
  check(missingIds.length === 0, `Missing ledger IDs: ${missingIds.join(', ')}`)
  check(extraIds.length === 0, `Unknown ledger IDs: ${[...new Set(extraIds)].join(', ')}`)

  for (const row of rows) {
    const expected = expectedById.get(row?.id)
    for (const field of requiredFields) check(Object.hasOwn(row || {}, field), `${row?.id || '<unknown>'}: missing ${field}`)
    if (!expected) continue

    check(row.track === expected.track, `${row.id}: track does not match source (${expected.track})`)
    check(row.module === expected.module, `${row.id}: module does not match source (${expected.module})`)
    check(row.title === expected.title, `${row.id}: title does not match source`)
    check(row.has_media === expected.has_media, `${row.id}: has_media does not match lessonHasMedia`)
    check(validPriorities.has(row.priority), `${row.id}: invalid priority ${row.priority}`)
    if (flagshipIds.has(row.id)) check(row.priority === 'P0', `${row.id}: flagship lessons must be P0`)
    check(validStatuses.has(row.assessment_status), `${row.id}: invalid assessment_status ${row.assessment_status}`)
    check(row.score === null || (Number.isInteger(row.score) && row.score >= 0 && row.score <= 100), `${row.id}: score must be null or an integer from 0 to 100`)
    check(row.promotion_eligible === false || row.promotion_eligible === true, `${row.id}: promotion_eligible must be boolean`)
    check(row.hard_gates && typeof row.hard_gates === 'object' && !Array.isArray(row.hard_gates), `${row.id}: hard_gates must be an object of booleans`)
    if (row.hard_gates && typeof row.hard_gates === 'object' && !Array.isArray(row.hard_gates)) {
      const gateValues = Object.values(row.hard_gates)
      check(gateValues.length > 0 && gateValues.every(value => typeof value === 'boolean'), `${row.id}: hard_gates values must be booleans`)
    }
    check(typeof row.change_reason === 'string' && row.change_reason.trim().length > 0, `${row.id}: change_reason is required`)

    for (const field of ['last_verified_at', 'next_review_at']) {
      check(isValidDate(row[field]), `${row.id}: ${field} must be null or a valid YYYY-MM-DD date`)
    }
    if (row.last_verified_at && row.next_review_at) {
      check(row.next_review_at >= row.last_verified_at, `${row.id}: next_review_at precedes last_verified_at`)
    }

    if (row.assessment_status === 'verified') {
      check(row.score !== null, `${row.id}: verified lessons require a score`)
      if (row.score !== null) {
        const grade = row.score >= 85 ? 'A' : row.score >= 70 ? 'B' : 'C'
        check(row.grade === undefined || row.grade === grade, `${row.id}: grade does not match score (${grade})`)
      }
    }
    if (row.assessment_status === 'pending') check(row.score === null, `${row.id}: pending lessons must keep score null`)

    const allHardGates = row.hard_gates && typeof row.hard_gates === 'object' && !Array.isArray(row.hard_gates)
      ? Object.values(row.hard_gates).length > 0 && Object.values(row.hard_gates).every(Boolean)
      : false
    const canPromote = row.assessment_status === 'verified' && row.score !== null && row.score >= 85 && allHardGates
    check(row.promotion_eligible === canPromote, `${row.id}: promotion_eligible must be ${canPromote} for current status, score, and hard gates`)
  }
}

const summary = {
  status: failures.length ? 'RED' : 'GREEN',
  source_lessons: expectedLessons.length,
  ledger_lessons: rows?.length || 0,
  media_lessons: mediaLessonCount,
  pending_lessons: rows?.filter(row => row.assessment_status === 'pending').length || 0,
  promotion_eligible: rows?.filter(row => row.promotion_eligible).length || 0,
  failures,
}
console.log(JSON.stringify(summary, null, 2))
if (failures.length) process.exit(1)
