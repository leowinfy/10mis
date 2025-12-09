'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import DiaryEditorVditor from '@/components/editor/DiaryEditorVditor'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Loading } from '@/components/ui/Loading'
import Footer from '@/components/Footer'

export default function NewDiaryPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  // 设置默认为当前时间
  const [createdAt, setCreatedAt] = useState(() => {
    const now = new Date()
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    return localDate.toISOString().slice(0, 16)
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

      const response = await fetch('/api/diaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          images: [],
          created_at: isoString
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '创建日记失败')
      }

      const data = await response.json()
      router.push(`/diary/${data.data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">开始记录</h1>

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
                error={error && !title.trim() ? '标题不能为空' : undefined}
              />
            </div>

            {/* 创建时间编辑 */}
            <div className="mb-6">
              <label htmlFor="createdAt" className="block text-sm font-medium text-gray-700 mb-2">
                发布时间
              </label>
              <Input
                id="createdAt"
                type="datetime-local"
                value={createdAt}
                onChange={(e) => setCreatedAt(e.target.value)}
              />
              <p className="mt-1 text-sm text-gray-500">
                您可以修改日记的发布时间
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