// 测试 Quill 编辑器是否正常工作
const { chromium } = require('playwright')

async function testQuillEditor() {
  console.log('🚀 开始测试 Quill 编辑器...\n')

  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  try {
    // 访问新建日记页面
    await page.goto('http://localhost:3002/diary/new')
    await page.waitForLoadState('networkidle')

    console.log('✅ 页面加载成功')

    // 等待 Quill 编辑器初始化
    await page.waitForSelector('.ql-editor', { timeout: 10000 })
    console.log('✅ Quill 编辑器容器找到')

    // 检查编辑器是否显示了工具栏
    const toolbar = await page.$('.ql-toolbar')
    if (toolbar) {
      console.log('✅ Quill 工具栏已显示')
    } else {
      console.log('❌ Quill 工具栏未找到')
    }

    // 检查编辑器内容区域
    const editor = await page.$('.ql-editor')
    if (editor) {
      console.log('✅ Quill 编辑器内容区域已显示')

      // 检查是否还有"加载编辑器中"的文本
      const loadingText = await page.$eval('.ql-editor', el =>
        el.textContent?.includes('加载编辑器中') || false
      )

      if (loadingText) {
        console.log('❌ 编辑器仍显示"加载编辑器中"')
      } else {
        console.log('✅ 编辑器已正常初始化，没有加载提示')
      }
    } else {
      console.log('❌ Quill 编辑器内容区域未找到')
    }

    // 尝试输入一些内容
    await page.fill('.ql-editor', '这是测试内容')
    console.log('✅ 成功输入测试内容')

    // 等待一秒
    await page.waitForTimeout(1000)

    // 检查内容是否保持
    const content = await page.$eval('.ql-editor', el => el.textContent)
    if (content?.includes('这是测试内容')) {
      console.log('✅ 内容输入成功并保持')
    } else {
      console.log('❌ 内容未能保持')
    }

    // 测试有序列表功能
    await page.click('[title="有序列表"]')
    console.log('✅ 点击了有序列表按钮')

    // 在列表中输入内容
    await page.keyboard.type('第一项')
    await page.keyboard.press('Enter')
    await page.keyboard.type('第二项')
    console.log('✅ 输入了有序列表内容')

    // 检查 HTML 是否包含正确的 ol 标签
    const html = await page.$eval('.ql-editor', el => el.innerHTML)
    if (html.includes('<ol>')) {
      console.log('✅ 生成了正确的有序列表 HTML')
    } else {
      console.log('❌ 未生成有序列表 HTML')
    }

    console.log('\n🎉 Quill 编辑器测试完成！')

  } catch (error) {
    console.error('❌ 测试失败:', error.message)
  } finally {
    await browser.close()
  }
}

testQuillEditor()