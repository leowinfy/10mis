import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { GET, POST } from '@/app/api/diaries/route'
import { GET as GetById, PUT as UpdateById, DELETE as DeleteById } from '@/app/api/diaries/[id]/route'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { NextRequest } from 'next/server'

// 测试数据路径
const TEST_DATA_DIR = join(process.cwd(), 'test-data')
const DIARIES_FILE = join(TEST_DATA_DIR, 'diaries.json')

// 测试数据
const testDiary = {
  title: '测试日记标题',
  content: '# 测试内容\n\n这是一篇测试日记的内容。\n\n## 子标题\n\n包含一些 **粗体** 和 *斜体* 文字。',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

describe('Diaries API Tests', () => {
  beforeEach(async () => {
    // 创建测试数据目录
    await mkdir(TEST_DATA_DIR, { recursive: true })

    // 初始化空的测试数据文件
    await writeFile(DIARIES_FILE, JSON.stringify([]), 'utf-8')

    // 设置测试环境变量
    process.env.DATABASE_DIR = TEST_DATA_DIR
  })

  afterEach(async () => {
    // 清理测试数据
    try {
      await writeFile(DIARIES_FILE, JSON.stringify([]), 'utf-8')
    } catch (error) {
      // 忽略清理错误
    }
  })

  describe('POST /api/diaries', () => {
    it('应该成功创建日记', async () => {
      const request = new NextRequest('http://localhost:3000/api/diaries', {
        method: 'POST',
        body: JSON.stringify(testDiary),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result).toHaveProperty('data')
      const data = result.data
      expect(data).toHaveProperty('id')
      expect(data.title).toBe(testDiary.title)
      expect(data.content).toBe(testDiary.content)
    })

    it('应该拒绝标题为空的日记', async () => {
      const invalidDiary = { ...testDiary, title: '' }
      const request = new NextRequest('http://localhost:3000/api/diaries', {
        method: 'POST',
        body: JSON.stringify(invalidDiary),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('请求参数错误')
    })

    it('应该拒绝标题过长的日记', async () => {
      const invalidDiary = {
        ...testDiary,
        title: 'a'.repeat(101) // 101个字符
      }
      const request = new NextRequest('http://localhost:3000/api/diaries', {
        method: 'POST',
        body: JSON.stringify(invalidDiary),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('标题长度不能超过')
    })

    it('应该拒绝内容为空的日记', async () => {
      const invalidDiary = { ...testDiary, content: '' }
      const request = new NextRequest('http://localhost:3000/api/diaries', {
        method: 'POST',
        body: JSON.stringify(invalidDiary),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('内容是必填项')
    })

    it('应该处理XSS攻击尝试', async () => {
      const xssDiary = {
        title: '<script>alert("xss")</script>',
        content: '内容包含 <img src="x" onerror="alert(1)">'
      }
      const request = new NextRequest('http://localhost:3000/api/diaries', {
        method: 'POST',
        body: JSON.stringify(xssDiary),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      // 确保脚本被存储但不应该被执行（存储层面）
      expect(data.title).toContain('<script>')
    })

    it('应该处理特殊字符', async () => {
      const specialDiary = {
        title: '特殊字符测试 !@#$%^&*()_+-=[]{}|;:,.<>?',
        content: '包含中文、English、123、emoji: 🚀 📝 ✨'
      }
      const request = new NextRequest('http://localhost:3000/api/diaries', {
        method: 'POST',
        body: JSON.stringify(specialDiary),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.title).toBe(specialDiary.title)
      expect(data.content).toBe(specialDiary.content)
    })
  })

  describe('GET /api/diaries', () => {
    beforeEach(async () => {
      // 创建一些测试数据
      const createRequest = new NextRequest('http://localhost:3000/api/diaries', {
        method: 'POST',
        body: JSON.stringify(testDiary),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      await POST(createRequest)

      const testDiary2 = {
        ...testDiary,
        title: '另一篇测试日记',
        content: '这是另一篇日记的内容，包含关键词：搜索测试'
      }
      const createRequest2 = new NextRequest('http://localhost:3000/api/diaries', {
        method: 'POST',
        body: JSON.stringify(testDiary2),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      await POST(createRequest2)
    })

    it('应该返回所有日记', async () => {
      const request = new NextRequest('http://localhost:3000/api/diaries')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(2)
    })

    it('应该支持搜索功能', async () => {
      const request = new NextRequest('http://localhost:3000/api/diaries?search=搜索测试')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.length).toBe(1)
      expect(data[0].content).toContain('搜索测试')
    })

    it('应该处理空搜索', async () => {
      const request = new NextRequest('http://localhost:3000/api/diaries?search=')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.length).toBe(2) // 空搜索应该返回所有
    })

    it('应该处理搜索结果为空', async () => {
      const request = new NextRequest('http://localhost:3000/api/diaries?search=不存在的关键词')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.length).toBe(0)
    })
  })

  describe('/api/diaries/[id]', () => {
    let diaryId: string

    beforeEach(async () => {
      // 创建一篇测试日记
      const createRequest = new NextRequest('http://localhost:3000/api/diaries', {
        method: 'POST',
        body: JSON.stringify(testDiary),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const createResponse = await POST(createRequest)
      const createdDiary = await createResponse.json()
      diaryId = createdDiary.id
    })

    describe('GET', () => {
      it('应该返回指定的日记', async () => {
        const request = new NextRequest(`http://localhost:3000/api/diaries/${diaryId}`)
        const response = await GetById(request, { params: Promise.resolve({ id: diaryId }) })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.id).toBe(diaryId)
        expect(data.title).toBe(testDiary.title)
      })

      it('应该处理不存在的ID', async () => {
        const fakeId = 'non-existent-id'
        const request = new NextRequest(`http://localhost:3000/api/diaries/${fakeId}`)
        const response = await GetById(request, { params: Promise.resolve({ id: fakeId }) })
        const data = await response.json()

        expect(response.status).toBe(404)
        expect(data.error).toContain('未找到')
      })
    })

    describe('PUT', () => {
      it('应该成功更新日记', async () => {
        const updatedData = {
          title: '更新后的标题',
          content: '更新后的内容'
        }
        const request = new NextRequest(`http://localhost:3000/api/diaries/${diaryId}`, {
          method: 'PUT',
          body: JSON.stringify(updatedData),
          headers: {
            'Content-Type': 'application/json'
          }
        })
        const response = await UpdateById(request, { params: Promise.resolve({ id: diaryId }) })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.title).toBe(updatedData.title)
        expect(data.content).toBe(updatedData.content)
        expect(data.updatedAt).not.toBe(data.createdAt)
      })

      it('应该支持部分更新', async () => {
        const updatedData = { title: '仅更新标题' }
        const request = new NextRequest(`http://localhost:3000/api/diaries/${diaryId}`, {
          method: 'PUT',
          body: JSON.stringify(updatedData),
          headers: {
            'Content-Type': 'application/json'
          }
        })
        const response = await UpdateById(request, { params: Promise.resolve({ id: diaryId }) })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.title).toBe(updatedData.title)
        expect(data.content).toBe(testDiary.content) // 原内容应该保留
      })

      it('应该拒绝更新不存在的日记', async () => {
        const fakeId = 'non-existent-id'
        const updatedData = { title: '更新' }
        const request = new NextRequest(`http://localhost:3000/api/diaries/${fakeId}`, {
          method: 'PUT',
          body: JSON.stringify(updatedData),
          headers: {
            'Content-Type': 'application/json'
          }
        })
        const response = await UpdateById(request, { params: Promise.resolve({ id: fakeId }) })

        expect(response.status).toBe(404)
      })
    })

    describe('DELETE', () => {
      it('应该成功删除日记', async () => {
        const request = new NextRequest(`http://localhost:3000/api/diaries/${diaryId}`, {
          method: 'DELETE'
        })
        const response = await DeleteById(request, { params: Promise.resolve({ id: diaryId }) })

        expect(response.status).toBe(200)

        // 验证日记已被删除
        const getRequest = new NextRequest(`http://localhost:3000/api/diaries/${diaryId}`)
        const getResponse = await GetById(getRequest, { params: Promise.resolve({ id: diaryId }) })
        expect(getResponse.status).toBe(404)
      })

      it('应该处理删除不存在的日记', async () => {
        const fakeId = 'non-existent-id'
        const request = new NextRequest(`http://localhost:3000/api/diaries/${fakeId}`, {
          method: 'DELETE'
        })
        const response = await DeleteById(request, { params: Promise.resolve({ id: fakeId }) })

        expect(response.status).toBe(404)
      })
    })
  })

  describe('并发测试', () => {
    it('应该处理并发创建日记', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => {
        const diary = {
          ...testDiary,
          title: `并发测试日记 ${i}`
        }
        const request = new NextRequest('http://localhost:3000/api/diaries', {
          method: 'POST',
          body: JSON.stringify(diary),
          headers: {
            'Content-Type': 'application/json'
          }
        })
        return POST(request)
      })

      const responses = await Promise.all(promises)

      // 所有请求都应该成功
      responses.forEach(response => {
        expect(response.status).toBe(201)
      })

      // 验证所有日记都被创建
      const listRequest = new NextRequest('http://localhost:3000/api/diaries')
      const listResponse = await GET(listRequest)
      const diaries = await listResponse.json()

      expect(diaries.length).toBe(10)
    })
  })
})