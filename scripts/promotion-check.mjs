import { readFile } from 'node:fs/promises'
import { lessonRoutes } from '../src/lessonRoutes.js'

const config = JSON.parse(await readFile(new URL('../promotion/campaigns.json', import.meta.url), 'utf8'))
const failures = []
const check = (condition, message) => { if (!condition) failures.push(message) }
const validPaths = new Set(['/zh/', '/en/', ...lessonRoutes.flatMap(route => [`/zh/lesson/${route.slug}/`, `/en/lesson/${route.slug}/`])])
const ids = config.channels.map(channel => channel.id)
const contents = config.channels.map(channel => channel.content)

check(config.site === 'https://llmstudy.shddai.net', 'Unexpected promotion site URL')
check(config.campaign === 'organic_launch', 'Unexpected campaign name')
check(config.channels.length >= 6, 'Expected at least 6 organic channels')
check(new Set(ids).size === ids.length, 'Duplicate promotion channel')
check(new Set(contents).size === contents.length, 'Duplicate UTM content value')

for (const channel of config.channels) {
  check(channel.week >= 1 && channel.week <= 4, `Invalid week: ${channel.id}`)
  check(validPaths.has(channel.targetPath), `Invalid target path: ${channel.id}`)
  check(Boolean(channel.goal), `Missing channel goal: ${channel.id}`)
  const url = new URL(channel.targetPath, config.site)
  url.searchParams.set('utm_source', channel.id)
  url.searchParams.set('utm_medium', channel.medium)
  url.searchParams.set('utm_campaign', config.campaign)
  url.searchParams.set('utm_content', channel.content)
  check(url.searchParams.size === 4, `Incomplete UTM link: ${channel.id}`)
}

console.log(JSON.stringify({ version: config.version, channels: ids, weeks: [...new Set(config.channels.map(channel => channel.week))], failures }, null, 2))
if (failures.length) process.exit(1)
