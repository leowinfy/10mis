import { NextResponse } from 'next/server'
import { getApiVersionInfo } from '@/lib/version'

export async function GET() {
  try {
    const versionInfo = getApiVersionInfo()

    return NextResponse.json({
      success: true,
      data: {
        ...versionInfo,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform
      }
    })
  } catch (error) {
    console.error('获取版本信息失败:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to get version information'
    }, { status: 500 })
  }
}