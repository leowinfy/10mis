import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { dbOperations } from '@/lib/db-enhanced'
import { deleteImages } from '@/lib/storage'
import { sanitizeHtml } from '@/lib/utils'

// 更新日记的请求体验证
const updateDiarySchema = z.object({
  title: z.string().min(1, '标题不能为空').max(100, '标题不能超过100个字符').optional(),
  content: z.string().min(1, '内容不能为空').optional(),
  images: z.array(z.string()).optional(),
  created_at: z.string().datetime().optional()
})

// 获取单个日记
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的日记ID' },
        { status: 400 }
      )
    }

    const diary = dbOperations.getDiaryById(id)

    if (!diary) {
      return NextResponse.json(
        { error: '日记不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: diary })
  } catch (error) {
    console.error('获取日记失败:', error)
    return NextResponse.json(
      { error: '获取日记失败' },
      { status: 500 }
    )
  }
}

// 更新日记
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的日记ID' },
        { status: 400 }
      )
    }

    // 获取原有日记
    const oldDiary = dbOperations.getDiaryById(id)
    if (!oldDiary) {
      return NextResponse.json(
        { error: '日记不存在' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { title, content, images, created_at } = updateDiarySchema.parse(body)

    // 清理输入，防止XSS攻击
    const sanitizedTitle = title ? sanitizeHtml(title) : undefined
    const sanitizedContent = content ? sanitizeHtml(content) : undefined

    // 更新日记
    const updated = dbOperations.updateDiary(
      id,
      sanitizedTitle,
      sanitizedContent,
      images,
      created_at
    )

    if (!updated) {
      return NextResponse.json(
        {
          error: '更新失败',
          message: '数据库更新失败，请检查数据目录权限'
        },
        { status: 500 }
      )
    }

    // 如果图片有更新，删除未使用的图片
    if (images !== undefined) {
      const oldImages = oldDiary.images
      const newImages = images
      const unusedImages = oldImages.filter(img => !newImages.includes(img))
      deleteImages(unusedImages)
    }

    // 返回更新后的日记
    const diary = dbOperations.getDiaryById(id)

    return NextResponse.json({ data: diary })
  } catch (error) {
    console.error('更新日记失败:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求参数错误', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '更新日记失败' },
      { status: 500 }
    )
  }
}

// 删除日记
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的日记ID' },
        { status: 400 }
      )
    }

    // 获取要删除的日记
    const diary = dbOperations.getDiaryById(id)
    if (!diary) {
      return NextResponse.json(
        { error: '日记不存在' },
        { status: 404 }
      )
    }

    // 删除日记
    const deleted = dbOperations.deleteDiary(id)

    if (!deleted) {
      return NextResponse.json(
        {
          error: '删除失败',
          message: '数据库删除失败，请检查数据目录权限'
        },
        { status: 500 }
      )
    }

    // 删除相关图片
    deleteImages(diary.images)

    return NextResponse.json(
      { message: '日记删除成功' },
      { status: 200 }
    )
  } catch (error) {
    console.error('删除日记失败:', error)
    return NextResponse.json(
      { error: '删除日记失败' },
      { status: 500 }
    )
  }
}