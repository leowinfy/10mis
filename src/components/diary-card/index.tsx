import Link from 'next/link'
import { Diary } from '@/types/diary'
import { formatDate, formatMarkdownPreview } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface DiaryCardProps {
  diary: Diary
  onDelete?: (id: number) => void
}

export default function DiaryCard({ diary, onDelete }: DiaryCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
      {/* 标题 */}
      <div className="flex justify-between items-start mb-3">
        <Link
          href={`/diary/${diary.id}`}
          className="text-xl font-semibold text-gray-900 hover:text-primary-600 transition-colors"
        >
          {diary.title}
        </Link>
        {onDelete && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(diary.id)}
          >
            删除
          </Button>
        )}
      </div>

      {/* 时间 */}
      <div className="text-sm text-gray-500 mb-3">
        {formatDate(diary.created_at)}
      </div>

      {/* 内容预览 */}
      <div className="text-gray-700 mb-3 whitespace-pre-wrap">
        {formatMarkdownPreview(diary.content, 200)}
      </div>

      {/* 图片预览 */}
      {diary.images && diary.images.length > 0 && (
        <div className="flex space-x-2 mb-3 overflow-x-auto">
          {diary.images.slice(0, 3).map((image, index) => (
            <div key={index} className="flex-shrink-0">
              <img
                src={image}
                alt=""
                className="w-20 h-20 object-cover rounded"
              />
            </div>
          ))}
          {diary.images.length > 3 && (
            <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-sm text-gray-600">
              +{diary.images.length - 3}
            </div>
          )}
        </div>
      )}

      {/* 阅读更多链接 */}
      <Link
        href={`/diary/${diary.id}`}
        className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
      >
        阅读更多 →
      </Link>
    </div>
  )
}