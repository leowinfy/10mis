import path from 'path'
import fs from 'fs'

// 上传目录
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'data', 'uploads')

// 确保上传目录存在
function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  }
}

// 处理图片上传
export async function handleImageUpload(file: File): Promise<string> {
  ensureUploadDir()

  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('不支持的文件类型')
  }

  // 检查文件大小（5MB）
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('文件大小不能超过5MB')
  }

  // 生成唯一文件名
  const timestamp = Date.now()
  const random = Math.round(Math.random() * 1E9)
  const ext = path.extname(file.name).toLowerCase()
  const filename = `${timestamp}-${random}${ext}`
  const filepath = path.join(UPLOAD_DIR, filename)

  // 保存原始文件（不压缩，避免Sharp依赖问题）
  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(filepath, buffer)

  // 返回相对路径
  return `/uploads/${filename}`
}

// 删除图片
export function deleteImage(imagePath: string): boolean {
  try {
    // 提取文件名
    const filename = path.basename(imagePath)
    const filepath = path.join(UPLOAD_DIR, filename)

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
      return true
    }
    return false
  } catch (error) {
    console.error('删除图片失败:', error)
    return false
  }
}

// 批量删除图片
export function deleteImages(imagePaths: string[]): void {
  imagePaths.forEach(path => deleteImage(path))
}

// 获取图片统计信息
export function getImageStats(): {
  count: number
  totalSize: number
} {
  ensureUploadDir()

  const files = fs.readdirSync(UPLOAD_DIR)
  let totalSize = 0

  files.forEach(file => {
    const filepath = path.join(UPLOAD_DIR, file)
    if (fs.statSync(filepath).isFile()) {
      totalSize += fs.statSync(filepath).size
    }
  })

  return {
    count: files.length,
    totalSize,
  }
}

// 清理未使用的图片
export async function cleanupUnusedImages(usedImagePaths: string[]): Promise<void> {
  ensureUploadDir()

  const files = fs.readdirSync(UPLOAD_DIR)
  const usedFilenames = new Set(
    usedImagePaths.map(p => path.basename(p))
  )

  for (const file of files) {
    if (!usedFilenames.has(file)) {
      const filepath = path.join(UPLOAD_DIR, file)
      try {
        fs.unlinkSync(filepath)
      } catch (error) {
        console.error(`清理图片失败: ${file}`, error)
      }
    }
  }
}