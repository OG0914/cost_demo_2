import { chromium, type Page } from '@playwright/test'
import { existsSync, mkdirSync, writeFileSync, rmSync, readdirSync } from 'fs'
import { join } from 'path'
import { PAGES } from './pages.config.js'

const OUTPUT_DIR = join(process.cwd(), 'demos')
const BASE_URL = process.env.DEMO_BASE_URL || 'http://localhost:5174'
const ADMIN_USER = process.env.DEMO_USER || 'admin'
const ADMIN_PASS = process.env.DEMO_PASS || 'admin123'

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
    return
  }
  // 只清理本次生成的子目录，不删除整个 demos/
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && /^\d{2}-/.test(entry.name)) {
      rmSync(join(dir, entry.name), { recursive: true, force: true })
    }
  }
}

async function waitForPageReady(page: Page, selectors: string[]) {
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 })
    } catch {
      console.warn(`⚠️ 页面元素未出现: ${selector}`)
    }
  }
}

async function checkServerReady() {
  try {
    const res = await fetch(`${BASE_URL}/login`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  } catch (err) {
    console.error(`❌ 无法访问 ${BASE_URL}，请先启动项目: pnpm dev`)
    process.exit(1)
  }
}

async function captureZoomFrames(page: Page, selector: string, pageDir: string, prefix: string) {
  const element = page.locator(selector).first()
  const count = await element.count()
  if (count === 0) {
    console.warn(`⚠️ 未找到元素 ${selector}，跳过局部截图`)
    return
  }
  await element.scrollIntoViewIfNeeded()
  const scales = [1, 1.15, 1.3, 1.15, 1]
  for (let i = 0; i < scales.length; i++) {
    const scale = scales[i]
    await element.evaluate((el, s) => {
      ;(el as HTMLElement).style.transform = `scale(${s})`
      ;(el as HTMLElement).style.transformOrigin = 'center center'
      ;(el as HTMLElement).style.transition = 'transform 0.3s ease'
    }, scale)
    await page.waitForTimeout(350)
    await element.screenshot({ path: join(pageDir, `${prefix}-zoom-${i}-${scale}x.png`) })
  }
  await element.evaluate((el) => {
    ;(el as HTMLElement).style.transform = ''
    ;(el as HTMLElement).style.transformOrigin = ''
    ;(el as HTMLElement).style.transition = ''
  })
}

async function generateDemo() {
  await checkServerReady()
  ensureDir(OUTPUT_DIR)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
  const page = await context.newPage()

  try {
    // 登录
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
    await page.fill('#username', ADMIN_USER)
    await page.fill('#password', ADMIN_PASS)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/`, { timeout: 10000 })

    const storyboard: any[] = []

    for (const demoPage of PAGES) {
      const pageDir = join(OUTPUT_DIR, demoPage.id)
      mkdirSync(pageDir, { recursive: true })

      await page.goto(`${BASE_URL}${demoPage.path}`, { waitUntil: 'networkidle' })
      await waitForPageReady(page, demoPage.highlights)
      await page.waitForTimeout(1000)

      // 全页截图
      const fullPath = join(pageDir, 'full.png')
      await page.screenshot({ path: fullPath, fullPage: true })

      // 局部放大截图
      for (let hi = 0; hi < demoPage.highlights.length; hi++) {
        await captureZoomFrames(page, demoPage.highlights[hi], pageDir, `highlight-${hi}`)
      }

      // 生成旁白文件
      writeFileSync(
        join(pageDir, 'narration.md'),
        `# ${demoPage.name}\n\n${demoPage.narration}\n\n**重点元素**: ${demoPage.highlights.join(', ') || '无'}\n`
      )

      storyboard.push({
        id: demoPage.id,
        name: demoPage.name,
        path: demoPage.path,
        narration: demoPage.narration,
        shots: [
          { type: 'full', file: `${demoPage.id}/full.png`, duration: 4 },
          ...demoPage.highlights.map((_, i) => ({
            type: 'zoom',
            file: `${demoPage.id}/highlight-${i}-zoom-2-1.3x.png`,
            duration: 5
          }))
        ]
      })

      console.log(`✅ ${demoPage.name} 已生成`)
    }

    // 写入总时间轴
    writeFileSync(join(OUTPUT_DIR, 'storyboard.json'), JSON.stringify(storyboard, null, 2))
    writeFileSync(
      join(OUTPUT_DIR, 'script.md'),
      storyboard.map((s) => `## ${s.name}\n\n${s.narration}\n`).join('\n---\n\n')
    )

    console.log(`\n🎬 素材包已生成: ${OUTPUT_DIR}`)
    console.log('下一步: 用剪映/CapCut 导入 demos/ 下的图片，按 storyboard.json 的时间轴剪辑。')
  } finally {
    await browser.close()
  }
}

generateDemo().catch((err) => {
  console.error(err)
  process.exit(1)
})
