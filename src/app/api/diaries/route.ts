import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { dbOperations } from '@/lib/db-enhanced'
import { deleteImages, sanitizeHtml } from '@/lib/utils'

// 创建日记的请求体验证
const createDiarySchema = z.object({
  title: z.string().min(1, '标题不能为空').max(100, '标题不能超过100个字符'),
  content: z.string().min(1, '内容不能为空'),
  images: z.array(z.string()).optional().default([]),
  created_at: z.string().datetime().optional()
})

// 获取所有日记
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    if (search) {
      const diaries = dbOperations.searchDiaries(search)
      return NextResponse.json({ data: diaries })
    }

    const diaries = dbOperations.getAllDiaries()
    return NextResponse.json({ data: diaries })
  } catch (error) {
    console.error('获取日记列表失败:', error)
    return NextResponse.json(
      { error: '获取日记列表失败' },
      { status: 500 }
    )
  }
}

// 创建新日记
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 验证请求数据
    const { title, content, images, created_at } = createDiarySchema.parse(body)

    // 清理输入，防止XSS攻击
    const sanitizedTitle = sanitizeHtml(title)
    const sanitizedContent = sanitizeHtml(content)

    // 创建日记
    const id = dbOperations.createDiary(sanitizedTitle, sanitizedContent, images, created_at)

    // 返回创建的日记
    const diary = dbOperations.getDiaryById(id)

    return NextResponse.json(
      { data: diary },
      { status: 201 }
    )
  } catch (error) {
    console.error('创建日记失败:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求参数错误', details: error.errors },
        { status: 400 }
      )
    }

    // 返回更详细的错误信息
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      {
        error: '创建日记失败',
        message: errorMessage,
        debug: {
          cwd: process.cwd(),
          uid: process.getuid?.() || 'unknown',
          gid: process.getgid?.() || 'unknown'
        }
      },
      { status: 500 }
    )
  }
}