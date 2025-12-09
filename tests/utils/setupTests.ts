import '@testing-library/jest-dom'
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'

// 设置测试环境
beforeAll(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  })

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  // 设置环境变量
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_DIR = './test-data'
  process.env.UPLOAD_DIR = './test-data/uploads'
})

// 每个测试前重置模块注册表
beforeEach(() => {
  vi.resetModules()
})

// 清理测试环境
afterAll(() => {
  // 清理任何全局状态
})

// 模拟文件系统操作
const fs = await import('fs/promises')
const path = await import('path')

// 创建测试数据目录结构
async function setupTestDirectories() {
  const testDir = path.join(process.cwd(), 'test-data')
  const uploadsDir = path.join(testDir, 'uploads')
  const dbDir = path.join(testDir, 'db')

  try {
    await fs.mkdir(testDir, { recursive: true })
    await fs.mkdir(uploadsDir, { recursive: true })
    await fs.mkdir(dbDir, { recursive: true })
  } catch (error) {
    // 目录可能已存在
  }
}

// 清理测试数据
async function cleanupTestData() {
  const testDir = path.join(process.cwd(), 'test-data')
  try {
    await fs.rm(testDir, { recursive: true, force: true })
  } catch (error) {
    // 忽略清理错误
  }
}

// 每个测试套件前设置
beforeEach(async () => {
  await setupTestDirectories()
})

// 每个测试套件后清理
afterEach(async () => {
  await cleanupTestData()
})

// 导出测试工具
export { setupTestDirectories, cleanupTestData }