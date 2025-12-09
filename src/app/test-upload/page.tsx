'use client'

import { useEffect, useRef, useState } from 'react'
import Vditor from 'vditor'
import 'vditor/dist/index.css'

export default function TestUploadPage() {
  const vditorRef = useRef<HTMLDivElement>(null)
  const [vditorInstance, setVditorInstance] = useState<Vditor | null>(null)

  useEffect(() => {
    if (vditorRef.current && !vditorInstance) {
      const vditor = new Vditor(vditorRef.current, {
        height: 400,
        mode: 'ir',
        placeholder: '测试上传...',
        cache: {
          enable: false
        },
        upload: {
          accept: 'image/*',
          url: '/api/upload',
          fieldName: 'file',
          filename(name) {
            return name.replace(/[^(a-zA-Z0-9\u4e00-\u9fa5\.)]/g, '')
              .replace(/[\?\\/:|<>\*\[\]\(\)\$%\{\}@~]/g, '')
              .replace(/\s/g, '')
          },
          format(files, responseText) {
            console.log('Upload response:', responseText);
            try {
              const res = JSON.parse(responseText)
              if (res.data && res.data.url) {
                const imageUrl = res.data.url
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
              } else {
                return JSON.stringify({
                  msg: res.error || '上传失败',
                  code: 1,
                  data: {
                    errFiles: [files[0].name],
                    succMap: {}
                  }
                })
              }
            } catch (e) {
              console.error('Upload response error:', e)
              return JSON.stringify({
                msg: '上传失败',
                code: 1,
                data: {
                  errFiles: [files[0].name],
                  succMap: {}
                }
              })
            }
          }
        },
        after: () => {
          setVditorInstance(vditor)
        }
      })
    }

    return () => {
      if (vditorInstance) {
        vditorInstance.destroy()
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-4">Vditor 上传测试</h1>
      <p className="mb-4 text-gray-600">请尝试拖拽、粘贴或选择图片文件上传</p>
      <div className="border rounded-lg overflow-hidden bg-white">
        <div ref={vditorRef} />
      </div>
    </div>
  )
}