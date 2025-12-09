'use client'

import { useEffect, useState } from 'react'
import { Theme, themes, getTheme, applyTheme, saveThemePreference, loadThemePreference } from '@/lib/themes'

export default function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState<Theme>(getTheme('default'))
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      const savedTheme = loadThemePreference()
      const theme = getTheme(savedTheme)
      setCurrentTheme(theme)
      applyTheme(theme)
    }
  }, [mounted])

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme)
    applyTheme(theme)
    saveThemePreference(theme.name)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* 主题选择按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="切换主题"
      >
        <div
          className="w-5 h-5 rounded-full border-2 border-gray-300"
          style={{ backgroundColor: currentTheme.colors.primary }}
        />
        <span className="text-sm text-gray-700">{currentTheme.displayName}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 主题选项下拉菜单 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-2">
            {themes.map((theme) => (
              <button
                key={theme.name}
                onClick={() => handleThemeChange(theme)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  currentTheme.name === theme.name
                    ? 'bg-gray-100'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <span className="text-sm text-gray-700">{theme.displayName}</span>
                {currentTheme.name === theme.name && (
                  <svg
                    className="w-4 h-4 text-green-500 ml-auto"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 点击外部关闭下拉菜单 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}