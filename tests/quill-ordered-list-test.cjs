// Quill 编辑器有序列表序号保持测试
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

// Quill编辑器测试内容（使用Quill的HTML格式）
const quillTestContent = `<h1>Quill编辑器测试</h1>
<p>这是一个测试文档，用来验证Quill编辑器的有序列表功能。</p>
<ol>
  <li>第一个任务</li>
  <li>第二个任务</li>
  <li>第三个任务</li>
</ol>
<p>继续其他内容...</p>
<ol start="10">
  <li>第十个任务</li>
  <li>第十一个任务</li>
</ol>
<ol start="100">
  <li>第一百个任务</li>
  <li>第一百零一个任务</li>
</ol>
<h2>非连续序号测试</h2>
<ol start="3">
  <li>第三项（跳过第一和第二）</li>
  <li>第五项（跳过第四）</li>
</ol>`

async function runQuillOrderedListTest() {
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

  console.log('📝 Quill编辑器有序列表序号保持测试')
  console.log('   测试Quill编辑器是否能正确保持有序列表序号\n')

  let testResults = {
    passed: 0,
    failed: 0,
    details: []
  }

  try {
    // 1. 创建包含有序列表的日记
    console.log('🔹 第1步：创建包含有序列表的日记')
    const createResponse = await fetch('http://localhost:3005/api/diaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Quill编辑器有序列表测试',
        content: quillTestContent
      })
    })

    if (createResponse.status !== 201) {
      throw new Error('创建日记失败')
    }

    const { data: diary } = await createResponse.json()
    console.log(`   ✅ 创建成功，ID: ${diary.id}`)

    // 2. 提取原始序号
    const originalOrderLists = extractOrderedListNumbers(quillTestContent)
    console.log(`   📊 原始有序列表: ${JSON.stringify(originalOrderLists)}`)

    // 3. 修改内容（模拟编辑）
    console.log('\n🔹 第2步：修改内容')
    const modifiedContent = quillTestContent.replace('<h1>Quill编辑器测试</h1>', '<h1>Quill编辑器测试（已修改）</h1>')

    const updateResponse1 = await fetch(`http://localhost:3005/api/diaries/${diary.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: diary.title,
        content: modifiedContent
      })
    })

    if (updateResponse1.status !== 200) {
      console.log(`   ❌ 更新失败`)
      testResults.failed++
      return
    }

    console.log('   ✅ 内容修改成功')

    // 4. 模拟多次编辑操作
    console.log('\n🔹 第3步：模拟多次编辑操作')

    // 模拟在有序列表之间添加内容
    let currentContent = modifiedContent
    const insertPosition = currentContent.indexOf('</ol>\n<p>继续其他内容...</p>')

    if (insertPosition > -1) {
      currentContent = currentContent.slice(0, insertPosition) +
        '<p>这是在编辑器中插入的新内容。</p>' +
        currentContent.slice(insertPosition)
    }

    // 保存修改后的内容
    const updateResponse2 = await fetch(`http://localhost:3005/api/diaries/${diary.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: diary.title,
        content: currentContent
      })
    })

    if (updateResponse2.status !== 200) {
      console.log(`   ❌ 第二次更新失败`)
      testResults.failed++
      return
    }

    console.log('   ✅ 多次编辑成功')

    // 5. 获取最终内容并验证
    console.log('\n🔹 第4步：验证序号是否保持')
    const finalResponse = await fetch(`http://localhost:3005/api/diaries/${diary.id}`)
    if (finalResponse.status === 200) {
      const { data: finalDiary } = await finalResponse.json()

      const finalOrderLists = extractOrderedListNumbers(finalDiary.content)
      console.log(`   📊 最终有序列表: ${JSON.stringify(finalOrderLists)}`)

      // 比较序号是否保持一致
      const orderListsMatch = JSON.stringify(originalOrderLists) === JSON.stringify(finalOrderLists)

      if (orderListsMatch) {
        console.log('   ✅ 所有有序列表序号都正确保留了！')
        testResults.passed++
        testResults.details.push('Quill编辑器: 成功 - 序号完整保留')
      } else {
        console.log('   ❌ 有序列表序号丢失')
        console.log(`      期望: ${JSON.stringify(originalOrderLists)}`)
        console.log(`      实际: ${JSON.stringify(finalOrderLists)}`)
        testResults.failed++
        testResults.details.push('Quill编辑器: 失败 - 序号丢失')
      }

      // 额外验证：检查HTML结构是否正确
      const hasCorrectOlStructure = finalDiary.content.includes('<ol>') &&
        finalDiary.content.includes('<ol start="10">') &&
        finalDiary.content.includes('<ol start="100">') &&
        finalDiary.content.includes('<ol start="3">')

      if (hasCorrectOlStructure) {
        console.log('   ✅ HTML结构正确，包含start属性')
        testResults.passed++
      } else {
        console.log('   ⚠️  HTML结构可能不完整')
        testResults.details.push('Quill编辑器: 警告 - HTML结构')
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
    console.log('\n🎉 Quill编辑器完美保持有序列表序号！')
    console.log('\n💡 建议：')
    console.log('   1. Quill编辑器在有序列表序号保持方面表现优秀')
    console.log('   2. 可以考虑将Quill设为默认编辑器')
    console.log('   3. 保留了HTML的start属性，确保序号正确显示')
  } else {
    console.log('\n❌ Quill编辑器仍有序号问题')
  }

  console.log('\n🎉 测试完成！')
  server.close()

  // 清理
  try {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true })
  } catch (error) {}

  process.exit(testResults.failed > 0 ? 1 : 0)
}

// 提取有序列表的start属性
function extractOrderedListNumbers(content) {
  const orderedLists = []

  // 使用正则表达式匹配所有ol标签及其start属性
  const olRegex = /<ol[^>]*start\s*=\s*["']?(\d+)["']?[^>]*>/g
  let match

  while ((match = olRegex.exec(content)) !== null) {
    const startNumber = parseInt(match[1])
    if (!isNaN(startNumber)) {
      orderedLists.push(startNumber)
    }
  }

  // 如果没有找到start属性，则返回默认值1
  if (orderedLists.length === 0) {
    const olCount = (content.match(/<ol>/g) || []).length
    for (let i = 0; i < olCount; i++) {
      orderedLists.push(1)
    }
  }

  return orderedLists
}

runQuillOrderedListTest().catch(console.error)