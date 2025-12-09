'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import MarkdownRendererVditor from '@/components/MarkdownRendererVditor'
import { Diary } from '@/types/diary'
import { formatDate } from '@/lib/utils'
import Footer from '@/components/Footer'

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 w-full">
          {/* 标题和操作按钮 */}
          <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
            <h1 className="text-3xl font-bold text-gray-900 flex-1 break-words">
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
          <div className="text-sm text-gray-500 mb-6">
            <p>创建于 {formatDate(diary.created_at)}</p>
            {diary.updated_at !== diary.created_at && (
              <p>更新于 {formatDate(diary.updated_at)}</p>
            )}
          </div>

          {/* Markdown 内容渲染 */}
          <div className="w-full">
            <MarkdownRendererVditor
              content={diary.content}
              className="w-full"
            />
          </div>

          {/* 返回按钮 */}
          <div className="mt-8 pt-6 border-t">
            <Link href="/diaries">
              <Button variant="ghost">← 返回日记列表</Button>
            </Link>
          </div>

          {/* 自定义样式 */}
          <style jsx global>{`
            .vditor-reset {
              padding: 0 !important;
              max-width: none !important;
            }

            .vditor-reset p {
              margin-bottom: 1rem !important;
              line-height: 1.6 !important;
              white-space: pre-wrap !important;
              word-break: break-word !important;
            }

            .vditor-reset h1,
            .vditor-reset h2,
            .vditor-reset h3,
            .vditor-reset h4,
            .vditor-reset h5,
            .vditor-reset h6 {
              margin-top: 1.5rem !important;
              margin-bottom: 0.5rem !important;
            }

            .vditor-reset ul,
            .vditor-reset ol {
              margin-bottom: 1rem !important;
              padding-left: 2rem !important;
            }

            .vditor-reset pre {
              margin-bottom: 1rem !important;
            }

            .vditor-reset blockquote {
              margin-bottom: 1rem !important;
            }

            .vditor-content {
              width: 100% !important;
            }
          `}</style>
        </div>
      </main>
      <Footer />
    </div>
  )
}