import { readFile } from 'node:fs/promises'
import { geoLessonIds } from '../src/geoContent.js'
import { homePath, lessonPath } from '../src/lessonRoutes.js'
import { SITE_URL } from '../src/seo.js'
import { INDEXNOW_ENDPOINT, INDEXNOW_HOST, INDEXNOW_KEY } from './indexnow-config.mjs'

const keyFile = new URL(`../public/${INDEXNOW_KEY}.txt`, import.meta.url)
const keyContents = (await readFile(keyFile, 'utf8')).trim()
const urlList = [
  ...['zh', 'en'].map(locale => `${SITE_URL}${homePath(locale)}`),
  ...geoLessonIds.flatMap(id => ['zh', 'en'].map(locale => `${SITE_URL}${lessonPath(id, locale)}`)),
]
const payload = {
  host: INDEXNOW_HOST,
  key: INDEXNOW_KEY,
  keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
  urlList,
}

const failures = []
if (keyContents !== INDEXNOW_KEY) failures.push('IndexNow key file does not match configured key')
if (new Set(urlList).size !== urlList.length) failures.push('IndexNow URL list contains duplicates')
if (!urlList.every(url => new URL(url).hostname === INDEXNOW_HOST)) failures.push('IndexNow URL belongs to another host')
if (urlList.length !== geoLessonIds.length * 2 + 2) failures.push(`Expected ${geoLessonIds.length * 2 + 2} URLs, found ${urlList.length}`)

if (failures.length) {
  console.error(JSON.stringify({ failures }, null, 2))
  process.exit(1)
}

if (!process.argv.includes('--submit')) {
  console.log(JSON.stringify({ mode: 'check', endpoint: INDEXNOW_ENDPOINT, keyLocation: payload.keyLocation, urls: urlList.length, failures }, null, 2))
  process.exit(0)
}

const response = await fetch(INDEXNOW_ENDPOINT, {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload),
})
const accepted = response.status === 200 || response.status === 202
console.log(JSON.stringify({ mode: 'submit', endpoint: INDEXNOW_ENDPOINT, status: response.status, accepted, urls: urlList.length }, null, 2))
if (!accepted) process.exit(1)
