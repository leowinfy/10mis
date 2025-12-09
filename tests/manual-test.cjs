// 手动测试脚本 - 直接测试API端点
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

// 测试数据
const testCases = [
  {
    name: '健康检查',
    method: 'GET',
    path: '/api/health',
    expectedStatus: 200,
    expectedFields: ['status', 'timestamp']
  },
  {
    name: '创建日记',
    method: 'POST',
    path: '/api/diaries',
    body: {
      title: '测试日记标题',
      content: '# 测试内容\n\n这是一篇测试日记。'
    },
    expectedStatus: 201,
    expectedFields: ['data']
  },
  {
    name: '获取日记列表',
    method: 'GET',
    path: '/api/diaries',
    expectedStatus: 200,
    expectedFields: ['data']
  },
  {
    name: '搜索日记',
    method: 'GET',
    path: '/api/diaries?search=测试',
    expectedStatus: 200,
    expectedFields: ['data']
  },
  {
    name: '创建无效日记（空标题）',
    method: 'POST',
    path: '/api/diaries',
    body: {
      title: '',
      content: '内容'
    },
    expectedStatus: 400,
    expectedFields: ['error']
  }
]

async function runTests() {
  console.log('🚀 启动Next.js服务器进行测试...\n')

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
  await new Promise(resolve => setTimeout(resolve, 2000))

  // 运行测试
  for (const test of testCases) {
    console.log(`📝 测试: ${test.name}`)

    try {
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
        console.log(`  ❌ 失败: 期望状态码 ${test.expectedStatus}, 实际 ${response.status}`)
        console.log(`     响应: ${JSON.stringify(data, null, 2)}\n`)
        continue
      }

      // 检查必要字段
      const hasAllFields = test.expectedFields.every(field => {
        const keys = field.split('.')
        let current = data
        for (const key of keys) {
          if (!current || !current.hasOwnProperty(key)) {
            return false
          }
          current = current[key]
        }
        return true
      })

      if (!hasAllFields) {
        console.log(`  ❌ 失败: 缺少必要字段`)
        console.log(`     响应: ${JSON.stringify(data, null, 2)}\n`)
        continue
      }

      console.log(`  ✅ 通过\n`)

    } catch (error) {
      console.log(`  ❌ 错误: ${error.message}\n`)
    }
  }

  console.log('🎉 测试完成！')
  server.close()
  process.exit(0)
}

runTests().catch(console.error)