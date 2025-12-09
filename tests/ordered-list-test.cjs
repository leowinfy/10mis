// 有序列表序号保持测试
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

// 测试用例
const testCases = [
  {
    name: '连续序号测试',
    content: `## 任务列表

1. 第一个任务
2. 第二个任务
3. 第三个任务

继续其他内容...

10. 第十个任务
11. 第十一个任务`
  },
  {
    name: '非连续序号测试',
    content: `## 跳号测试

1. 第一项
3. 第三项（跳过第二项）
5. 第五项（跳过第四项）`
  },
  {
    name: '大序号测试',
    content: `## 大序号测试

100. 第一百项
101. 第一百零一项
102. 第一百零二项`
  },
  {
    name: '混合内容测试',
    content: `## 混合内容

一些介绍文字...

1. 有序列表第一项
2. 有序列表第二项

更多内容...

10. 另一个有序列表
11. 继续列表

- 无序列表项
- 另一个无序列表项

20. 第三个有序列表`
  }
]

async function runOrderedListTest() {
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

  server.listen(3005, () => {
    console.log('✅ 测试服务器已启动在 http://localhost:3005\n')
  })

  await new Promise(resolve => setTimeout(resolve, 3000))

  console.log('📝 有序列表序号保持测试')
  console.log('   测试编辑器切换时序号是否会丢失\n')

  let testResults = {
    passed: 0,
    failed: 0,
    details: []
  }

  try {
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i]
      console.log(`\n🔹 测试案例 ${i + 1}: ${testCase.name}`)

      // 1. 创建包含有序列表的日记
      console.log('   步骤1: 创建日记')
      const createResponse = await fetch('http://localhost:3005/api/diaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `有序列表测试 - ${testCase.name}`,
          content: testCase.content
        })
      })

      if (createResponse.status !== 201) {
        throw new Error('创建日记失败')
      }

      const { data: diary } = await createResponse.json()
      console.log(`   ✅ 创建成功，ID: ${diary.id}`)

      // 提取原始序号
      const originalNumbers = extractOrderedListNumbers(testCase.content)
      console.log(`   📊 原始序号: [${originalNumbers.join(', ')}]`)

      // 2. 修改内容（模拟编辑）
      console.log('   步骤2: 修改内容')
      const modifiedContent = testCase.content + '\n\n## 添加的内容\n\n这是在切换编辑器前添加的新内容。'

      const updateResponse1 = await fetch(`http://localhost:3005/api/diaries/${diary.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: diary.title,
          content: modifiedContent
        })
      })

      if (updateResponse1.status !== 200) {
        console.log(`   ❌ 第一次更新失败`)
        testResults.failed++
        testResults.details.push(`${testCase.name}: 更新失败`)
        continue
      }

      console.log('   ✅ 内容修改成功')

      // 3. 获取当前内容
      const { data: updatedDiary } = await updateResponse1.json()

      // 4. 模拟切换到简易编辑器再切换回来
      console.log('   步骤3: 模拟编辑器切换')

      // 简易编辑器会返回Markdown格式
      const markdownContent = htmlToMarkdownForTest(updatedDiary.content)

      // TipTap编辑器接收Markdown并转换为HTML
      const htmlContent = markdownToHtmlForTest(markdownContent)

      // 保存模拟切换后的内容
      const updateResponse2 = await fetch(`http://localhost:3005/api/diaries/${diary.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: diary.title,
          content: htmlContent
        })
      })

      if (updateResponse2.status !== 200) {
        console.log(`   ❌ 模拟切换失败`)
        testResults.failed++
        testResults.details.push(`${testCase.name}: 模拟切换失败`)
        continue
      }

      const { data: finalDiary } = await updateResponse2.json()

      // 5. 验证序号是否保留
      console.log('   步骤4: 验证序号')
      const finalNumbers = extractOrderedListNumbers(finalDiary.content)
      console.log(`   📊 最终序号: [${finalNumbers.join(', ')}]`)

      // 检查序号是否一致
      const numbersMatch = JSON.stringify(originalNumbers) === JSON.stringify(finalNumbers)

      if (numbersMatch) {
        console.log('   ✅ 序号保持完整！')
        testResults.passed++
        testResults.details.push(`${testCase.name}: 成功 - 序号保持`)
      } else {
        console.log('   ❌ 序号丢失！')
        console.log(`      期望: [${originalNumbers.join(', ')}]`)
        console.log(`      实际: [${finalNumbers.join(', ')}]`)
        testResults.failed++
        testResults.details.push(`${testCase.name}: 失败 - 序号丢失`)
      }

      // 短暂延迟
      await new Promise(resolve => setTimeout(resolve, 200))
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
    console.log('\n🎉 所有有序列表序号都正确保留了！')
  } else {
    console.log('\n❌ 有序列表序号丢失问题需要进一步修复')
  }

  console.log('\n🎉 测试完成！')
  server.close()

  // 清理
  try {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true })
  } catch (error) {}

  process.exit(testResults.failed > 0 ? 1 : 0)
}

