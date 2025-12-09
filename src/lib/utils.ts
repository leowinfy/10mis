import { type ClassValue } from 'clsx'

// 简化的className合并函数，避免在服务端出现问题
export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ')
}

// 格式化日期
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      if (minutes === 0) {
        return '刚刚'
      }
      return `${minutes}分钟前`
    }
    return `${hours}小时前`
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

// 截取文本
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// 处理Markdown内容预览
export function formatMarkdownPreview(content: string, maxLength: number = 200): string {
  // 移除Markdown语法标记
  let text = content
    .replace(/#{1,6}\s+/g, '') // 移除标题标记
    .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体标记
    .replace(/\*(.*?)\*/g, '$1') // 移除斜体标记
    .replace(/`(.*?)`/g, '$1') // 移除行内代码标记
    .replace(/```[\s\S]*?```/g, '[代码块]') // 替换代码块
    .replace(/!\[.*?\]\(.*?\)/g, '[图片]') // 替换图片
    .replace(/\[.*?\]\(.*?\)/g, '$1') // 移除链接，保留文字
    .replace(/^\s*[-*+]\s+/gm, '• ') // 统一列表项
    .replace(/^\s*\d+\.\s+/gm, '• ') // 统一有序列表
    .replace(/^\s*>\s+/gm, '') // 移除引用标记
    .replace(/^---+\s*$/gm, '') // 移除分割线
    .replace(/\n{3,}/g, '\n\n') // 合并多个空行

  // 分割成行
  const lines = text.split('\n').filter(line => line.trim())

  // 如果内容太长，保留前几行
  let result = ''
  let length = 0
  const maxLines = 3

  for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
    const line = lines[i].trim()
    if (length + line.length > maxLength) {
      result += line.slice(0, maxLength - length) + '...'
      break
    }
    if (i > 0) result += '\n'
    result += line
    length += line.length
  }

  // 如果还有更多内容，添加省略号
  if (lines.length > maxLines && !result.endsWith('...')) {
    result += '\n...'
  }

  return result || '（无内容）'
}

// 生成随机ID
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// 处理API响应
export function apiResponse<T>(
  data?: T,
  error?: string,
  status = 200
): Response {
  const body = JSON.stringify({
    success: status >= 200 && status < 300,
    data,
    error,
  })

  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

// 验证图片URL
export function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

// XSS防护 - 清理HTML标签和脚本
export function sanitizeHtml(input: string): string {
  if (!input) return input

  // 移除<script>标签及其内容
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // 移除危险的属性，如onerror, onclick等
  sanitized = sanitized.replace(/\on\w+\s*=\s*["'][^"']*["']/gi, '')

  // 移除javascript:协议
  sanitized = sanitized.replace(/javascript\s*:/gi, '')

  // 转义<和>（但保留Markdown格式）
  // 对于日记内容，我们保留它作为纯文本，让前端渲染时处理
  // 但在API响应中，我们不应该返回可执行的HTML

  return sanitized
}

// 从Markdown内容中提取图片URL
export function extractImageUrlsFromMarkdown(content: string): string[] {
  const imageRegex = /!\[.*?\]\((.*?)\)/g
  const urls: string[] = []
  let match

  while ((match = imageRegex.exec(content)) !== null) {
    const url = match[1]
    if (isValidImageUrl(url)) {
      urls.push(url)
    }
  }

  return urls
}

// 删除图片文件（仅在服务端使用）
export async function deleteImages(urls: string[]): Promise<void> {
  // 只在服务端环境中执行
  if (typeof window !== 'undefined') {
    return
  }

  try {
    // 动态导入 Node.js 模块
    const { unlink } = await import('fs/promises')
    const { join } = await import('path')

    for (const url of urls) {
      try {
        // 如果是相对路径的uploads文件
        if (url.startsWith('/uploads/')) {
          const filePath = join(process.cwd(), url)
          await unlink(filePath)
        }
      } catch (error) {
        console.error('Failed to delete image:', url, error)
      }
    }
  } catch (error) {
    console.error('Failed to import Node.js modules:', error)
  }
}

// 创建ZIP文件
export async function createZipFile(files: Array<{
  name: string
  content: string | Buffer
}>): Promise<Buffer> {
  // 这里可以使用JSZip库，为了简化暂时返回空Buffer
  // 实际实现时需要安装JSZip: npm install jszip @types/jszip
  return Buffer.from('')
}

// 导出数据为JSON
export function exportToJSON(data: any): string {
  return JSON.stringify({
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data,
  }, null, 2)
}

// 导出数据为Markdown
export function exportToMarkdown(diaries: Array<{
  title: string
  content: string
  created_at: string
}>): string {
  return diaries
    .map(diary => {
      const date = new Date(diary.created_at).toLocaleDateString('zh-CN')
      return `# ${diary.title}\n\n${diary.content}\n\n*${date}*\n\n---\n`
    })
    .join('\n')
}