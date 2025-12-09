// 综合测试脚本 - 发现潜在的BUG
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

// 测试用例
const testSuites = [
  {
    name: '基础API功能测试',
    tests: [
      {
        name: '健康检查',
        method: 'GET',
        path: '/api/health',
        expectedStatus: 200
      },
      {
        name: '创建正常日记',
        method: 'POST',
        path: '/api/diaries',
        body: {
          title: '测试日记',
          content: '# 测试内容\n\n这是测试内容。'
        },
        expectedStatus: 201
      }
    ]
  },
  {
    name: '边界值测试',
    tests: [
      {
        name: '空标题',
        method: 'POST',
        path: '/api/diaries',
        body: { title: '', content: '内容' },
        expectedStatus: 400
      },
      {
        name: '超长标题（101字符）',
        method: 'POST',
        path: '/api/diaries',
        body: {
          title: 'a'.repeat(101),
          content: '内容'
        },
        expectedStatus: 400
      },
      {
        name: '最大长度标题（100字符）',
        method: 'POST',
        path: '/api/diaries',
        body: {
          title: 'a'.repeat(100),
          content: '内容'
        },
        expectedStatus: 201
      },
      {
        name: '空内容',
        method: 'POST',
        path: '/api/diaries',
        body: { title: '标题', content: '' },
        expectedStatus: 400
      }
    ]
  },
  {
    name: 'XSS安全测试',
    tests: [
      {
        name: '脚本注入',
        method: 'POST',
        path: '/api/diaries',
        body: {
          title: '<script>alert("XSS")</script>',
          content: '内容包含 <img src="x" onerror="alert(1)">'
        },
        expectedStatus: 201,
        checkSanitization: true
      },
      {
        name: 'HTML标签',
        method: 'POST',
        path: '/api/diaries',
        body: {
          title: '包含<b>粗体</b>的标题',
          content: '包含<a href="javascript:alert(1)">链接</a>'
        },
        expectedStatus: 201,
        checkSanitization: true
      }
    ]
  },
  {
    name: '特殊字符测试',
    tests: [
      {
        name: 'Unicode字符',
        method: 'POST',
        path: '/api/diaries',
        body: {
          title: '测试 🚀 emoji 和 中文',
          content: 'English, العربية, русский, 日本語'
        },
        expectedStatus: 201
      },
      {
        name: '特殊符号',
        method: 'POST',
        path: '/api/diaries',
        body: {
          title: '!@#$%^&*()_+-=[]{}|;:,.<>?',
          content: '"引号" 和 \'单引号\' 测试'
        },
        expectedStatus: 201
      }
    ]
  },
  {
    name: '数据完整性测试',
    tests: [
      {
        name: '更新存在的日记',
        method: 'PUT',
        path: '/api/diaries/1',
        body: { title: '更新后的标题' },
        setup: async () => {
          // 先创建日记
          await fetch('http://localhost:3001/api/diaries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: '原始标题',
              content: '原始内容'
            })
          })
        },
        expectedStatus: 200
      },
      {
        name: '更新不存在的日记',
        method: 'PUT',
        path: '/api/diaries/999',
        body: { title: '更新' },
        expectedStatus: 404
      },
      {
        name: '获取存在的日记',
        method: 'GET',
        path: '/api/diaries/1',
        setup: async () => {
          // 先创建日记
          await fetch('http://localhost:3001/api/diaries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: '测试日记',
              content: '测试内容'
            })
          })
        },
        expectedStatus: 200
      },
      {
        name: '获取不存在的日记',
        method: 'GET',
        path: '/api/diaries/999',
        expectedStatus: 404
      }
    ]
  }
]

let testResults = {
  passed: 0,
  failed: 0,
  errors: []
}

async function runTest(test) {
  try {
    // 执行setup（如果存在）
    if (test.setup) {
      await test.setup()
    }

    const url = `http://localhost:3001${test.path}`
    const options = {
      method: test.method,
      headers: {
        'Content-Type': 'application/json'
      }
    }

    if (test.body) {
      options.body = JSON.stringify(test.body)
    }

    const response = await fetch(url, options)
    const data = await response.json()

    // 检查状态码
    if (response.status !== test.expectedStatus) {
      throw new Error(
        `期望状态码 ${test.expectedStatus}, 实际 ${response.status}\n` +
        `响应: ${JSON.stringify(data, null, 2)}`
      )
    }

    // 检查XSS过滤（如果需要）
    if (test.checkSanitization) {
      const responseText = JSON.stringify(data)
      if (responseText.includes('<script>') || responseText.includes('onerror=')) {
        console.log(`  ⚠️  警告: 可能存在XSS漏洞，响应包含未过滤的脚本`)
        testResults.errors.push(`${test.name}: 可能的XSS漏洞`)
      }
    }

    return true
  } catch (error) {
    console.log(`  ❌ 失败: ${error.message}`)
    return false
  }
}

async function runTests() {
  console.log('🚀 启动Next.js服务器进行综合测试...\n')

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

  server.listen(3001, () => {
    console.log('✅ 测试服务器已启动在 http://localhost:3001\n')
  })

  // 等待服务器启动
  await new Promise(resolve => setTimeout(resolve, 3000))

  // 运行测试套件
  for (const suite of testSuites) {
    console.log(`\n📋 ${suite.name}\n`)

    for (const test of suite.tests) {
      process.stdout.write(`  📝 ${test.name}... `)

      const passed = await runTest(test)

      if (passed) {
        console.log('✅')
        testResults.passed++
      } else {
        console.log('')
        testResults.failed++
      }
    }
  }

  // 打印测试结果
  console.log('\n' + '='.repeat(50))
  console.log('📊 测试结果统计:')
  console.log(`  ✅ 通过: ${testResults.passed}`)
  console.log(`  ❌ 失败: ${testResults.failed}`)

  if (testResults.errors.length > 0) {
    console.log('\n⚠️  发现的问题:')
    testResults.errors.forEach(error => {
      console.log(`  - ${error}`)
    })
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

runTests().catch(console.error)