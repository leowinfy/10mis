import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { POST } from '@/app/api/upload/route'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { NextRequest } from 'next/server'

// 测试数据路径
const TEST_DATA_DIR = join(process.cwd(), 'test-data')
const UPLOADS_DIR = join(TEST_DATA_DIR, 'uploads')

// 模拟图片数据
const createMockImageFile = (filename: string, size: number, type: string): Buffer => {
  // 创建一个简单的PNG文件头
  const header = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
  const padding = Buffer.alloc(Math.max(0, size - header.length))
  return Buffer.concat([header, padding])
}

describe('Upload API Tests', () => {
  beforeEach(async () => {
    // 创建测试目录
    await mkdir(TEST_DATA_DIR, { recursive: true })
    await mkdir(UPLOADS_DIR, { recursive: true })

    // 设置测试环境变量
    process.env.UPLOAD_DIR = UPLOADS_DIR
  })

  afterEach(async () => {
    // 清理测试文件（在实际实现中可能需要更复杂的清理逻辑）
    try {
      // 这里应该清理上传的测试文件
    } catch (error) {
      // 忽略清理错误
    }
  })

  describe('POST /api/upload', () => {
    it('应该成功上传PNG图片', async () => {
      const imageBuffer = createMockImageFile('test.png', 1024, 'image/png')
      const formData = new FormData()
      formData.append('file', new Blob([imageBuffer], { type: 'image/png' }), 'test.png')

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('url')
      expect(data.url).toMatch(/\/api\/uploads\/.*/)
    })

    it('应该成功上传JPG图片', async () => {
      // 模拟JPG文件头
      const jpgHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0])
      const imageBuffer = Buffer.concat([jpgHeader, Buffer.alloc(1020)])
      const formData = new FormData()
      formData.append('file', new Blob([imageBuffer], { type: 'image/jpeg' }), 'test.jpg')

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('url')
    })

    it('应该成功上传GIF图片', async () => {
      // 模拟GIF文件头
      const gifHeader = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
      const imageBuffer = Buffer.concat([gifHeader, Buffer.alloc(1022)])
      const formData = new FormData()
      formData.append('file', new Blob([imageBuffer], { type: 'image/gif' }), 'test.gif')

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('url')
    })

    it('应该拒绝非图片文件', async () => {
      const textBuffer = Buffer.from('This is a text file', 'utf-8')
      const formData = new FormData()
      formData.append('file', new Blob([textBuffer], { type: 'text/plain' }), 'test.txt')

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('不支持的文件类型')
    })

    it('应该拒绝过大的文件', async () => {
      // 创建一个6MB的文件（超过5MB限制）
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024)
      const formData = new FormData()
      formData.append('file', new Blob([largeBuffer], { type: 'image/png' }), 'large.png')

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('文件大小不能超过')
    })

    it('应该拒绝空文件', async () => {
      const emptyBuffer = Buffer.alloc(0)
      const formData = new FormData()
      formData.append('file', new Blob([emptyBuffer], { type: 'image/png' }), 'empty.png')

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('文件不能为空')
    })

    it('应该拒绝没有文件的请求', async () => {
      const formData = new FormData()
      // 不添加文件

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('没有找到文件')
    })

    it('应该处理特殊字符的文件名', async () => {
      const imageBuffer = createMockImageFile('test.png', 1024, 'image/png')
      const formData = new FormData()
      formData.append('file', new Blob([imageBuffer], { type: 'image/png' }), '测试图片@#$.png')

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('url')
      // URL应该被安全地处理，不应该包含特殊字符
      expect(data.url).not.toContain('@')
      expect(data.url).not.toContain('#')
      expect(data.url).not.toContain('$')
    })

    it('应该处理危险文件名', async () => {
      const imageBuffer = createMockImageFile('test.png', 1024, 'image/png')
      const formData = new FormData()
      formData.append('file', new Blob([imageBuffer], { type: 'image/png' }), '../../../etc/passwd.png')

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('url')
      // URL应该是安全的，不应该包含路径遍历
      expect(data.url).not.toContain('..')
    })

    it('应该生成唯一的文件名', async () => {
      const imageBuffer = createMockImageFile('test.png', 1024, 'image/png')

      // 上传两个同名文件
      const formData1 = new FormData()
      formData1.append('file', new Blob([imageBuffer], { type: 'image/png' }), 'same-name.png')
      const request1 = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData1
      })
      const response1 = await POST(request1)
      const data1 = await response1.json()

      const formData2 = new FormData()
      formData2.append('file', new Blob([imageBuffer], { type: 'image/png' }), 'same-name.png')
      const request2 = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData2
      })
      const response2 = await POST(request2)
      const data2 = await response2.json()

      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
      expect(data1.url).not.toBe(data2.url) // URL应该不同
    })
  })

  describe('性能测试', () => {
    it('应该处理多个并发上传', async () => {
      const promises = Array.from({ length: 5 }, (_, i) => {
        const imageBuffer = createMockImageFile(`test${i}.png`, 1024 * 100, 'image/png') // 100KB
        const formData = new FormData()
        formData.append('file', new Blob([imageBuffer], { type: 'image/png' }), `test${i}.png`)

        const request = new NextRequest('http://localhost:3000/api/upload', {
          method: 'POST',
          body: formData
        })
        return POST(request)
      })

      const responses = await Promise.all(promises)

      // 所有请求都应该成功
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })
})