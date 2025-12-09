'use client'

import Link from 'next/link'
import { getVersionString } from '@/lib/version'

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 品牌信息 */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">10</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">每天十分钟</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              培养持续写作的习惯，用十分钟记录生活点滴，让思考成为生活的一部分。
            </p>
            <div className="flex space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span>已陪伴</span>
              <span className="font-semibold text-primary-600 dark:text-primary-400">1000+</span>
              <span>用户养成写作习惯</span>
            </div>
          </div>

          {/* 快速链接 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">快速开始</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/diary/new" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  开始记录
                </Link>
              </li>
              <li>
                <Link href="/diaries" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  查看记录
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  使用指南
                </a>
              </li>
            </ul>
          </div>

          {/* 关于我们 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">关于</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://github.com/leowinfy/10mins" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  GitHub
                </a>
              </li>
              <li>
                <a href="/api/version" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  版本信息
                </a>
              </li>
              <li>
                <a href="mailto:winfylau@hotmail.com" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  联系我们
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* 版权信息 */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 md:mb-0">
              © 2024 每天十分钟. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{getVersionString()}</span>
              <span>·</span>
              <span>由{' '}
                <a
                  href="https://github.com/leowinfy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  leowinfy
                </a>
                {' '}开发
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}