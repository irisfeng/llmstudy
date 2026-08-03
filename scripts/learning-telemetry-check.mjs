import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DEPTH_MILESTONES,
  ENGAGEMENT_VISIBLE_MS,
  advanceLessonTelemetry,
  createLessonTelemetryState,
  noteLengthBucket,
} from '../src/learningTelemetry.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const failures = []
const check = (condition, message) => { if (!condition) failures.push(message) }

check(ENGAGEMENT_VISIBLE_MS === 5 * 60 * 1000, 'Effective learning must require five visible minutes')
check(DEPTH_MILESTONES.join(',') === '25,50,75,90', 'Reading-depth milestones changed')

let state = createLessonTelemetryState()
let result = advanceLessonTelemetry(state, { visibleMs: 60_000, depth: 24 })
check(!result.engagedNow && result.depthsReached.length === 0, 'Shallow reading was marked engaged')

state = result.state
result = advanceLessonTelemetry(state, { visibleMs: 60_000, depth: 52 })
check(result.engagedNow, '50% reading depth did not mark the lesson engaged')
check(result.depthsReached.join(',') === '25,50', 'Depth milestones were not emitted exactly once')

state = result.state
result = advanceLessonTelemetry(state, { visibleMs: 300_000, depth: 91 })
check(!result.engagedNow, 'Engagement was emitted twice')
check(result.depthsReached.join(',') === '75,90', 'Later depth milestones are incomplete')

check(noteLengthBucket('') === 'empty', 'Empty note bucket changed')
check(noteLengthBucket('a'.repeat(49)) === '1-49', 'Short note bucket changed')
check(noteLengthBucket('a'.repeat(120)) === '50-199', 'Medium note bucket changed')
check(noteLengthBucket('a'.repeat(200)) === '200-499', 'Long-medium note lower bound changed')
check(noteLengthBucket('a'.repeat(499)) === '200-499', 'Long-medium note upper bound changed')
check(noteLengthBucket('a'.repeat(500)) === '500+', 'Long note bucket changed')

const appSource = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8')
for (const marker of [
  "trackEvent('lesson_engaged'",
  "trackEvent('lesson_depth_reached'",
  "trackEvent('quiz_answered'",
  "trackEvent('note_saved'",
  "trackEvent('resource_opened'",
  'noteLengthBucket(note)',
]) {
  check(appSource.includes(marker), `App is missing telemetry marker: ${marker}`)
}

if (failures.length) {
  console.error(`Learning telemetry check failed (${failures.length})`)
  failures.forEach(failure => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Learning telemetry check passed: engagement, depth, quiz, note and resource events use privacy-safe properties.')
