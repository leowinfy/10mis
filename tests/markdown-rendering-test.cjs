// Markdown 渲染测试
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

// 包含各种 Markdown 元素的测试内容
const complexMarkdown = `# 测试 Markdown 渲染

这是一个测试文档，验证各种 Markdown 元素是否正确渲染。

## 文本格式

这是**粗体文本**和*斜体文本*，以及***粗斜体***。

~~删除线文本~~

## 有序列表

1. 第一项
5. 第五项（自定义序号）
10. 第十项（大序号）

## 无序列表

- 项目 1
- 项目 2
  - 子项目 2.1
  - 子项目 2.2
- 项目 3

## 任务列表

- [x] 已完成的任务
- [ ] 未完成的任务

## 引用

> 这是一段引用文本
> 可以有多行
>> 嵌套引用

## 代码

### 行内代码
这是一个 \`inline code\` 示例。

### 代码块

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return \`Welcome, \${name}\`;
}

// 调用函数
greet("World");
\`\`\`

\`\`\`python
def hello_world():
    print("Hello, World!")
    return "Hello, World!"

# 调用函数
result = hello_world()
\`\`\`

## 链接和图片

[GitHub](https://github.com)

![示例图片](https://via.placeholder.com/600x400/4A90E2/FFFFFF?text=Sample+Image)

## 表格

| 功能 | 支持情况 | 备注 |
|------|---------|------|
| 标题 | ✅ | 支持 H1-H6 |
| 列表 | ✅ 有序和无序 | 支持自定义序号 |
| 代码 | ✅ 行内和块级 | 支持语法高亮 |
| 表格 | ✅ 完整支持 | 对齐、合并等 |
| 图片 | ✅ | 支持链接和描述 |

## 分割线

上面是分割线

---

下面是分割线

## 混合内容

你可以**粗体**和*斜体*混用，也可以 \`代码\` 和 **粗体** 混用。

- 列表中也可以有**粗体**
- 还可以有 \`代码块\`

  \`\`\`javascript
  // 列表中的代码
  const list = ["item1", "item2"];
  \`\`\`

测试完成！`

async function runMarkdownRenderingTest() {
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

  server.listen(3008, () => {
    console.log('✅ 测试服务器已启动在 http://localhost:3008\n')
  })

  await new Promise(resolve => setTimeout(resolve, 3000))

  console.log('📝 Markdown 渲染测试')
  console.log('   测试日记详情页是否正确渲染各种 Markdown 元素\n')

  let testResults = {
    passed: 0,
    failed: 0,
    details: []
  }

  try {
    // 1. 创建包含复杂 Markdown 的日记
    console.log('🔹 第1步：创建包含复杂 Markdown 的日记')
    const createResponse = await fetch('http://localhost:3008/api/diaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Markdown渲染测试',
        content: complexMarkdown
      })
    })

    if (createResponse.status !== 201) {
      throw new Error('创建日记失败')
    }

    const { data: diary } = await createResponse.json()
    console.log(`   ✅ 创建成功，ID: ${diary.id}`)

    // 2. 访问日记详情页
    console.log('\n🔹 第2步：访问日记详情页')
    const pageResponse = await fetch(`http://localhost:3008/diary/${diary.id}`)
    if (pageResponse.status === 200) {
      console.log('   ✅ 日记详情页加载成功')
      testResults.passed++
    } else {
      console.log('   ❌ 日记详情页加载失败')
      testResults.failed++
    }

    // 3. 验证关键 Markdown 元素是否被正确保存
    console.log('\n🔹 第3步：验证 Markdown 内容保存')
    const getResponse = await fetch(`http://localhost:3008/api/diaries/${diary.id}`)
    const { data: savedDiary } = await getResponse.json()

    // 检查各种 Markdown 元素
    const markdownElements = [
      { name: '标题', pattern: /^# 测试 Markdown 渲染/m },
      { name: '粗体', pattern: /\*\*粗体文本\*\*/ },
      { name: '斜体', pattern: /\*斜体文本\*/ },
      { name: '自定义有序列表', pattern: /^5\. 第五项（自定义序号）/m },
      { name: '任务列表', pattern: /- \[x\] 已完成的任务/ },
      { name: '引用', pattern: /^> 这是一段引用文本/m },
      { name: '代码块', pattern: /```javascript/ },
      { name: '表格', pattern: /^\| 功能 \| 支持情况 \| 备注 \|/m },
      { name: '分割线', pattern: /^---$/m },
      { name: '图片链接', pattern: /!\[示例图片\]/ }
    ]

    console.log('   📊 检查 Markdown 元素:')
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
      testResults.details.push('Markdown元素保存: 成功')
    } else {
      console.log('   ⚠️  部分 Markdown 元素丢失')
      testResults.failed++
      testResults.details.push('Markdown元素保存: 失败')
    }

    // 4. 测试内容编辑和重新渲染
    console.log('\n🔹 第4步：测试内容编辑和重新渲染')
    const modifiedContent = complexMarkdown + '\n\n**编辑后添加的内容**：这是在编辑器中添加的新内容。'

    const updateResponse = await fetch(`http://localhost:3008/api/diaries/${diary.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: diary.title,
        content: modifiedContent
      })
    })

    if (updateResponse.status === 200) {
      console.log('   ✅ 内容更新成功')

      // 再次访问详情页测试
      const updatedPageResponse = await fetch(`http://localhost:3008/diary/${diary.id}`)
      if (updatedPageResponse.status === 200) {
        console.log('   ✅ 更新后的详情页加载成功')
        testResults.passed++
      } else {
        console.log('   ❌ 更新后的详情页加载失败')
        testResults.failed++
      }
    } else {
      console.log('   ❌ 内容更新失败')
      testResults.failed++
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
    console.log('\n🎉 Markdown 渲染测试全部通过！')
    console.log('\n💡 确认事项：')
    console.log('   1. 请手动访问日记详情页确认渲染效果')
    console.log('   2. 检查图片是否正确显示')
    console.log('   3. 检查表格是否正确渲染')
    console.log('   4. 检查代码块是否有语法高亮')
    console.log('   5. 检查有序列表序号是否正确显示')
  } else {
    console.log('\n❌ 部分测试未通过')
  }

  console.log('\n🎉 测试完成！')
  console.log(`\n📖 访问 http://localhost:3008/diary/${diary?.id || '1'} 查看渲染效果`)

  server.close()

  // 清理
  try {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true })
  } catch (error) {}
}

runMarkdownRenderingTest().catch(console.error)