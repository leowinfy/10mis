import { NextResponse } from 'next/server'
import { versionInfo } from '@/lib/version'

export async function GET() {
  try {
    // 检查数据目录是否可写
    const fs = await import('fs/promises')
    const path = await import('path')

    const dataDir = path.join(process.cwd(), 'data')
    const testFile = path.join(dataDir, 'health-check.txt')

    let dataWritable = false
    try {
      await fs.writeFile(testFile, 'ok', 'utf-8')
      await fs.unlink(testFile)
      dataWritable = true
    } catch (error) {
      console.error('Data directory not writable:', error)
      dataWritable = false
    }

    return NextResponse.json({
      success: true,
      data: {
        status: 'healthy',
        version: versionInfo.version,
        name: versionInfo.name,
        author: versionInfo.author,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        checks: {
          database: dataWritable ? 'ok' : 'error',
          filesystem: 'ok'
        }
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        success: false,
        data: {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      },
      { status: 503 }
    )
  }
}
