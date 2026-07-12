import { readFile } from 'node:fs/promises'
import { AI_REFERRER_DOMAINS, inferAiPlatform } from '../src/aiReferrers.js'
import { geoLessonIds } from '../src/geoContent.js'
import { lessonPath } from '../src/lessonRoutes.js'

const baseline = JSON.parse(await readFile(new URL('../geo/query-set.json', import.meta.url), 'utf8'))
const firstObservation = JSON.parse(await readFile(new URL('../geo/baseline-2026-07-12.json', import.meta.url), 'utf8'))
const failures = []
const check = (condition, message) => { if (!condition) failures.push(message) }
const platformIds = baseline.platforms.map(platform => platform.id)
const promptIds = baseline.prompts.map(prompt => prompt.id)

check(platformIds.length === 6, `Expected 6 platforms, found ${platformIds.length}`)
check(new Set(platformIds).size === platformIds.length, 'Duplicate platform IDs')
check(new Set(promptIds).size === promptIds.length, 'Duplicate prompt IDs')
check(baseline.prompts.filter(prompt => prompt.cadence === 'weekly').length >= 6, 'Expected at least 6 weekly prompts')
check(baseline.prompts.some(prompt => prompt.intent === 'discovery'), 'Missing discovery prompt')
check(baseline.prompts.some(prompt => prompt.intent === 'branded-control'), 'Missing branded control prompt')

for (const platform of baseline.platforms) {
  check(platform.url.startsWith('https://'), `Platform URL must use HTTPS: ${platform.id}`)
  check(Boolean(AI_REFERRER_DOMAINS[platform.id]), `Missing referral domains: ${platform.id}`)
  check(inferAiPlatform(platform.url)?.platform === platform.id, `Platform URL is not recognized as a referrer: ${platform.id}`)
}

for (const prompt of baseline.prompts) {
  check(['weekly', 'monthly'].includes(prompt.cadence), `Invalid cadence: ${prompt.id}`)
  check(prompt.text.length >= 35, `Prompt is too short: ${prompt.id}`)
  if (prompt.lessonId) {
    check(geoLessonIds.includes(prompt.lessonId), `Prompt does not map to a GEO lesson: ${prompt.id}`)
    check(lessonPath(prompt.lessonId, 'zh').startsWith('/zh/lesson/'), `Prompt lesson route is invalid: ${prompt.id}`)
  }
}

check(inferAiPlatform('https://example.com/') === null, 'Unrelated referrer was misclassified')
check(inferAiPlatform('not a url') === null, 'Malformed referrer was misclassified')
check(firstObservation.platformRuns.length === 6, 'First observation must include all 6 platforms')
check(firstObservation.platformRuns.every(run => platformIds.includes(run.platform)), 'First observation contains an unknown platform')
check(firstObservation.siteReadiness.localizedGeoUrlCount === geoLessonIds.length * 2, 'First observation GEO URL count is stale')
check(firstObservation.indexNowSubmission.urlCount === geoLessonIds.length * 2 + 2, 'First IndexNow submission URL count is stale')
check(firstObservation.indexNowSubmission.accepted === true, 'First IndexNow submission was not accepted')

const weeklyRuns = baseline.platforms.length * baseline.prompts.filter(prompt => prompt.cadence === 'weekly').length
const fullRuns = baseline.platforms.length * baseline.prompts.length
console.log(JSON.stringify({ version: baseline.version, platforms: platformIds, prompts: baseline.prompts.length, weeklyRuns, fullRuns, failures }, null, 2))
if (failures.length) process.exit(1)
