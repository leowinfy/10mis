import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 检查数据目录是否可写
    const fs = await import('fs/promises')
    const path = await import('path')

    const dataDir = path.join(process.cwd(), 'data')
    const testFile = path.join(dataDir, 'health-check.txt')

    try {
      await fs.writeFile(testFile, 'ok', 'utf-8')
      await fs.unlink(testFile)
    } catch (error) {
      console.error('Data directory not writable:', error)
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: '4.0.1'
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
