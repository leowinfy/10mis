// 编辑器内容持久性测试脚本
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

  // 初始化空的diaries.json
  fs.writeFileSync(path.join(TEST_DATA_DIR, 'db', 'diaries.json'), JSON.stringify([]))
}

// 设置环境变量
process.env.DATABASE_DIR = path.join(TEST_DATA_DIR, 'db')
process.env.UPLOAD_DIR = path.join(TEST_DATA_DIR, 'uploads')

// 您提供的测试内容
const testContent = `好的，星宏，这是基于你今日思考的三个方向建议：

## 1. **高效能升级建议：**
*   **专注堡垒：** 设立每日"专注熔断期"（如20分钟），当分心想去客厅时，先问自己："此刻出去是最佳选择吗？"。若非紧急，坐下完成熔断期再行动。
*   **环境赋能：** 将新整理的书桌/音乐区打造成"高效核心区"。明确在此区域只进行深度工作或滋养心灵的活动，强化环境暗示。
*   **团队协作优化：** 被"航教孩子"感动后，主动沟通家庭协作模式。如设定彼此"专注时段"并相互尊重，减少干扰，提升家庭整体效能。

## 2. **身心滋养及时雨：**
*   **捕捉感动，即时感恩：** 那份"莫名感动"是珍贵的情感滋养。立即（或当晚）向航简单表达（一句感谢、一个拥抱），强化积极情感联结，为自己"充电"。
*   **音乐即良药，定时"服用"：** 调试好的音响是疗愈工具。不仅收拾时听，每日设定短暂"音乐冥想"时间（如10分钟），专注呼吸和旋律，快速清理杂念，恢复平静。
*   **收拾节奏，见好就收：** "继续收拾吧"的热情很好，但留意身体信号。设定小目标，完成即停，避免疲惫。让收拾是滋养而非负担。

## 3. **生命哲学洞见：**
*   **"专注"即当下生命：** "静不下来"与"感动"的对比提醒：生命的质量在于专注投入的瞬间。培养专注力，是在拉长每一个当下的生命体验深度。
*   **共享成长是生命厚礼：** "队友"与"教孩子"的场景，揭示了生命的意义常在共享与传承中丰满。珍视并主动参与这些时刻，它们是抵御时间洪流的基石。
*   **秩序与美感抵御虚无：** 书桌、音响的整理，是对内心秩序和心灵美感的追求。维持生活环境的整洁与美感，是对抗混沌、滋养精神、赋予日常生命诗意的重要实践。

持久幸福常源于微小坚持。`

// 编辑器内容变体（模拟用户编辑）
const contentVariations = [
  testContent,
  testContent.replace(/星宏/g, '宏哥'),
  testContent.replace(/建议/g, '策略'),
  testContent + '\n\n## 补充说明\n\n这是一段新增的内容。',
  testContent.replace(/20分钟/g, '30分钟'),
  testContent + '\n\n### 今日总结\n\n今天学到了很多。'
]

// 测试配置
const TEST_CONFIG = {
  iterations: 5,  // 编辑次数
  editorTypes: ['tiptap', 'simple'],  // 编辑器类型
  delays: [100, 500, 1000]  // 不同的延迟时间（毫秒）
}

