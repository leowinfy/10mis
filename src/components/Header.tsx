'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import MobileMenu from '@/components/mobile-menu'
import ThemeSelector from '@/components/ThemeSelector'
import NoSSR from '@/components/NoSSR'

interface HeaderProps {
  onExport?: () => void
}

export default function Header({ onExport }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    // 这里可以添加搜索逻辑
    // 暂时使用URL参数
    window.location.href = `/diaries?search=${encodeURIComponent(searchQuery)}`
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">10</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">每天十分钟</h1>
            </div>
          </Link>

          {/* 搜索栏 - 桌面端 */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索记录..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <Button type="submit" className="ml-2" disabled={isSearching}>
              {isSearching ? '搜索中...' : '搜索'}
            </Button>
          </form>

          {/* 导航按钮 - 桌面端 */}
          <div className="hidden md:flex items-center space-x-4">
            <NoSSR>
              <ThemeSelector />
            </NoSSR>
            <Link href="/diary/new">
              <Button>开始记录</Button>
            </Link>
            <Button variant="ghost" onClick={onExport}>
              导出
            </Button>
          </div>

          {/* 移动端菜单 */}
          <MobileMenu onExport={onExport} />
        </div>

        {/* 搜索栏 - 移动端 */}
        <form onSubmit={handleSearch} className="md:hidden pb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索记录..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </form>
      </div>
    </header>
  )
}