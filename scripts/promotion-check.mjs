import { readFile } from 'node:fs/promises'
import { lessonRoutes } from '../src/lessonRoutes.js'

const config = JSON.parse(await readFile(new URL('../promotion/campaigns.json', import.meta.url), 'utf8'))
const results = JSON.parse(await readFile(new URL('../promotion/results.json', import.meta.url), 'utf8'))
const failures = []
const check = (condition, message) => { if (!condition) failures.push(message) }
const channels = Array.isArray(config.channels) ? config.channels : []
const records = Array.isArray(results.records) ? results.records : []
const validPaths = new Set(['/zh/', '/en/', ...lessonRoutes.flatMap(route => [`/zh/lesson/${route.slug}/`, `/en/lesson/${route.slug}/`])])
const ids = channels.map(channel => channel.id)
const contents = channels.map(channel => channel.content)
const campaignIds = channels.map(channel => channel.campaignId)
const validStatuses = new Set(['draft', 'scheduled', 'published', 'completed', 'paused'])
const publishedStatuses = new Set(['published', 'completed', 'paused'])
const validWindows = new Set(['24h', '7d', '30d'])
const validDecisions = new Set(['pending', 'scale', 'iterate', 'pause'])

check(config.site === 'https://llmstudy.shddai.net', 'Unexpected promotion site URL')
check(config.campaign === 'organic_launch', 'Unexpected campaign name')
check(Array.isArray(config.channels), 'Campaign config must contain a channels array')
check(channels.length >= 6, 'Expected at least 6 organic channels')
check(new Set(ids).size === ids.length, 'Duplicate promotion channel')
check(new Set(contents).size === contents.length, 'Duplicate UTM content value')
check(campaignIds.every(Boolean), 'Every channel must have a campaignId')
check(new Set(campaignIds).size === campaignIds.length, 'Duplicate campaignId')
check(results.version === config.version, 'Campaign and result ledger versions differ')
check(Array.isArray(results.records), 'Promotion results must contain a records array')

for (const channel of channels) {
  if (!channel || typeof channel !== 'object' || Array.isArray(channel)) {
    failures.push('Campaign channels must contain objects')
    continue
  }
  check(channel.week >= 1 && channel.week <= 4, `Invalid week: ${channel.id}`)
  check(validPaths.has(channel.targetPath), `Invalid target path: ${channel.id}`)
  check(Boolean(channel.goal), `Missing channel goal: ${channel.id}`)
  check(validStatuses.has(channel.status), `Invalid campaign status: ${channel.campaignId}`)
  check(!publishedStatuses.has(channel.status) || Boolean(channel.originalUrl), `Published, completed, or paused campaign lacks original URL: ${channel.campaignId}`)
  check(!publishedStatuses.has(channel.status) || Boolean(channel.publishedAt), `Published, completed, or paused campaign lacks publish time: ${channel.campaignId}`)
  const url = new URL(channel.targetPath, config.site)
  url.searchParams.set('utm_source', channel.id)
  url.searchParams.set('utm_medium', channel.medium)
  url.searchParams.set('utm_campaign', config.campaign)
  url.searchParams.set('utm_content', channel.content)
  check(url.searchParams.size === 4, `Incomplete UTM link: ${channel.id}`)
}

for (const record of records) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    failures.push('Promotion records must contain objects')
    continue
  }
  check(campaignIds.includes(record.campaignId), `Result references unknown campaign: ${record.campaignId}`)
  check(validWindows.has(record.window), `Invalid result window: ${record.campaignId}`)
  check(validDecisions.has(record.decision), `Invalid result decision: ${record.campaignId}`)
  const metrics = record.metrics && typeof record.metrics === 'object' && !Array.isArray(record.metrics) ? record.metrics : null
  check(Boolean(metrics), `Result metrics must be an object: ${record.campaignId}`)
  if (!metrics) continue
  for (const key of ['impressions', 'landings', 'lesson_starts', 'lesson_engaged', 'lesson_completed', 'shares', 'actionable_feedback']) {
    check(metrics[key] === null || (Number.isInteger(metrics[key]) && metrics[key] >= 0), `Invalid ${key}: ${record.campaignId}`)
  }
  if (metrics.landings !== null && metrics.lesson_starts !== null) {
    check(metrics.lesson_starts <= metrics.landings, `Starts exceed landings: ${record.campaignId}`)
  }
  if (metrics.lesson_starts !== null && metrics.lesson_engaged !== null) {
    check(metrics.lesson_engaged <= metrics.lesson_starts, `Engaged exceeds starts: ${record.campaignId}`)
  }
  if (metrics.lesson_engaged !== null && metrics.lesson_completed !== null) {
    check(metrics.lesson_completed <= metrics.lesson_engaged, `Completions exceed engaged: ${record.campaignId}`)
  }
}

console.log(JSON.stringify({ version: config.version, channels: ids, campaigns: campaignIds, published: channels.filter(channel => publishedStatuses.has(channel.status)).length, result_records: records.length, weeks: [...new Set(channels.map(channel => channel.week))], failures }, null, 2))
if (failures.length) process.exit(1)
