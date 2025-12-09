import { describe, it, expect, beforeEach } from '@jest/globals'
import { GET } from '@/app/api/health/route'

describe('Health API Tests', () => {
  it('应该返回健康状态', async () => {
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('status', 'ok')
    expect(data).toHaveProperty('timestamp')
  })
})