import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const testDir = join(process.cwd(), 'test-data')

// 确保测试数据目录存在
if (!existsSync(testDir)) {
  mkdirSync(testDir, { recursive: true })
  mkdirSync(join(testDir, 'db'), { recursive: true })
  mkdirSync(join(testDir, 'uploads'), { recursive: true })
}

// 设置环境变量
process.env.DATABASE_DIR = join(testDir, 'db')
process.env.UPLOAD_DIR = join(testDir, 'uploads')
process.env.NODE_ENV = 'test'

console.log('🧪 开始运行测试...')
console.log('📁 测试数据目录:', testDir)

try {
  // 运行API测试
  console.log('\n🔍 运行API测试...')
  execSync('npx jest tests/api/health.test.ts --verbose', { stdio: 'inherit' })

  console.log('\n✅ API测试完成！')
} catch (error) {
  console.error('\n❌ 测试失败:', error)
  process.exit(1)
}

// 清理测试数据
console.log('\n🧹 清理测试数据...')
try {
  execSync(`rm -rf ${testDir}`, { stdio: 'inherit' })
} catch (error) {
  // 忽略清理错误
}

console.log('\n🎉 所有测试完成！')