// 编辑器切换内容丢失测试
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

// 初始内容
const initialContent = `# 初始内容

这是初始创建的内容。

## 第一部分
- 项目A
- 项目B

## 第二部分
这是第二部分的内容。`

// 编辑器切换测试序列
const editSequence = [
  {
    editor: 'tiptap',
    action: '在TipTap编辑器中添加新章节',
    modifyContent: (content) => {
      // 添加新章节
      return content + '\n\n## 第三部分（TipTap添加）\n\n这是在TipTap编辑器中添加的新内容。包含**粗体**和*斜体*文本。'
    }
  },
  {
    editor: 'simple',
    action: '切换到简易编辑器，在中间插入内容',
    modifyContent: (content) => {
      // 在第一部分和第二部分之间插入内容
      const parts = content.split('## 第二部分')
      if (parts.length === 2) {
        return parts[0] + '\n\n## 插入的内容（简易编辑器）\n\n这是在简易编辑器中插入的内容。\n\n' + '## 第二部分' + parts[1]
      }
      return content + '\n\n插入的内容'
    }
  },
  {
    editor: 'mdx',
    action: '切换到MDX编辑器，修改第一部分',
    modifyContent: (content) => {
      // 修改第一部分
      return content.replace(
        '## 第一部分\n- 项目A\n- 项目B',
        '## 第一部分（MDX修改）\n- 更新的项目A ✨\n- 更新的项目B 🔥\n- 新增的项目C 🚀'
      )
    }
  },
  {
    editor: 'tiptap',
    action: '再次切换到TipTap，添加代码块',
    modifyContent: (content) => {
      // 添加代码块
      return content + '\n\n## 代码示例（TipTap添加）\n\n```javascript\nfunction hello() {\n  console.log("Hello World!");\n}\n```\n\n> 这是一个重要的提示信息。'
    }
  },
  {
    editor: 'simple',
    action: '最后切换到简易编辑器，总结内容',
    modifyContent: (content) => {
      // 在末尾添加总结
      return content + '\n\n## 总结（简易编辑器）\n\n经过多次编辑和切换，内容应该完整保留。'
    }
  }
]

