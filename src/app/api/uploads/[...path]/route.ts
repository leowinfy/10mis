import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

// 静态文件服务
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params
    const filePath = pathArray.join('/')
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'data', 'uploads')
    const fullPath = path.join(uploadDir, filePath)

    // 安全检查：确保文件在上传目录内
    const resolvedPath = path.resolve(fullPath)
    const resolvedUploadDir = path.resolve(uploadDir)

    if (!resolvedPath.startsWith(resolvedUploadDir)) {
      return NextResponse.json(
        { error: '访问被拒绝' },
        { status: 403 }
      )
    }

    // 检查文件是否存在
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: '文件不存在' },
        { status: 404 }
      )
    }

    // 读取文件
    const fileBuffer = fs.readFileSync(fullPath)
    const fileExtension = path.extname(filePath).toLowerCase()

    // 根据文件扩展名设置Content-Type
    const contentType = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    }[fileExtension] || 'application/octet-stream'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (error) {
    console.error('访问文件失败:', error)
    return NextResponse.json(
      { error: '文件访问失败' },
      { status: 500 }
    )
  }
}