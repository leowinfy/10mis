import { NextRequest, NextResponse } from 'next/server'
import { dbOperations } from '@/lib/db'
import { exportToJSON, exportToMarkdown } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'

    const diaries = dbOperations.getAllDiaries()

    if (format === 'json') {
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        total: diaries.length,
        data: diaries
      }

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="diaries-${new Date().toISOString().split('T')[0]}.json"`
        }
      })
    }

    if (format === 'markdown') {
      const markdown = exportToMarkdown(diaries)

      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="diaries-${new Date().toISOString().split('T')[0]}.md"`
        }
      })
    }

    return NextResponse.json(
      { error: '不支持的导出格式' },
      { status: 400 }
    )
  } catch (error) {
    console.error('导出失败:', error)
    return NextResponse.json(
      { error: '导出失败' },
      { status: 500 }
    )
  }
}