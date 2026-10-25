// The model's eyes: opens the app at phone size and screenshots it.
// Usage: npm run -s eye -- <hash> <name> [selector-to-click ...]. Prints the screenshot path.
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, devices } from 'playwright'
import { createServer } from 'vite'

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const [hash = '#/', name = 'shot', ...clicks] = process.argv.slice(2)

const server = await createServer({ root: APP, logLevel: 'silent', server: { port: 0, strictPort: false } })
await server.listen()
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ ...devices['Pixel 7'] })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.stack ?? e.message))
  await page.goto(`${server.resolvedUrls!.local[0]}${hash}`)
  await page.waitForTimeout(800)
  for (const selector of clicks) {
    await page.click(selector)
    await page.waitForTimeout(500)
  }
  const dir = resolve(APP, 'screenshots')
  mkdirSync(dir, { recursive: true })
  const path = resolve(dir, `${name}.png`)
  await page.screenshot({ path, fullPage: true })
  console.log(JSON.stringify({ path, errors }))
} finally {
  await browser.close()
  await server.close()
}
