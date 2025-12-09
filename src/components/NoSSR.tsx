'use client'

import { useEffect, useState } from 'react'

interface NoSSRProps {
  children: React.ReactNode
}

export default function NoSSR({ children }: NoSSRProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    // 服务端渲染时返回一个占位符
    return (
      <div
        className="flex items-center space-x-2 px-3 py-2"
        aria-hidden="true"
      >
        <div className="w-5 h-5 rounded-full bg-gray-300"></div>
        <div className="w-16 h-4 bg-gray-300 rounded"></div>
      </div>
    )
  }

  return <>{children}</>
}