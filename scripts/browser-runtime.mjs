import chromium from '@sparticuz/chromium'
import { chmodSync, createReadStream, createWriteStream, existsSync } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { createBrotliDecompress } from 'node:zlib'

const serverlessChromium = '/tmp/under-the-hood-chromium'
const macBrowsers = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
]

export async function browserLaunchOptions({ fileAccess = false, disableWebSecurity = false, dumpio = false } = {}) {
  const sharedArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
  ]
  if (fileAccess) sharedArgs.push('--allow-file-access-from-files')
  if (disableWebSecurity) sharedArgs.push('--disable-web-security')

  if (process.platform === 'darwin') {
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || macBrowsers.find(existsSync)
    if (!executablePath) throw new Error('No local Chrome or Chromium executable found. Set PUPPETEER_EXECUTABLE_PATH.')
    return { executablePath, headless: true, args: sharedArgs, dumpio }
  }

  if (!existsSync(serverlessChromium)) {
    await pipeline(
      createReadStream('node_modules/@sparticuz/chromium/bin/chromium.br'),
      createBrotliDecompress(),
      createWriteStream(serverlessChromium),
    )
    chmodSync(serverlessChromium, 0o700)
  }

  return {
    executablePath: serverlessChromium,
    headless: true,
    args: [...chromium.args, ...sharedArgs, '--single-process', '--no-zygote'],
    dumpio,
  }
}
