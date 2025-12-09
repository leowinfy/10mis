'use client'

import { useEffect, useState } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'danger' | 'warning' | 'info'
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  onCancel,
  type = 'danger'
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      // 禁止背景滚动
      document.body.style.overflow = 'hidden'
    } else {
      // 恢复背景滚动
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!mounted) return null

  if (!isOpen) return null

  const typeClasses = {
    danger: {
      confirm: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      icon: 'text-red-600'
    },
    warning: {
      confirm: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
      icon: 'text-yellow-600'
    },
    info: {
      confirm: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      icon: 'text-blue-600'
    }
  }

  const currentType = typeClasses[type]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onCancel}
      />

      {/* 对话框容器 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 图标 */}
          <div className="mx-auto flex h-12 w-12 items-center justify-center">
            <svg
              className={`h-6 w-6 ${currentType.icon}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          {/* 标题 */}
          <h3 className="mt-3 text-center text-lg font-medium leading-6 text-gray-900">
            {title}
          </h3>

          {/* 内容 */}
          <div className="mt-2">
            <p className="text-center text-sm text-gray-500">
              {message}
            </p>
          </div>

          {/* 按钮 */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${currentType.confirm}`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook for using confirm dialog
export function useConfirmDialog() {
  const [dialog, setDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm?: () => void
    type?: 'danger' | 'warning' | 'info'
  }>({
    isOpen: false,
    title: '',
    message: ''
  })

  const confirm = (
    title: string,
    message: string,
    onConfirm?: () => void,
    type: 'danger' | 'warning' | 'info' = 'danger'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          onConfirm?.()
          resolve(true)
          setDialog({ isOpen: false, title: '', message: '' })
        },
        type
      })
    })
  }

  const cancel = () => {
    setDialog({ isOpen: false, title: '', message: '' })
  }

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      isOpen={dialog.isOpen}
      title={dialog.title}
      message={dialog.message}
      onConfirm={dialog.onConfirm || (() => {})}
      onCancel={cancel}
      type={dialog.type}
    />
  )

  return { confirm, ConfirmDialogComponent }
}