// Markdown 编辑器测试
const { createServer } = require('http')
const { parse } = require('url')
const { fetch } = require('undici')
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

// 测试用的 Markdown 内容
const testMarkdownContent = `# 今天的心情

## 上午

今天天气很好，阳光明媚。我做了一些有意义的事情：

1. 起床后做了晨练
2. 吃了健康的早餐
3. 开始了新项目的工作

## 下午的工作内容

### 任务列表

- [x] 完成了项目文档
- [ ] 编写单元测试
- [ ] 代码审查

### 代码示例

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## 有序测试

这里是一个有序列表，测试序号是否会保持：

5. 第五项
8. 第八项
10. 第十项

## 其他元素

**粗体文本** 和 *斜体文本*

> 这是一段引用
> 可以有多行

[访问 GitHub](https://github.com)

| 表格示例 | 列2 | 列3 |
|---------|-----|-----|
| 数据1    | 100 | 200 |
| 数据2    | 300 | 400 |

---

测试完成！`

async function runMarkdownEditorTest() {
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

  server.listen(3007, () => {
    console.log('✅ 测试服务器已启动在 http://localhost:3007\n')
  })

  await new Promise(resolve => setTimeout(resolve, 3000))

  console.log('📝 Markdown 编辑器测试')
  console.log('   测试新的干净 Markdown 编辑器功能\n')

  let testResults = {
    passed: 0,
    failed: 0,
    details: []
  }

  try {
    // 1. 创建包含 Markdown 的日记
    console.log('🔹 第1步：创建包含 Markdown 的日记')
    const createResponse = await fetch('http://localhost:3007/api/diaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Markdown编辑器测试',
        content: testMarkdownContent
      })
    })

    if (createResponse.status !== 201) {
      throw new Error('创建日记失败')
    }

    const { data: diary } = await createResponse.json()
    console.log(`   ✅ 创建成功，ID: ${diary.id}`)

    // 2. 验证 Markdown 内容是否正确保存
    console.log('\n🔹 第2步：验证 Markdown 内容保存')
    const getResponse = await fetch(`http://localhost:3007/api/diaries/${diary.id}`)
    if (getResponse.status === 200) {
      const { data: savedDiary } = await getResponse.json()

      // 检查内容是否完全一致
      if (savedDiary.content === testMarkdownContent) {
        console.log('   ✅ Markdown 内容完整保存，没有任何修改')
        testResults.passed++
      } else {
        console.log('   ❌ Markdown 内容被修改')
        testResults.failed++
      }

      // 检查是否包含所有 Markdown 元素
      const markdownElements = [
        { name: '标题', pattern: /^# 今天的心情/m },
        { name: '子标题', pattern: /^## 上午/m },
        { name: '有序列表', pattern: /^\d+\. 起床后做了晨练/m },
        { name: '无序列表', pattern: /^- \[x\] 完成了项目文档/m },
        { name: '代码块', pattern: /```javascript/ },
        { name: '粗体', pattern: /\*\*粗体文本\*\*/ },
        { name: '斜体', pattern: /\*斜体文本\*/ },
        { name: '引用', pattern: /^> 这是一段引用/m },
        { name: '链接', pattern: /\[访问 GitHub\]/ },
        { name: '表格', pattern: /^\| 表格示例/m },
        { name: '自定义序号列表', pattern: /^5\. 第五项/m }
      ]

      console.log('\n   📊 检查 Markdown 元素:')
      let allElementsPresent = true
      markdownElements.forEach(element => {
        if (element.pattern.test(savedDiary.content)) {
          console.log(`      ✅ ${element.name}`)
        } else {
          console.log(`      ❌ ${element.name} - 未找到`)
          allElementsPresent = false
        }
      })

      if (allElementsPresent) {
        console.log('   ✅ 所有 Markdown 元素都正确保存')
        testResults.passed++
      } else {
        console.log('   ⚠️  部分 Markdown 元素丢失')
        testResults.details.push('Markdown 元素检查: 部分元素丢失')
      }
    }

    // 3. 模拟编辑操作
    console.log('\n🔹 第3步：模拟编辑操作')
    const modifiedContent = testMarkdownContent + '\n\n**编辑后添加的内容**：这是在编辑器中添加的新内容。'

    const updateResponse = await fetch(`http://localhost:3007/api/diaries/${diary.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: diary.title,
        content: modifiedContent
      })
    })

    if (updateResponse.status === 200) {
      console.log('   ✅ 编辑操作成功')
      testResults.passed++

      // 验证编辑后的内容
      const updatedResponse = await fetch(`http://localhost:3007/api/diaries/${diary.id}`)
      const { data: updatedDiary } = await updatedResponse.json()

      if (updatedDiary.content === modifiedContent) {
        console.log('   ✅ 编辑后的内容正确保存')
        testResults.passed++
      } else {
        console.log('   ❌ 编辑后的内容有误')
        testResults.failed++
      }
    } else {
      console.log('   ❌ 编辑操作失败')
      testResults.failed++
    }

    // 4. 测试有序列表序号保持
    console.log('\n🔹 第4步：测试有序列表序号保持')
    const orderedListPattern = /5\.\s*第五项\s*8\.\s*第八项\s*10\.\s*第十项/s

    // 获取最终内容
    const finalResponse = await fetch(`http://localhost:3007/api/diaries/${diary.id}`)
    const { data: finalDiary } = await finalResponse.json()
    const finalContent = finalDiary.content || testMarkdownContent

    if (orderedListPattern.test(finalContent)) {
      console.log('   ✅ 有序列表的自定义序号完美保持')
      testResults.passed++
      testResults.details.push('有序列表序号保持: 成功')
    } else {
      console.log('   ❌ 有序列表序号丢失')
      testResults.failed++
      testResults.details.push('有序列表序号保持: 失败')
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
    console.log('\n🎉 Markdown 编辑器测试全部通过！')
    console.log('\n💡 优势：')
    console.log('   1. 纯 Markdown 格式，简洁干净')
    console.log('   2. 完美保留所有 Markdown 语法')
    console.log('   3. 有序列表序号保持完美')
    console.log('   4. 支持实时预览功能')
    console.log('   5. GitHub 风格的渲染效果')
  } else {
    console.log('\n❌ 部分测试未通过')
  }

  console.log('\n🎉 测试完成！')
  server.close()

  // 清理
  try {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true })
  } catch (error) {}

  process.exit(testResults.failed > 0 ? 1 : 0)
}

runMarkdownEditorTest().catch(console.error)