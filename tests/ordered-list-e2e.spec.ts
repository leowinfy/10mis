import { test, expect } from '@playwright/test'

test.describe('有序列表渲染测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3003')
  })

  test('创建并验证有序列表渲染', async ({ page }) => {
    // 1. 创建新的日记
    await page.click('button:has-text("写日记")')

    // 2. 输入标题
    await page.fill('input[placeholder*="输入标题"]', '有序列表测试')

    // 3. 输入包含有序列表的内容
    const testContent = `# 有序列表测试

## 连续序号

1. 第一个任务
2. 第二个任务
3. 第三个任务

## 自定义序号

5. 从5开始
6. 第六个任务
10. 从10开始

## 大序号

100. 第100项
101. 第101项`

    // 找到编辑器的 textarea 并输入内容
    const editorTextarea = await page.locator('textarea').first()
    await editorTextarea.fill(testContent)

    // 4. 保存日记
    await page.click('button:has-text("保存")')

    // 等待保存完成并跳转到详情页
    await page.waitForURL(/\/diary\/\d+/)

    // 5. 验证有序列表渲染
    // 检查普通有序列表
    await expect(page.locator('ol')).toContainText('第一个任务')
    await expect(page.locator('ol')).toContainText('第二个任务')
    await expect(page.locator('ol')).toContainText('第三个任务')

    // 6. 验证自定义序号列表
    // 检查是否存在 start 属性
    const orderedListElements = await page.locator('ol[start]').count()
    console.log(`找到 ${orderedListElements} 个带有 start 属性的有序列表`)

    // 如果找到带 start 属性的列表，验证其值
    if (orderedListElements > 0) {
      const firstListWithStart = page.locator('ol[start]').first()
      const startValue = await firstListWithStart.getAttribute('start')
      console.log(`第一个有序列表的 start 值: ${startValue}`)

      // 验证列表项内容
      await expect(firstListWithStart.locator('li')).toContainText('从5开始')
    }

    // 7. 截图保存结果
    await page.screenshot({ path: 'test-results/ordered-list-rendered.png', fullPage: true })

    // 8. 获取页面 HTML 内容进行分析
    const contentHtml = await page.locator('.prose').innerHTML()
    console.log('渲染的 HTML:', contentHtml.substring(0, 1000))

    // 9. 验证特定文本是否存在
    await expect(page.locator('.prose')).toContainText('从5开始')
    await expect(page.locator('.prose')).toContainText('第100项')
    await expect(page.locator('.prose')).toContainText('第101项')
  })

  test('编辑模式下预览测试', async ({ page }) => {
    // 1. 创建日记
    await page.click('button:has-text("写日记")')
    await page.fill('input[placeholder*="输入标题"]', '预览测试')
    await page.fill('textarea', '5. 第五项\n6. 第六项')
    await page.click('button:has-text("保存")')
    await page.waitForURL(/\/diary\/\d+/)

    // 2. 点击编辑
    await page.click('button:has-text("编辑")')

    // 3. 等待编辑器加载
    await page.waitForSelector('.w-md-editor')

    // 4. 切换到预览模式
    await page.click('button:has-text("预览")')

    // 5. 验证预览模式下的渲染
    await expect(page.locator('.w-md-preview')).toContainText('第五项')
    await expect(page.locator('.w-md-preview')).toContainText('第六项')

    // 6. 截图
    await page.screenshot({ path: 'test-results/editor-preview.png', fullPage: true })
  })
})