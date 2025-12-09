'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-110 hover:rotate-6 transition-all duration-300 animate-pulse">
                  <span className="text-white font-bold text-4xl animate-bounce">10</span>
                </div>
              </div>
              <h1 className="text-5xl md:text-8xl font-bold mb-6 leading-tight">
                <span className="block text-gray-900 mb-2 transform transition-transform duration-500 hover:scale-105">每天</span>
                <span className="block relative group">
                  <span className="relative z-10 inline-block text-6xl md:text-9xl">
                    <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-600 font-extrabold tracking-tight transform transition-all duration-300 hover:scale-105 hover:from-primary-700 hover:via-primary-800 hover:to-secondary-700 drop-shadow-lg">
                      十分钟
                    </span>
                  </span>
                  <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-secondary-400 rounded-full opacity-60 group-hover:opacity-80 transition-opacity duration-300"></span>
                  <span className="absolute -bottom-4 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-transparent via-primary-300 to-transparent rounded-full opacity-40 group-hover:opacity-60 transition-opacity duration-300"></span>
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
                培养持续写作的习惯，用十分钟记录生活点滴，让思考成为生活的一部分。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/diary/new">
                  <Button size="lg" className="text-lg px-10 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
                    开始记录
                  </Button>
                </Link>
                <Link href="/diaries">
                  <Button variant="secondary" size="lg" className="text-lg px-10 py-4 border-2 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-600 shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200">
                    查看记录
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              为什么选择每天十分钟？
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">轻松坚持</h3>
                <p className="text-gray-600">
                  每天只需十分钟，轻松养成写作习惯，记录生活点滴。
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Markdown支持</h3>
                <p className="text-gray-600">
                  使用简洁的Markdown语法，支持实时预览和丰富的格式选项。
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">隐私安全</h3>
                <p className="text-gray-600">
                  所有数据存储在本地，您的隐私得到完全保护。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-primary-600 mb-2">1000+</div>
                <div className="text-gray-600">用户信赖</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600 mb-2">10k+</div>
                <div className="text-gray-600">记录条目</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600 mb-2">50k+</div>
                <div className="text-gray-600">写作分钟</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600 mb-2">99%</div>
                <div className="text-gray-600">满意度</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}