// 模拟编辑器切换和保存的函数
async function simulateEditorAndSave(diaryId, editorType, content) {
  console.log(`    📝 使用${editorType}编辑器保存内容...`)

  // 模拟编辑器的不同数据格式
  let updateData
  if (editorType === 'tiptap') {
    // TipTap编辑器可能返回HTML格式
    updateData = {
      title: '编辑器内容持久性测试',
      content: content,
      editor_type: 'tiptap'
    }
  } else {
    // 简易编辑器可能返回Markdown格式
    updateData = {
      title: '编辑器内容持久性测试',
      content: content,
      editor_type: 'simple'
    }
  }

  const response = await fetch(`http://localhost:3002/api/diaries/${diaryId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  })

  if (response.status !== 200) {
    throw new Error(`保存失败: ${response.status}`)
  }

  const data = await response.json()
  return data.data
}

// 验证内容完整性的函数
function validateContent(original, saved) {
  // 检查关键内容是否保留
  const keyPhrases = [
    '专注熔断期',
    '高效核心区',
    '音乐即良药',
    '生命哲学洞见',
    '秩序与美感'
  ]

  for (const phrase of keyPhrases) {
    if (!saved.includes(phrase)) {
      return {
        success: false,
        missing: phrase,
        originalLength: original.length,
        savedLength: saved.length
      }
    }
  }

  // 检查长度差异
  const lengthDiff = Math.abs(original.length - saved.length)
  if (lengthDiff > 50) {  // 允许一定的格式差异
    return {
      success: false,
      reason: '内容长度差异过大',
      lengthDiff
    }
  }

  return { success: true }
}

async function runEditorContentTest() {
  console.log('🚀 启动Next.js服务器进行编辑器内容持久性测试...\n')

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

  server.listen(3002, () => {
    console.log('✅ 测试服务器已启动在 http://localhost:3002\n')
  })

  // 等待服务器启动
  await new Promise(resolve => setTimeout(resolve, 3000))

  console.log('📝 编辑器内容持久性测试')
  console.log(`   测试内容长度: ${testContent.length} 字符`)
  console.log(`   编辑次数: ${TEST_CONFIG.iterations}`)
  console.log(`   编辑器切换: ${TEST_CONFIG.editorTypes.join(', ')}\n`)

  let testResults = {
    passed: 0,
    failed: 0,
    errors: []
  }

  try {
    // 1. 创建初始日记
    console.log('🔹 第1步：创建初始日记')
    const createResponse = await fetch('http://localhost:3002/api/diaries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: '编辑器内容持久性测试',
        content: testContent
      })
    })

    if (createResponse.status !== 201) {
      throw new Error('创建日记失败')
    }

    const createdDiary = await createResponse.json()
    const diaryId = createdDiary.data.id
    console.log(`   ✅ 创建成功，日记ID: ${diaryId}\n`)

    // 2. 多次编辑测试
    console.log('🔹 第2步：多次编辑测试')
    for (let i = 0; i < TEST_CONFIG.iterations; i++) {
      const editorType = TEST_CONFIG.editorTypes[i % TEST_CONFIG.editorTypes.length]
      const content = contentVariations[i % contentVariations.length]

      console.log(`\n   📝 编辑轮次 ${i + 1}/${TEST_CONFIG.iterations} (${editorType}编辑器)`)

      // 模拟用户操作延迟
      const delay = TEST_CONFIG.delays[i % TEST_CONFIG.delays.length]
      await new Promise(resolve => setTimeout(resolve, delay))

      // 保存内容
      try {
        const savedDiary = await simulateEditorAndSave(diaryId, editorType, content)

        // 验证内容
        const validation = validateContent(content, savedDiary.content)
        if (validation.success) {
          console.log(`   ✅ 保存成功，内容完整`)
          testResults.passed++
        } else {
          console.log(`   ❌ 保存失败: ${JSON.stringify(validation)}`)
          testResults.failed++
          testResults.errors.push(`轮次${i + 1}: ${JSON.stringify(validation)}`)
        }
      } catch (error) {
        console.log(`   ❌ 保存错误: ${error.message}`)
        testResults.failed++
        testResults.errors.push(`轮次${i + 1}: ${error.message}`)
      }
    }

    // 3. 最终验证
    console.log('\n🔹 第3步：最终验证')
    const finalResponse = await fetch(`http://localhost:3002/api/diaries/${diaryId}`)
    if (finalResponse.status === 200) {
      const finalDiary = await finalResponse.json()
      const finalValidation = validateContent(testContent, finalDiary.data.content)

      if (finalValidation.success) {
        console.log('   ✅ 最终内容验证通过')
        testResults.passed++
      } else {
        console.log(`   ❌ 最终内容验证失败: ${JSON.stringify(finalValidation)}`)
        testResults.failed++
      }
    }

    // 4. 读取完整数据验证
    console.log('\n🔹 第4步：读取数据库直接验证')
    try {
      const dbPath = path.join(TEST_DATA_DIR, 'db', 'diaries.json')
      const dbContent = fs.readFileSync(dbPath, 'utf-8')
      const diaries = JSON.parse(dbContent)

      if (diaries.length > 0) {
        const diary = diaries.find(d => d.id === diaryId)
        if (diary) {
          console.log(`   ✅ 数据库中找到日记，内容长度: ${diary.content.length}`)
          console.log(`   📝 更新时间: ${diary.updated_at}`)
          console.log(`   📝 创建时间: ${diary.created_at}`)
        } else {
          console.log('   ❌ 数据库中未找到日记')
          testResults.failed++
        }
      }
    } catch (error) {
      console.log(`   ❌ 读取数据库失败: ${error.message}`)
      testResults.failed++
    }

  } catch (error) {
    console.error('测试执行错误:', error)
    testResults.errors.push(error.message)
  }

  // 打印测试结果
  console.log('\n' + '='.repeat(60))
  console.log('📊 测试结果统计:')
  console.log(`  ✅ 成功: ${testResults.passed}`)
  console.log(`  ❌ 失败: ${testResults.failed}`)

  if (testResults.errors.length > 0) {
    console.log('\n⚠️ 发现的错误:')
    testResults.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`)
    })
  }

  if (testResults.failed === 0) {
    console.log('\n🎉 编辑器内容持久性测试全部通过！')
  } else {
    console.log('\n❌ 发现内容丢失问题，需要修复！')
  }

  console.log('\n🎉 测试完成！')
  server.close()

  // 清理测试数据
  try {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true })
  } catch (error) {
    // 忽略清理错误
  }

  process.exit(testResults.failed > 0 ? 1 : 0)
}

runEditorContentTest().catch(console.error)