async function runContentLossTest() {
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

  server.listen(3004, () => {
    console.log('✅ 测试服务器已启动在 http://localhost:3004\n')
  })

  await new Promise(resolve => setTimeout(resolve, 3000))

  console.log('📝 编辑器切换内容丢失测试')
  console.log('   将模拟真实用户操作：先修改内容，再切换编辑器\n')

  let testResults = {
    passed: 0,
    failed: 0,
    details: [],
    contentHistory: []
  }

  try {
    // 1. 创建初始日记
    console.log('🔹 第1步：创建初始日记')
    const createResponse = await fetch('http://localhost:3004/api/diaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '编辑器切换内容丢失测试',
        content: initialContent
      })
    })

    if (createResponse.status !== 201) {
      throw new Error('创建日记失败')
    }

    const { data: diary } = await createResponse.json()
    console.log(`   ✅ 创建成功，ID: ${diary.id}`)
    testResults.contentHistory.push({
      step: '初始',
      content: initialContent,
      length: initialContent.length
    })

    // 2. 执行编辑序列
    let currentContent = initialContent

    for (let i = 0; i < editSequence.length; i++) {
      const test = editSequence[i]
      console.log(`\n🔹 第${i + 2}步：${test.action}`)
      console.log(`   当前编辑器：${test.editor}`)

      // 修改内容
      const modifiedContent = test.modifyContent(currentContent)

      // 保存修改后的内容
      const updateResponse = await fetch(`http://localhost:3004/api/diaries/${diary.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: diary.title,
          content: modifiedContent
        })
      })

      if (updateResponse.status === 200) {
        const { data: updatedDiary } = await updateResponse.json()

        // 验证内容是否正确保存
        const isContentCorrect = updatedDiary.content === modifiedContent
        const hasExpectedAdditions = checkExpectedContent(updatedDiary.content, test.editor)

        if (isContentCorrect) {
          console.log(`   ✅ 内容完全匹配修改内容`)
          testResults.passed++
          testResults.details.push(`${test.action}: 成功`)
        } else {
          console.log(`   ❌ 内容不匹配！`)
          console.log(`      期望长度: ${modifiedContent.length}`)
          console.log(`      实际长度: ${updatedDiary.content.length}`)

          // 显示差异
          const diff = findDifferences(modifiedContent, updatedDiary.content)
          if (diff) {
            console.log(`      差异: ${diff}`)
          }

          testResults.failed++
          testResults.details.push(`${test.action}: 失败 - 内容不匹配`)
        }

        // 更新当前内容
        currentContent = updatedDiary.content
        testResults.contentHistory.push({
          step: test.action,
          content: currentContent,
          length: currentContent.length
        })

        // 验证之前的内容是否保留
        if (i > 0) {
          const previousStepsPreserved = checkPreviousSteps(currentContent, editSequence.slice(0, i))
          if (previousStepsPreserved) {
            console.log(`   ✅ 之前的内容完整保留`)
          } else {
            console.log(`   ⚠️  警告：之前的部分内容可能丢失`)
          }
        }
      } else {
        console.log(`   ❌ 更新失败: ${updateResponse.status}`)
        testResults.failed++
        testResults.details.push(`${test.action}: 失败 - 更新失败`)
      }

      // 短暂延迟模拟真实操作
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // 3. 最终验证
    console.log('\n🔹 最终验证：检查所有添加的内容是否保留')
    const finalResponse = await fetch(`http://localhost:3004/api/diaries/${diary.id}`)
    if (finalResponse.status === 200) {
      const { data: finalDiary } = await finalResponse.json()

      // 检查所有编辑步骤的内容是否都在
      const allContentPreserved = checkAllContent(finalDiary.content, editSequence)

      if (allContentPreserved) {
        console.log('   ✅ 所有编辑内容都保留了！')
        testResults.passed++
      } else {
        console.log('   ❌ 部分内容丢失')
        testResults.failed++
      }

      // 显示最终内容统计
      console.log(`\n📊 最终内容统计：`)
      console.log(`   总长度: ${finalDiary.content.length} 字符`)
      console.log(`   标题数量: ${(finalDiary.content.match(/##/g) || []).length} 个`)
      console.log(`   列表项数量: ${(finalDiary.content.match(/^- /gm) || []).length} 个`)
      console.log(`   代码块数量: ${(finalDiary.content.match(/```/g) || []).length / 2} 个`)
    }

  } catch (error) {
    console.error('测试错误:', error)
    testResults.failed++
  }

  // 打印详细结果
  console.log('\n' + '='.repeat(60))
  console.log('📊 测试结果统计:')
  console.log(`  ✅ 成功: ${testResults.passed}`)
  console.log(`  ❌ 失败: ${testResults.failed}`)

  console.log('\n📝 详细结果:')
  testResults.details.forEach((detail, index) => {
    console.log(`  ${index + 1}. ${detail}`)
  })

  console.log('\n📈 内容变化历史:')
  testResults.contentHistory.forEach((history, index) => {
    console.log(`  ${index}. ${history.step}: ${history.length} 字符`)
  })

  console.log('\n🎉 测试完成！')
  server.close()

  // 清理
  try {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true })
  } catch (error) {}

  process.exit(testResults.failed > 0 ? 1 : 0)
}

// 检查期望的内容是否存在
function checkExpectedContent(content, editorType) {
  switch(editorType) {
    case 'tiptap':
      return content.includes('**粗体**') || content.includes('*斜体*') || content.includes('```javascript')
    case 'simple':
      return content.includes('插入的内容') || content.includes('总结（简易编辑器）')
    case 'mdx':
      return content.includes('✨') || content.includes('🔥') || content.includes('🚀')
    default:
      return true
  }
}

// 检查之前步骤的内容是否保留
function checkPreviousSteps(content, previousTests) {
  for (const test of previousTests) {
    // 简单检查：确保每个测试步骤的关键词还在
    if (test.editor === 'tiptap' && !content.includes('**粗体**')) return false
    if (test.editor === 'simple' && !content.includes('插入的内容')) return false
    if (test.editor === 'mdx' && !content.includes('✨')) return false
  }
  return true
}

// 检查所有内容是否保留
function checkAllContent(content, tests) {
  const mustHaveElements = [
    '初始内容',
    '第一部分',
    '第二部分',
    '第三部分（TipTap添加）',
    '插入的内容（简易编辑器）',
    '代码示例（TipTap添加）',
    '总结（简易编辑器）'
  ]

  return mustHaveElements.every(element => content.includes(element))
}

// 查找内容差异
function findDifferences(expected, actual) {
  if (expected.length !== actual.length) {
    return `长度差异 ${Math.abs(expected.length - actual.length)} 字符`
  }

  // 简单的行比较
  const expectedLines = expected.split('\n')
  const actualLines = actual.split('\n')

  if (expectedLines.length !== actualLines.length) {
    return `行数差异 ${Math.abs(expectedLines.length - actualLines.length)} 行`
  }

  for (let i = 0; i < expectedLines.length; i++) {
    if (expectedLines[i] !== actualLines[i]) {
      return `第${i + 1}行不同`
    }
  }

  return null
}

runContentLossTest().catch(console.error)