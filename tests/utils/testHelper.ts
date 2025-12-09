import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { writeFile, mkdir, rm, readFile } from 'fs/promises'
import { join } from 'path'

export class TestHelper {
  private api: AxiosInstance
  private testDataDir: string
  private networkError = false
  private diskFull = false
  private userAgent = ''

  constructor() {
    this.testDataDir = join(process.cwd(), 'test-data')
    this.api = axios.create({
      baseURL: 'http://localhost:3000',
      timeout: 30000
    })

    // 添加请求拦截器用于模拟网络错误
    this.api.interceptors.request.use((config) => {
      if (this.networkError) {
        throw new Error('Network error simulated')
      }
      if (this.userAgent) {
        config.headers['User-Agent'] = this.userAgent
      }
      return config
    })
  }

  async init() {
    // 创建测试目录
    await mkdir(this.testDataDir, { recursive: true })
    await mkdir(join(this.testDataDir, 'uploads'), { recursive: true })
    await mkdir(join(this.testDataDir, 'db'), { recursive: true })

    // 初始化测试数据
    await this.initTestData()
  }

  private async initTestData() {
    // 创建空的diaries.json
    await writeFile(
      join(this.testDataDir, 'db', 'diaries.json'),
      JSON.stringify([]),
      'utf-8'
    )

    // 设置环境变量
    process.env.DATABASE_DIR = join(this.testDataDir, 'db')
    process.env.UPLOAD_DIR = join(this.testDataDir, 'uploads')
  }

  async cleanup() {
    try {
      await rm(this.testDataDir, { recursive: true, force: true })
    } catch (error) {
      // 忽略清理错误
    }
  }

  // 创建模拟图片
  async createMockImage(filename: string, size: number): Promise<FormData> {
    const formData = new FormData()

    // 创建一个简单的PNG文件头
    const header = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
    const padding = new Uint8Array(Math.max(0, size - header.length))
    const imageBuffer = new Uint8Array([...header, ...padding])

    const blob = new Blob([imageBuffer], { type: 'image/png' })
    formData.append('file', blob, filename)

    return formData
  }

  // 损坏数据文件
  async corruptDataFile(filename: string) {
    const filePath = join(this.testDataDir, 'db', filename)
    await writeFile(filePath, 'corrupted data', 'utf-8')
  }

  // 模拟网络错误
  simulateNetworkError() {
    this.networkError = true
  }

  // 恢复网络
  restoreNetwork() {
    this.networkError = false
  }

  // 模拟磁盘满
  simulateDiskFull() {
    this.diskFull = true
    // 在实际实现中，这里可能需要修改文件系统行为
  }

  // 设置User-Agent
  setUserAgent(userAgent: string) {
    this.userAgent = userAgent
  }

  // 获取API实例
  get apiClient() {
    return this.api
  }

  // 辅助方法：读取测试数据
  async readTestData(filename: string): Promise<any> {
    const filePath = join(this.testDataDir, 'db', filename)
    const content = await readFile(filePath, 'utf-8')
    return JSON.parse(content)
  }

  // 辅助方法：验证图片是否存在
  async imageExists(url: string): Promise<boolean> {
    try {
      const response = await this.api.get(url)
      return response.status === 200
    } catch {
      return false
    }
  }
}