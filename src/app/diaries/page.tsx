'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Diary } from '@/types/diary'
import Header from '@/components/Header'
import { Button } from '@/components/ui/Button'
import DiaryCard from '@/components/diary-card'
import Footer from '@/components/Footer'
import { Loading } from '@/components/ui/Loading'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatDate } from '@/lib/utils'

function DiariesPageContent() {
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('search') || ''

  const [diaries, setDiaries] = useState<Diary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取日记列表
  const fetchDiaries = async () => {
    try {
      setLoading(true)
      const url = searchQuery
        ? `/api/diaries?search=${encodeURIComponent(searchQuery)}`
        : '/api/diaries'

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('获取日记列表失败')
      }

      const data = await response.json()
      setDiaries(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生错误')
    } finally {
      setLoading(false)
    }
  }

  // 删除日记
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这篇日记吗？')) {
      return
    }

    try {
      const response = await fetch(`/api/diaries/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('删除失败')
      }

      // 刷新列表
      fetchDiaries()
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    }
  }

  // 导出数据
  const handleExport = (format: 'json' | 'markdown' = 'json') => {
    const url = `/api/export?format=${format}`
    const a = document.createElement('a')
    a.href = url
    a.download = `diaries-${formatDate(new Date().toISOString())}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  useEffect(() => {
    fetchDiaries()
  }, [searchQuery])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onExport={() => handleExport()} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          {searchQuery && (
            <div className="flex items-center justify-between">
              <h2 className="text-lg text-gray-600">
                搜索结果: &quot;{searchQuery}&quot;
              </h2>
              <Link href="/diaries">
                <Button variant="ghost" size="sm">
                  清除搜索
                </Button>
              </Link>
            </div>
          )}
        </div>

        {loading ? (
          <Loading />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchDiaries} className="mt-4">
              重试
            </Button>
          </div>
        ) : diaries.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? '没有找到相关记录' : '还没有任何记录'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? '尝试其他搜索词' : '开始写第一段记录吧'}
            </p>
            <Link href="/diary/new">
              <Button>
                {searchQuery ? '返回列表' : '开始记录'}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {diaries.map((diary) => (
              <DiaryCard
                key={diary.id}
                diary={diary}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default function DiariesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <DiariesPageContent />
    </Suspense>
  )
}