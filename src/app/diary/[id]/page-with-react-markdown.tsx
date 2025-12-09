'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { Diary } from '@/types/diary'
import { formatDate } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'

export default function DiaryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = parseInt(params.id as string)

  const [diary, setDiary] = useState<Diary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDiary = async () => {
      try {
        const response = await fetch(`/api/diaries/${id}`)

        if (!response.ok) {
          if (response.status === 404) {
            setError('日记不存在')
          } else {
            throw new Error('获取日记失败')
          }
          return
        }

        const data = await response.json()
        setDiary(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '发生错误')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchDiary()
    }
  }, [id])

  const handleDelete = async () => {
    if (!confirm('确定要删除这篇日记吗？此操作不可恢复。')) {
      return
    }

    try {
      const response = await fetch(`/api/diaries/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('删除失败')
      }

      router.push('/diaries')
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-96">
          <Loading />
        </div>
      </div>
    )
  }

  if (error || !diary) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {error || '日记不存在'}
            </h2>
            <Link href="/diaries">
              <Button>返回日记列表</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          {/* 标题和操作按钮 */}
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-bold text-gray-900 flex-1 mr-4">
              {diary.title}
            </h1>
            <div className="flex space-x-2 flex-shrink-0">
              <Link href={`/diary/${diary.id}/edit`}>
                <Button variant="secondary">编辑</Button>
              </Link>
              <Button variant="danger" onClick={handleDelete}>
                删除
              </Button>
            </div>
          </div>

          {/* 时间信息 */}
          <div className="text-sm text-gray-500 mb-8">
            <p>创建于 {formatDate(diary.created_at)}</p>
            {diary.updated_at !== diary.created_at && (
              <p>更新于 {formatDate(diary.updated_at)}</p>
            )}
          </div>

          {/* Markdown 内容 */}
          <div className="prose prose-lg max-w-none">
            <ReactMarkdown>{diary.content}</ReactMarkdown>
          </div>

          {/* 图片展示 */}
          {diary.images && diary.images.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">图片</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {diary.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt=""
                      className="w-full h-auto rounded-lg shadow-md"
                    />
                    <a
                      href={image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg"
                    >
                      <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        查看原图
                      </span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 返回按钮 */}
          <div className="mt-8 pt-6 border-t">
            <Link href="/diaries">
              <Button variant="ghost">← 返回日记列表</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}