// 提取有序列表序号
function extractOrderedListNumbers(content) {
  const numbers = []
  const matches = content.match(/<ol[^>]*>\s*<li>/g) || []

  // 从start属性获取序号
  matches.forEach(match => {
    const startMatch = match.match(/start\s*=\s["']?(\d+)["']?/)
    if (startMatch) {
      numbers.push(parseInt(startMatch[1]))
    }
  })

  // 如果没有start属性，尝试从Markdown中提取
  if (numbers.length === 0) {
    const markdownMatches = content.match(/^\d+\./gm) || []
    markdownMatches.forEach(match => {
      const num = parseInt(match)
      if (!isNaN(num)) {
        numbers.push(num)
      }
    })
  }

  return numbers
}

// 简化的Markdown到HTML转换（用于测试）
function markdownToHtmlForTest(markdown) {
  if (!markdown) return ''

  let html = markdown

  // 处理有序列表
  const orderedListItems = html.match(/^\d+\. (.+)$/gm)
  if (orderedListItems && orderedListItems.length > 0) {
    // 获取第一个列表项的序号
    const firstItemMatch = orderedListItems[0].match(/^(\d+)\. /)
    const startIndex = firstItemMatch ? parseInt(firstItemMatch[1]) : 1

    const lis = orderedListItems.map(item => {
      const match = item.match(/^\d+\. (.+)$/)
      return match ? `<li>${match[1]}</li>` : ''
    }).join('')

    if (startIndex !== 1) {
      html = html.replace(/^\d+\. .+$/gm, `<ol start="${startIndex}">${lis}</ol>`)
    } else {
      html = html.replace(/^\d+\. .+$/gm, `<ol>${lis}</ol>`)
    }
  }

  return html
}

// 简化的HTML到Markdown转换（用于测试）
function htmlToMarkdownForTest(html) {
  if (!html) return ''

  let markdown = html

  // 处理有序列表
  const olMatches = markdown.match(/<ol[^>]*>([\s\S]*?)<\/ol>/g) || []
  let listIndex = 1

  olMatches.forEach(match => {
    const startMatch = match.match(/<ol[^>]*start\s*=\s["']?(\d+)["']?/)
    const startIndex = startMatch ? parseInt(startMatch[1]) : 1

    const liMatches = match.match(/<li>([\s\S]*?)<\/li>/g) || []
    liMatches.forEach((liMatch, index) => {
      const content = liMatch.replace(/<li>([\s\S]*?)<\/li>/, '$1')
        .replace(/<[^>]*>/g, '')
        .trim()
      markdown = markdown.replace(liMatch, `${startIndex + index}. ${content}`)
    })

    markdown = markdown.replace(/<ol[^>]*>|<\/ol>/g, '')
  })

  return markdown
}

runOrderedListTest().catch(console.error)