'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Header from '@/components/Header'
import DiaryEditorVditor from '@/components/editor/DiaryEditorVditor'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Loading } from '@/components/ui/Loading'
import { Diary } from '@/types/diary'
import Footer from '@/components/Footer'

export default function EditDiaryPage() {
  const router = useRouter()
  const params = useParams()
  const id = parseInt(params.id as string)

  const [diary, setDiary] = useState<Diary | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [createdAt, setCreatedAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 加载日记数据
  useEffect(() => {
    const fetchDiary = async () => {
      try {
        const response = await fetch(`/api/diaries/${id}`)
        if (!response.ok) {
          throw new Error('获取日记失败')
        }
        const data = await response.json()
        setDiary(data.data)
        setTitle(data.data.title)
        setContent(data.data.content)
        // 格式化日期时间为本地格式
        const date = new Date(data.data.created_at)
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        setCreatedAt(localDate.toISOString().slice(0, 16))
      } catch (err) {
        setError(err instanceof Error ? err.message : '发生错误')
      } finally {
        setInitialLoading(false)
      }
    }

    if (id) {
      fetchDiary()
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setError('请输入标题')
      return
    }

    if (!content.trim()) {
      setError('请输入内容')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 转换为UTC时间保存
      const utcDate = new Date(createdAt + ':00')
      const isoString = utcDate.toISOString()

      const response = await fetch(`/api/diaries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          created_at: isoString
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '更新日记失败')
      }

      router.push(`/diary/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生错误')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-96">
          <Loading />
        </div>
      </div>
    )
  }

  if (error && !diary) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{error}</h2>
            <Button onClick={() => router.back()}>返回</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">编辑记录</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* 标题输入 */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                标题
              </label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="给这段记录起个标题吧"
              />
            </div>

            {/* 创建时间编辑 */}
            <div className="mb-6">
              <label htmlFor="createdAt" className="block text-sm font-medium text-gray-700 mb-2">
                创建时间
              </label>
              <Input
                id="createdAt"
                type="datetime-local"
                value={createdAt}
                onChange={(e) => setCreatedAt(e.target.value)}
              />
              <p className="mt-1 text-sm text-gray-500">
                您可以修改日记的创建时间
              </p>
            </div>

            {/* 内容编辑器 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                内容 <span className="text-gray-400">(Markdown格式)</span>
              </label>
              <DiaryEditorVditor
                value={content}
                onChange={setContent}
                placeholder="记录此刻的想法和感受..."
              />
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? <Loading size="sm" /> : '保存'}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}