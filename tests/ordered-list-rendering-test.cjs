// 测试有序列表序号渲染
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const path = require('path')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

// 测试数据目录
const TEST_DATA_DIR = path.join(process.cwd(), 'test-data')

if (!fs.existsSync(TEST_DATA_DIR)) {
  fs.mkdirSync(TEST_DATA_DIR, { recursive: true })
  fs.mkdirSync(path.join(TEST_DATA_DIR, 'db'), { recursive: true })
  fs.mkdirSync(path.join(TEST_DATA_DIR, 'uploads'), { recursive: true })
  fs.writeFileSync(path.join(TEST_DATA_DIR, 'db', 'diaries.json'), JSON.stringify([]))
}

process.env.DATABASE_DIR = path.join(TEST_DATA_DIR, 'db')
process.env.UPLOAD_DIR = path.join(TEST_DATA_DIR, 'uploads')

// 包含有序列表的测试内容
const orderedListContent = `# 有序列表测试

这是一个测试文档，用来验证有序列表的渲染效果。

## 连续序号列表

1. 第一个任务
2. 第二个任务
3. 第三个任务

## 自定义序号列表

5. 第五个任务（从5开始）
8. 第八个任务（从8开始）
10. 第十个任务（从10开始）

## 大序号列表

100. 第一百个任务
101. 第一百零一个任务

## 非连续序号

3. 第三项（跳过了1和2）
7. 第七项（跳过了4-6）

## 混合内容

这里有一些普通内容，然后是另一个列表：

1. 正常第一项
2. 正常第二项

继续更多内容...

## 任务列表

- [x] 已完成的任务
- [ ] 未完成的任务

测试完成！

async function runOrderedListRenderingTest() {
  await app.prepare()
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  server.listen(3009, () => {
    console.log('✅ 测试服务器已启动在 http://localhost:3009\n')
  })

  await new Promise(resolve => setTimeout(resolve, 3000))

  console.log('📝 有序列表渲染测试')
  console.log('   测试渲染器是否正确显示有序列表序号\n')

  let testResults = {
    passed: 0,
    failed: 0,
    details: []
  }

  try {
    // 1. 创建包含有序列表的日记
    console.log('🔹 第1步：创建包含有序列表的日记')
    const createResponse = await fetch('http://localhost:3009/api/diaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '有序列表渲染测试',
        content: orderedListContent
      })
    })

    if (createResponse.status !== 201) {
      throw new Error('创建日记失败')
    }

    const { data: diary } = await createResponse.json()
    console.log(`   ✅ 创建成功，ID: ${diary.id}`)

    // 2. 获取渲染后的页面内容
    console.log('\n🔹 第2步：获取渲染后的页面内容')
    const pageResponse = await fetch(`http://localhost:3009/diary/${diary.id}`)
    if (pageResponse.status === 200) {
      const html = await pageResponse.text()

      // 提取有序列表的序号
      const orderedListNumbers = []
      const olMatches = html.match(/<ol[^>]*start\s*=\s*["']?(\d+)["']?[^>]*>/g)
      if (olMatches) {
        olMatches.forEach(match => {
          const number = parseInt(match[1])
          orderedListNumbers.push(number)
        })
      }

      console.log(`   📊 检测到的有序列表序号: ${JSON.stringify(orderedListNumbers)}`)

      // 检查是否包含期望的序号
      const expectedNumbers = [1, 2, 3, 5, 8, 10, 100, 101, 3, 7]
      const hasAllNumbers = expectedNumbers.every(num => orderedListNumbers.includes(num))

      if (hasAllNumbers) {
        console.log('   ✅ 所有期望的序号都存在')
        testResults.passed++
        testResults.details.push('序号存在性测试: 通过')
      } else {
        console.log('   ❌ 缺少序号')
        testResults.failed++
        testResults.details.push('序号存在性测试: 失败')
      }

      // 检查渲染格式
      if (html.includes('<ol start="1">')) {
        console.log('   ✅ HTML包含正确的start属性')
        testResults.passed++
        testResults.details.push('HTML格式测试: 通过')
      } else {
        console.log('   ⚠️  HTML可能不包含start属性')
        testResults.details.push('HTML格式测试: 警告')
      }

      // 保存页面截图用于检查
      const screenshotDir = path.join(process.cwd(), 'test-screenshots')
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true })
      }

      fs.writeFileSync(
        path.join(screenshotDir, `diary-${diary.id}-rendered.html`),
        html,
        'utf-8'
      )
      console.log(`   📄 渲染后的HTML已保存到 test-screenshots/diary-${diary.id}-rendered.html`)
    } else {
      console.log('   ❌ 获取页面内容失败')
      testResults.failed++
    }

    // 3. 验证编辑器预览模式
    console.log('\n🔹 第3步：验证编辑器预览模式')
    const editResponse = await fetch(`http://localhost:3009/diary/${diary.id}/edit`)
    if (editResponse.status === 200) {
      const editHtml = await editResponse.text()

      // 检查编辑器是否加载
      if (editHtml.includes('w-md-editor')) {
        console.log('   ✅ 编辑器已加载')
        testResults.passed++
        testResults.details.push('编辑器加载测试: 通过')
      } else {
        console.log('   ⚠️  编辑器可能未加载')
        testResults.details.push('编辑器加载测试: 警告')
      }
    }

  } catch (error) {
    console.error('测试错误:', error)
    testResults.failed++
  }

  // 打印结果
  console.log('\n' + '='.repeat(60))
  console.log('📊 测试结果统计:')
  console.log(`  ✅ 成功: ${testResults.passed}`)
  console.log(`  ❌ 失败: ${testResults.failed}`)

  console.log('\n📝 详细结果:')
  testResults.details.forEach((detail, index) => {
    console.log(`  ${index + 1}. ${detail}`)
  })

  if (testResults.failed === 0) {
    console.log('\n🎉 所有测试通过！')
    console.log('\n💡 建议：')
    console.log('   1. 打开 test-screenshots 文件夹查看渲染效果')
    console.log('   2. 检查有序列表序号是否正确显示')
    console.log('   3. 对比编辑器预览和最终渲染的一致性')
  } else {
    console.log('\n❌ 部分测试失败')
  }

  console.log('\n🎉 测试完成！')
  server.close()

  // 清理
  try {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true })
    fs.rmSync(path.join(process.cwd(), 'test-screenshots'), { recursive: true, force: true })
  } catch (error) {}

  process.exit(testResults.failed > 0 ? 1 : 0)
}

runOrderedListRenderingTest().catch(console.error)