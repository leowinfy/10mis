'use client'

import React, { useEffect, useRef, useState } from 'react'
import Vditor from 'vditor'
import 'vditor/dist/index.css'

interface MarkdownRendererVditorProps {
  content: string
  className?: string
}

export default function MarkdownRendererVditor({
  content,
  className = ''
}: MarkdownRendererVditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !containerRef.current) return

    // 清空容器
    containerRef.current.innerHTML = ''

    // 如果内容为空，显示提示
    if (!content || content.trim() === '') {
      containerRef.current.innerHTML = '<p class="text-gray-400">暂无内容</p>'
      return
    }

    // 直接使用 Vditor.preview
    Vditor.preview(containerRef.current, content, {
      mode: 'light',
      cdn: 'https://cdn.jsdelivr.net/npm/vditor@3.11.2',
      theme: {
        current: 'classic'
      },
      hljs: {
        enable: true,
        lineNumber: false,
        style: 'github'
      },
      math: {
        engine: 'KaTeX',
        inlineDigit: true
      },
      markdown: {
        toc: false,
        mark: true,
        footnotes: true,
        autoSpace: true
      },
      after: () => {
        // 渲染完成后应用样式
        if (containerRef.current) {
          const vditorContent = containerRef.current.querySelector('.vditor-reset')
          if (vditorContent) {
            const element = vditorContent as HTMLElement
            element.style.whiteSpace = 'pre-wrap'
            element.style.lineHeight = '1.6'
            element.style.marginBottom = '1rem'
            element.style.wordBreak = 'break-word'
          }
        }
      }
    })

  }, [isClient, content])

  return (
    <div
      className={`${className}`}
      ref={containerRef}
      style={{
        minHeight: '100px',
        width: '100%'
      }}
    />
  )
}