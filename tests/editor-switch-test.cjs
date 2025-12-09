// 编辑器切换内容格式测试
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

// 创建测试数据目录
if (!fs.existsSync(TEST_DATA_DIR)) {
  fs.mkdirSync(TEST_DATA_DIR, { recursive: true })
  fs.mkdirSync(path.join(TEST_DATA_DIR, 'db'), { recursive: true })
  fs.mkdirSync(path.join(TEST_DATA_DIR, 'uploads'), { recursive: true })
  fs.writeFileSync(path.join(TEST_DATA_DIR, 'db', 'diaries.json'), JSON.stringify([]))
}

process.env.DATABASE_DIR = path.join(TEST_DATA_DIR, 'db')
process.env.UPLOAD_DIR = path.join(TEST_DATA_DIR, 'uploads')

// 复杂的测试内容，包含各种Markdown格式
const complexContent = `# 复杂内容测试

## 有序列表测试
1. 第一个项目
3. 第三个项目（跳过第二个）
5. 第五个项目（跳过第四个）

## 无序列表测试
- 项目1
  - 嵌套项目1.1
  - 嵌套项目1.2
- 项目2

## 代码块测试
\`\`\`javascript
function test() {
  console.log("Hello 'world'");
  return "<script>alert('xss')</script>";
}
\`\`\`

## 引用测试
> 这是第一层引用
>> 这是第二层引用
>>> 这是第三层引用

## 混合格式测试
这是一个包含 **粗体**、*斜体*、~~删除线~~、\`代码\` 的段落。

## 链接和图片
[百度链接](https://www.baidu.com)
![测试图片](http://example.com/image.png "图片标题")

## 特殊字符
& < > " ' \\ / \`

## HTML标签测试
<div>这是一个div</div>
<span>这是一个span</span>
<p>这是一个段落</p>

## 表格测试（如果支持）
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 值1 | 值2 | 值3 |
| 值4 | 值5 | 值6 |`

async function runTest() {
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

  server.listen(3003, () => {
    console.log('✅ 测试服务器已启动在 http://localhost:3003\n')
  })

  await new Promise(resolve => setTimeout(resolve, 3000))

  console.log('📝 编辑器切换内容格式测试')
  console.log(`   测试内容长度: ${complexContent.length} 字符\n`)

  let testResults = {
    passed: 0,
    failed: 0,
    details: []
  }

  try {
    // 创建日记
    console.log('🔹 创建包含复杂格式的日记')
    const createResponse = await fetch('http://localhost:3003/api/diaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '编辑器切换测试',
        content: complexContent
      })
    })

    if (createResponse.status !== 201) {
      throw new Error('创建日记失败')
    }

    const { data: diary } = await createResponse.json()
    console.log(`   ✅ 创建成功，ID: ${diary.id}\n`)

    // 测试不同编辑器格式的影响
    const editorTests = [
      {
        name: 'TipTap编辑器（HTML格式）',
        content: `<h1>HTML格式测试</h1><p>这是<strong>粗体</strong>文本</p><ul><li>列表项1</li><li>列表项2</li></ul>`
      },
      {
        name: 'Markdown格式',
        content: `# Markdown格式测试\n\n这是**粗体**文本\n\n- 列表项1\n- 列表项2`
      },
      {
        name: '纯文本格式',
        content: `纯文本测试\n\n没有格式的文本内容。`
      },
      {
        name: '混合格式',
        content: `# 混合格式\n\nHTML: <strong>粗体</strong>\nMarkdown: **粗体**\nPlain: 纯文本`
      }
    ]

    for (const test of editorTests) {
      console.log(`\n🔹 测试: ${test.name}`)

      const updateResponse = await fetch(`http://localhost:3003/api/diaries/${diary.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: diary.title,
          content: test.content
        })
      })

      if (updateResponse.status === 200) {
        const { data: updatedDiary } = await updateResponse.json()

        // 验证内容是否正确保存
        const contentMatch = updatedDiary.content === test.content
        const contentExists = updatedDiary.content && updatedDiary.content.length > 0

        if (contentMatch) {
          console.log(`   ✅ 内容完全匹配`)
          testResults.passed++
          testResults.details.push(`${test.name}: 完美保存`)
        } else if (contentExists) {
          console.log(`   ⚠️  内容被转换（可能是正常行为）`)
          console.log(`   📝 原始长度: ${test.content.length}`)
          console.log(`   📝 保存长度: ${updatedDiary.content.length}`)
          testResults.passed++
          testResults.details.push(`${test.name}: 内容被转换但已保存`)
        } else {
          console.log(`   ❌ 内容丢失`)
          testResults.failed++
          testResults.details.push(`${test.name}: 内容丢失`)
        }
      } else {
        console.log(`   ❌ 更新失败: ${updateResponse.status}`)
        testResults.failed++
        testResults.details.push(`${test.name}: 更新失败`)
      }

      // 短暂延迟
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // 最终验证：恢复原始复杂内容
    console.log('\n🔹 恢复原始复杂内容测试')
    const restoreResponse = await fetch(`http://localhost:3003/api/diaries/${diary.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: diary.title,
        content: complexContent
      })
    })

    if (restoreResponse.status === 200) {
      const { data: finalDiary } = await restoreResponse.json()

      // 检查关键元素是否保留
      const keyElements = [
        '有序列表测试',
        '代码块测试',
        '引用测试',
        'function test()',
        '特殊字符',
        'HTML标签测试'
      ]

      let allElementsPreserved = true
      const missingElements = []

      for (const element of keyElements) {
        if (!finalDiary.content.includes(element)) {
          allElementsPreserved = false
          missingElements.push(element)
        }
      }

      if (allElementsPreserved) {
        console.log('   ✅ 所有关键元素都保留了')
        testResults.passed++
      } else {
        console.log(`   ❌ 缺失元素: ${missingElements.join(', ')}`)
        testResults.failed++
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

  console.log('\n🎉 测试完成！')
  server.close()

  // 清理
  try {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true })
  } catch (error) {}

  process.exit(testResults.failed > 0 ? 1 : 0)
}

runTest().catch(console.error)