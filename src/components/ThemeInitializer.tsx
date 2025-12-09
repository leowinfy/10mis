'use client'

import { useEffect } from 'react'
import { getTheme, applyTheme, loadThemePreference } from '@/lib/themes'

export default function ThemeInitializer() {
  useEffect(() => {
    // 在客户端挂载后应用主题
    const savedTheme = loadThemePreference()
    const theme = getTheme(savedTheme)
    applyTheme(theme)
  }, [])

  return null
}