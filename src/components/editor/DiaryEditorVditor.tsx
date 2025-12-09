'use client'

import { useEffect, useRef, useState } from 'react'
import Vditor from 'vditor'
import 'vditor/dist/index.css'
import { Diary } from '@/types/diary'

interface DiaryEditorVditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  diary?: Diary
}

export default function DiaryEditorVditor({
  value = '',
  onChange,
  placeholder = '开始写日记吧...',
  diary
}: DiaryEditorVditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const vditorRef = useRef<Vditor | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !containerRef.current) return

    // 初始化 Vditor
    vditorRef.current = new Vditor(containerRef.current, {
      height: 500,
      mode: 'ir', // 即时渲染模式
      placeholder,
      cache: {
        enable: false
      },
      input: (value) => {
        onChange?.(value)
      },
      toolbar: [
        'emoji',
        'headings',
        'bold',
        'italic',
        'strike',
        'link',
        '|',
        'list',
        'ordered-list',
        'check',
        'outdent',
        'indent',
        '|',
        'quote',
        'line',
        'code',
        'inline-code',
        'insert-before',
        'insert-after',
        '|',
        'upload',
        'table',
        '|',
        'undo',
        'redo',
        '|',
        'fullscreen',
        'edit-mode'
      ],
      upload: {
        accept: 'image/*',
        url: '/api/upload',
        linkToImgUrl: '/api/upload',
        filename(name) {
          return name.replace(/[^(a-zA-Z0-9\u4e00-\u9fa5\.)]/g, '')
            .replace(/[\?\\/:|<>\*\[\]\(\)\$%\{\}@~]/g, '')
            .replace('/\\s/g', '')
        },
        format(files, responseText) {
          const res = JSON.parse(responseText)
          const imageUrl = res.data?.url || ''
          return JSON.stringify({
            msg: '',
            code: 0,
            data: {
              errFiles: [],
              succMap: {
                [files[0].name]: imageUrl
              }
            }
          })
        }
      },
      preview: {
        delay: 0,
        parse: (element: HTMLElement) => {
          if (element.style.display === 'none') {
            element.style.display = 'block'
          }
        }
      },
      value,
      theme: 'classic'
    })

    return () => {
      if (vditorRef.current) {
        vditorRef.current.destroy()
        vditorRef.current = null
      }
    }
  }, [isClient, placeholder])

  useEffect(() => {
    if (vditorRef.current && value !== vditorRef.current.getValue()) {
      vditorRef.current.setValue(value)
    }
  }, [value])

  return (
    <div className="w-full">
      <div ref={containerRef} className="vditor-container" />
    </div>
  )
}