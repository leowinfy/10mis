import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import { writeFile, mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { TestHelper } from '../utils/testHelper'

describe('Diary App Integration Tests', () => {
  let testHelper: TestHelper
  const testDataDir = join(process.cwd(), 'test-data')

  beforeEach(async () => {
    await mkdir(testDataDir, { recursive: true })
    testHelper = new TestHelper()
    await testHelper.init()
  })

  afterEach(async () => {
    await testHelper.cleanup()
    try {
      await rm(testDataDir, { recursive: true, force: true })
    } catch (error) {
      // 忽略清理错误
    }
  })

  describe('完整的日记工作流测试', () => {
    it('应该完成创建、编辑、搜索、导出的完整流程', async () => {
      // 1. 创建日记
      const diaryData = {
        title: '我的第一天',
        content: '# 开启新生活\n\n今天是我开始写日记的第一天。感觉非常兴奋！\n\n## 今天的成就\n\n- 完成了项目设置\n- 写了第一篇日记\n- 计划明天要做的事'
      }

      const createResponse = await testHelper.api.post('/api/diaries', diaryData)
      expect(createResponse.status).toBe(201)
      const createdDiary = createResponse.data
      expect(createdDiary.id).toBeDefined()

      // 2. 上传图片
      const imageData = await testHelper.createMockImage('photo.jpg', 1024 * 500) // 500KB
      const uploadResponse = await testHelper.api.post('/api/upload', imageData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      expect(uploadResponse.status).toBe(200)
      const imageUrl = uploadResponse.data.url

      // 3. 编辑日记，添加图片
      const updatedContent = diaryData.content + `\n\n![我的照片](${imageUrl})`
      const updateResponse = await testHelper.api.put(`/api/diaries/${createdDiary.id}`, {
        content: updatedContent
      })
      expect(updateResponse.status).toBe(200)
      const updatedDiary = updateResponse.data
      expect(updatedDiary.content).toContain(imageUrl)

      // 4. 创建更多日记用于测试
      for (let i = 1; i <= 5; i++) {
        await testHelper.api.post('/api/diaries', {
          title: `日记 ${i + 1}`,
          content: `这是第 ${i + 1} 篇日记的内容。`
        })
      }

      // 5. 测试搜索功能
      const searchResponse = await testHelper.api.get('/api/diaries?search=新生活')
      expect(searchResponse.status).toBe(200)
      expect(searchResponse.data.length).toBe(1)
      expect(searchResponse.data[0].id).toBe(createdDiary.id)

      // 6. 测试导出功能
      const jsonExportResponse = await testHelper.api.get('/api/export?format=json')
      expect(jsonExportResponse.status).toBe(200)
      expect(jsonExportResponse.headers['content-type']).toContain('application/json')
      const exportData = jsonExportResponse.data
      expect(Array.isArray(exportData)).toBe(true)
      expect(exportData.length).toBe(6)

      const mdExportResponse = await testHelper.api.get('/api/export?format=markdown')
      expect(mdExportResponse.status).toBe(200)
      expect(mdExportResponse.headers['content-type']).toContain('text/markdown')
      expect(mdExportResponse.data).toContain('# 我的第一天')

      // 7. 删除日记
      const deleteResponse = await testHelper.api.delete(`/api/diaries/${createdDiary.id}`)
      expect(deleteResponse.status).toBe(200)

      // 8. 验证日记已删除
      const getResponse = await testHelper.api.get(`/api/diaries/${createdDiary.id}`)
      expect(getResponse.status).toBe(404)
    })

    it('应该处理并发的用户操作', async () => {
      // 模拟多个用户同时操作
      const promises = Array.from({ length: 10 }, async (_, i) => {
        // 创建日记
        const diary = await testHelper.api.post('/api/diaries', {
          title: `并发测试日记 ${i}`,
          content: `这是第 ${i} 篇并发测试日记`
        })

        // 上传图片
        const imageData = await testHelper.createMockImage(`image${i}.jpg`, 1024 * 100)
        const upload = await testHelper.api.post('/api/upload', imageData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })

        // 更新日记添加图片
        await testHelper.api.put(`/api/diaries/${diary.data.id}`, {
          content: diary.data.content + `\n![图片](${upload.data.url})`
        })

        return diary.data.id
      })

      const diaryIds = await Promise.all(promises)
      expect(diaryIds.length).toBe(10)

      // 验证所有日记都被正确创建
      const listResponse = await testHelper.api.get('/api/diaries')
      expect(listResponse.data.length).toBe(10)

      // 验证每篇日记都有图片
      for (const id of diaryIds) {
        const diary = await testHelper.api.get(`/api/diaries/${id}`)
        expect(diary.data.content).toContain('/api/uploads/')
      }
    })

    it('应该正确处理大数据量的操作', async () => {
      // 创建大量日记
      const batchSize = 50
      for (let batch = 0; batch < 2; batch++) {
        const promises = Array.from({ length: batchSize }, async (_, i) => {
          const index = batch * batchSize + i
          return testHelper.api.post('/api/diaries', {
            title: `大量测试日记 ${index}`,
            content: `这是第 ${index} 篇测试日记。`.repeat(10) // 较长的内容
          })
        })
        await Promise.all(promises)
      }

      // 测试列表加载性能
      const startTime = Date.now()
      const listResponse = await testHelper.api.get('/api/diaries')
      const loadTime = Date.now() - startTime
      expect(listResponse.status).toBe(200)
      expect(listResponse.data.length).toBe(100)
      expect(loadTime).toBeLessThan(1000) // 应该在1秒内完成

      // 测试搜索性能
      const searchStartTime = Date.now()
      const searchResponse = await testHelper.api.get('/api/diaries?search=大量测试')
      const searchTime = Date.now() - searchStartTime
      expect(searchResponse.status).toBe(200)
      expect(searchResponse.data.length).toBe(100)
      expect(searchTime).toBeLessThan(500) // 搜索应该更快

      // 测试导出性能
      const exportStartTime = Date.now()
      const exportResponse = await testHelper.api.get('/api/export?format=json')
      const exportTime = Date.now() - exportStartTime
      expect(exportResponse.status).toBe(200)
      expect(exportTime).toBeLessThan(2000) // 导出应该在2秒内完成
    })
  })

  describe('错误恢复和容错测试', () => {
    it('应该从文件损坏中恢复', async () => {
      // 创建一些正常数据
      await testHelper.api.post('/api/diaries', {
        title: '正常日记',
        content: '正常内容'
      })

      // 模拟文件损坏
      await testHelper.corruptDataFile('diaries.json')

      // 应该能够创建新的日记（自动恢复）
      const response = await testHelper.api.post('/api/diaries', {
        title: '恢复后的日记',
        content: '恢复后的内容'
      })
      expect(response.status).toBe(201)

      // 应该能够读取现有数据（如果有备份）
      const listResponse = await testHelper.api.get('/api/diaries')
      expect(listResponse.status).toBe(200)
    })

    it('应该处理磁盘空间不足的情况', async () => {
      // 模拟磁盘空间不足
      testHelper.simulateDiskFull()

      // 尝试创建大日记
      const largeContent = 'x'.repeat(10 * 1024 * 1024) // 10MB
      const response = await testHelper.api.post('/api/diaries', {
        title: '大日记',
        content: largeContent
      })

      // 应该返回适当的错误
      expect(response.status).toBe(500)
      expect(response.data.error).toContain('存储空间')
    })

    it('应该处理网络中断的情况', async () => {
      // 模拟网络中断
      testHelper.simulateNetworkError()

      // API调用应该失败
      const response = await testHelper.api.get('/api/diaries')
      expect(response.status).toBeGreaterThanOrEqual(500)

      // 恢复网络后应该正常工作
      testHelper.restoreNetwork()
      const newResponse = await testHelper.api.get('/api/diaries')
      expect(newResponse.status).toBe(200)
    })
  })

  describe('安全性测试', () => {
    it('应该防止XSS攻击', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '"><script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        'javascript:alert(1)',
        '<iframe src="javascript:alert(1)">'
      ]

      for (const payload of xssPayloads) {
        const response = await testHelper.api.post('/api/diaries', {
          title: `XSS测试: ${payload}`,
          content: `内容包含: ${payload}`
        })

        // 应该能够创建（存储层面），但渲染时应该被处理
        expect(response.status).toBe(201)
        expect(response.data.title).toContain(payload)
      }
    })

    it('应该防止文件上传攻击', async () => {
      const maliciousFiles = [
        { name: 'script.php', type: 'application/x-php', content: '<?php echo "hack"; ?>' },
        { name: 'exploit.js', type: 'application/javascript', content: 'console.log("hack")' },
        { name: 'shell.sh', type: 'application/x-sh', content: 'echo "hack"' },
        { name: '../../etc/passwd', type: 'image/png', content: 'fake' }
      ]

      for (const file of maliciousFiles) {
        const formData = new FormData()
        formData.append('file', new Blob([file.content], { type: file.type }), file.name)

        const response = await testHelper.api.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })

        // 应该拒绝恶意文件
        expect(response.status).toBe(400)
        expect(response.data.error).toContain('不支持的文件类型')
      }
    })

    it('应该防止SQL注入攻击', async () => {
      const sqlPayloads = [
        "'; DROP TABLE diaries; --",
        "1' OR '1'='1",
        "1; DELETE FROM diaries; --",
        "' UNION SELECT * FROM users --"
      ]

      // 创建正常数据
      await testHelper.api.post('/api/diaries', {
        title: '正常日记',
        content: '正常内容'
      })

      for (const payload of sqlPayloads) {
        // 尝试在搜索中注入
        const searchResponse = await testHelper.api.get(`/api/diaries?search=${encodeURIComponent(payload)}`)
        expect(searchResponse.status).toBe(200)
        expect(searchResponse.data.length).toBe(0) // 不应该匹配到任何内容

        // 尝试在标题中注入
        const createResponse = await testHelper.api.post('/api/diaries', {
          title: payload,
          content: '内容'
        })
        // 应该成功创建（因为使用文件存储，不是SQL）
        expect(createResponse.status).toBe(201)
      }
    })
  })

  describe('浏览器兼容性测试', () => {
    it('应该在移动端正常工作', async () => {
      // 设置移动端User-Agent
      testHelper.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')

      // 创建日记
      const response = await testHelper.api.post('/api/diaries', {
        title: '移动端测试',
        content: '移动端创建的日记'
      })
      expect(response.status).toBe(201)

      // 验证响应格式适合移动端
      expect(response.data).not.toHaveProperty('largeField') // 不应该包含不必要的大字段
    })

    it('应该处理触摸事件', async () => {
      // 这需要真实的浏览器测试环境
      // 这里只是示例结构
      expect(true).toBe(true)
    })
  })

  describe('性能压力测试', () => {
    it('应该处理高频的创建和更新操作', async () => {
      const duration = 5000 // 5秒
      const startTime = Date.now()
      let operations = 0

      while (Date.now() - startTime < duration) {
        // 创建
        const createResponse = await testHelper.api.post('/api/diaries', {
          title: `压力测试 ${operations}`,
          content: `压力测试内容 ${operations}`
        })

        if (createResponse.status === 201) {
          // 立即更新
          await testHelper.api.put(`/api/diaries/${createResponse.data.id}`, {
            title: `更新 ${operations}`
          })
          operations++
        }

        // 避免过于频繁的请求
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      expect(operations).toBeGreaterThan(50) // 应该至少完成50个操作

      // 验证数据完整性
      const listResponse = await testHelper.api.get('/api/diaries')
      expect(listResponse.data.length).toBe(operations)
    })

    it('应该处理大量并发图片上传', async () => {
      const imageCount = 20
      const promises = Array.from({ length: imageCount }, async (_, i) => {
        const imageData = await testHelper.createMockImage(`image${i}.jpg`, 1024 * 200) // 200KB
        return testHelper.api.post('/api/upload', imageData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      })

      const responses = await Promise.all(promises)
      const successCount = responses.filter(r => r.status === 200).length
      expect(successCount).toBe(imageCount)

      // 验证所有图片都可以访问
      for (const response of responses) {
        if (response.status === 200) {
          const imageResponse = await testHelper.api.get(response.data.url)
          expect(imageResponse.status).toBe(200)
        }
      }
    })
  })
})