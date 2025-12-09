import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ThemeInitializer from '@/components/ThemeInitializer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '每天十分钟 - 记录生活，沉淀思考',
  description: '每天十分钟，用Markdown记录生活点滴，培养持续写作习惯，让思考成为生活的一部分。',
  keywords: '日记, 写作, Markdown, 个人成长, 习惯养成, 生活记录',
  authors: [{ name: '每天十分钟' }],
  openGraph: {
    title: '每天十分钟 - 记录生活，沉淀思考',
    description: '每天十分钟，用Markdown记录生活点滴，培养持续写作习惯',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <ThemeInitializer />
        {children}
      </body>
    </html>
  )
}