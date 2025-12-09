import { NextRequest, NextResponse } from 'next/server'
import { handleImageUpload } from '@/lib/storage'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // 尝试多个可能的字段名
    let file = formData.get('file') as File

    // 如果file字段不存在，尝试其他可能的字段名
    if (!file) {
      formData.forEach((value, key) => {
        if (value instanceof File && !file) {
          file = value
        }
      })
    }

    if (!file) {
      return NextResponse.json(
        { error: '没有选择文件' },
        { status: 400 }
      )
    }

    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '不支持的文件类型，请上传 JPG、PNG、GIF 或 WebP 格式的图片' },
        { status: 400 }
      )
    }

    // 检查文件大小（5MB）
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '文件大小不能超过5MB' },
        { status: 400 }
      )
    }

    // 处理图片上传
    const imagePath = await handleImageUpload(file)

    return NextResponse.json({
      data: {
        url: imagePath,
        name: file.name,
        size: file.size
      }
    })
  } catch (error) {
    console.error('图片上传失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '图片上传失败' },
      { status: 500 }
    )
  }
}