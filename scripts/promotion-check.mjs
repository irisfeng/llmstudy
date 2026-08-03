import { readFile } from 'node:fs/promises'
import { lessonRoutes } from '../src/lessonRoutes.js'

const config = JSON.parse(await readFile(new URL('../promotion/campaigns.json', import.meta.url), 'utf8'))
const results = JSON.parse(await readFile(new URL('../promotion/results.json', import.meta.url), 'utf8'))
const failures = []
const check = (condition, message) => { if (!condition) failures.push(message) }
const validPaths = new Set(['/zh/', '/en/', ...lessonRoutes.flatMap(route => [`/zh/lesson/${route.slug}/`, `/en/lesson/${route.slug}/`])])
const ids = config.channels.map(channel => channel.id)
const contents = config.channels.map(channel => channel.content)
const campaignIds = config.channels.map(channel => channel.campaignId)
const validStatuses = new Set(['draft', 'scheduled', 'published', 'completed', 'paused'])
const validWindows = new Set(['24h', '7d', '30d'])
const validDecisions = new Set(['pending', 'scale', 'iterate', 'pause'])

check(config.site === 'https://llmstudy.shddai.net', 'Unexpected promotion site URL')
check(config.campaign === 'organic_launch', 'Unexpected campaign name')
check(config.channels.length >= 6, 'Expected at least 6 organic channels')
check(new Set(ids).size === ids.length, 'Duplicate promotion channel')
check(new Set(contents).size === contents.length, 'Duplicate UTM content value')
check(campaignIds.every(Boolean), 'Every channel must have a campaignId')
check(new Set(campaignIds).size === campaignIds.length, 'Duplicate campaignId')
check(results.version === config.version, 'Campaign and result ledger versions differ')

for (const channel of config.channels) {
  check(channel.week >= 1 && channel.week <= 4, `Invalid week: ${channel.id}`)
  check(validPaths.has(channel.targetPath), `Invalid target path: ${channel.id}`)
  check(Boolean(channel.goal), `Missing channel goal: ${channel.id}`)
  check(validStatuses.has(channel.status), `Invalid campaign status: ${channel.campaignId}`)
  check(channel.status === 'draft' || Boolean(channel.originalUrl), `Published campaign lacks original URL: ${channel.campaignId}`)
  check(channel.status === 'draft' || Boolean(channel.publishedAt), `Published campaign lacks publish time: ${channel.campaignId}`)
  const url = new URL(channel.targetPath, config.site)
  url.searchParams.set('utm_source', channel.id)
  url.searchParams.set('utm_medium', channel.medium)
  url.searchParams.set('utm_campaign', config.campaign)
  url.searchParams.set('utm_content', channel.content)
  check(url.searchParams.size === 4, `Incomplete UTM link: ${channel.id}`)
}

for (const record of results.records) {
  check(campaignIds.includes(record.campaignId), `Result references unknown campaign: ${record.campaignId}`)
  check(validWindows.has(record.window), `Invalid result window: ${record.campaignId}`)
  check(validDecisions.has(record.decision), `Invalid result decision: ${record.campaignId}`)
  for (const key of ['impressions', 'landings', 'lesson_starts', 'lesson_engaged', 'lesson_completed', 'shares', 'actionable_feedback']) {
    check(record.metrics[key] === null || (Number.isInteger(record.metrics[key]) && record.metrics[key] >= 0), `Invalid ${key}: ${record.campaignId}`)
  }
  if (record.metrics.landings !== null && record.metrics.lesson_starts !== null) {
    check(record.metrics.lesson_starts <= record.metrics.landings, `Starts exceed landings: ${record.campaignId}`)
  }
  if (record.metrics.lesson_starts !== null && record.metrics.lesson_engaged !== null) {
    check(record.metrics.lesson_engaged <= record.metrics.lesson_starts, `Engaged exceeds starts: ${record.campaignId}`)
  }
  if (record.metrics.lesson_engaged !== null && record.metrics.lesson_completed !== null) {
    check(record.metrics.lesson_completed <= record.metrics.lesson_engaged, `Completions exceed engaged: ${record.campaignId}`)
  }
}

console.log(JSON.stringify({ version: config.version, channels: ids, campaigns: campaignIds, published: config.channels.filter(channel => channel.status !== 'draft').length, result_records: results.records.length, weeks: [...new Set(config.channels.map(channel => channel.week))], failures }, null, 2))
if (failures.length) process.exit(1)
