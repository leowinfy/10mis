// 图片上传测试脚本
const { createServer } = require('http')
const { parse } = require('url')
const { FormData, Blob } = require('formdata-node')
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

// 创建测试图片
function createTestImage(filename = 'test.png', size = 1024) {
  // 创建一个简单的PNG文件头
  const header = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
  const padding = Buffer.alloc(Math.max(0, size - header.length))
  return Buffer.concat([header, padding])
}

// 测试用例
const imageTests = [
  {
    name: '上传PNG图片',
    filename: 'test.png',
    mimeType: 'image/png',
    size: 1024,
    expectedStatus: 200
  },
  {
    name: '上传JPG图片',
    filename: 'test.jpg',
    mimeType: 'image/jpeg',
    size: 2048,
    expectedStatus: 200
  },
  {
    name: '上传GIF图片',
    filename: 'test.gif',
    mimeType: 'image/gif',
    size: 512,
    expectedStatus: 200
  },
  {
    name: '上传WebP图片',
    filename: 'test.webp',
    mimeType: 'image/webp',
    size: 1024,
    expectedStatus: 200
  },
  {
    name: '上传非图片文件（应该失败）',
    filename: 'test.txt',
    mimeType: 'text/plain',
    size: 1024,
    expectedStatus: 400
  },
  {
    name: '上传超大文件（应该失败）',
    filename: 'large.png',
    mimeType: 'image/png',
    size: 6 * 1024 * 1024, // 6MB
    expectedStatus: 400
  },
  {
    name: '上传空文件（应该失败）',
    filename: 'empty.png',
    mimeType: 'image/png',
    size: 0,
    expectedStatus: 400
  }
]

async function runTests() {
  console.log('🚀 启动Next.js服务器进行图片上传测试...\n')

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

  console.log('📋 图片上传测试\n')

  let passed = 0
  let failed = 0

  for (const test of imageTests) {
    process.stdout.write(`  📝 ${test.name}... `)

    try {
      const formData = new FormData()
      const imageBuffer = createTestImage(test.filename, test.size)
      const blob = new Blob([imageBuffer], { type: test.mimeType })
      formData.append('file', blob, test.filename)

      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.status !== test.expectedStatus) {
        console.log(`❌ 失败: 期望状态码 ${test.expectedStatus}, 实际 ${response.status}`)
        console.log(`     响应: ${JSON.stringify(data, null, 2)}\n`)
        failed++
        continue
      }

      // 如果期望成功，检查返回的数据结构
      if (test.expectedStatus === 200) {
        if (!data.data || !data.data.url) {
          console.log('❌ 失败: 响应缺少URL字段')
          failed++
          continue
        }

        // 验证图片确实被保存了
        try {
          const imageUrl = data.data.url
          if (imageUrl.startsWith('/api/uploads/')) {
            console.log('✅')
            passed++
          } else {
            console.log(`❌ 失败: URL格式不正确`)
            failed++
          }
        } catch (err) {
          console.log(`❌ 失败: 图片文件验证失败`)
          failed++
        }
      } else {
        console.log('✅')
        passed++
      }

    } catch (error) {
      console.log(`❌ 错误: ${error.message}`)
      failed++
    }
  }

  // 测试图片URL访问
  console.log('\n📋 图片URL访问测试\n')

  // 上传一张测试图片
  console.log('  📝 上传测试图片...')
  const formData = new FormData()
  const testImageBuffer = createTestImage('url-test.png', 1024)
  const blob = new Blob([testImageBuffer], { type: 'image/png' })
  formData.append('file', blob, 'url-test.png')

  const uploadResponse = await fetch('http://localhost:3001/api/upload', {
    method: 'POST',
    body: formData
  })

  if (uploadResponse.status === 200) {
    const uploadData = await uploadResponse.json()
    const imageUrl = uploadData.data.url

    process.stdout.write(`  📝 访问图片URL ${imageUrl}... `)

    try {
      const imageResponse = await fetch(`http://localhost:3001${imageUrl}`)
      if (imageResponse.status === 200) {
        console.log('✅')
        passed++
      } else {
        console.log(`❌ 失败: 状态码 ${imageResponse.status}`)
        failed++
      }
    } catch (error) {
      console.log(`❌ 错误: ${error.message}`)
      failed++
    }
  } else {
    console.log('  ❌ 测试图片上传失败，跳过URL访问测试')
  }

  // 打印测试结果
  console.log('\n' + '='.repeat(50))
  console.log('📊 测试结果统计:')
  console.log(`  ✅ 通过: ${passed}`)
  console.log(`  ❌ 失败: ${failed}`)

  console.log('\n🎉 测试完成！')
  server.close()

  // 清理测试数据
  try {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true })
  } catch (error) {
    // 忽略清理错误
  }

  process.exit(failed > 0 ? 1 : 0)
}

runTests().catch(console.error)