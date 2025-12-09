export interface Theme {
  name: string
  displayName: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: string
    textSecondary: string
    border: string
    error: string
    warning: string
    success: string
  }
  css: string
}

export const themes: Theme[] = [
  {
    name: 'default',
    displayName: '清新绿',
    colors: {
      primary: '#10b981',
      secondary: '#06b6d4',
      accent: '#8b5cf6',
      background: '#f9fafb',
      surface: '#ffffff',
      text: '#111827',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      error: '#ef4444',
      warning: '#f59e0b',
      success: '#10b981'
    },
    css: `
      :root {
        --color-primary: #10b981;
        --color-secondary: #06b6d4;
        --color-accent: #8b5cf6;
        --color-background: #f9fafb;
        --color-surface: #ffffff;
        --color-text: #111827;
        --color-text-secondary: #6b7280;
        --color-border: #e5e7eb;
        --color-error: #ef4444;
        --color-warning: #f59e0b;
        --color-success: #10b981;
      }
    `
  },
  {
    name: 'ocean',
    displayName: '海洋蓝',
    colors: {
      primary: '#0ea5e9',
      secondary: '#0284c7',
      accent: '#6366f1',
      background: '#f0f9ff',
      surface: '#ffffff',
      text: '#0c4a6e',
      textSecondary: '#075985',
      border: '#e0f2fe',
      error: '#ef4444',
      warning: '#f59e0b',
      success: '#10b981'
    },
    css: `
      :root {
        --color-primary: #0ea5e9;
        --color-secondary: #0284c7;
        --color-accent: #6366f1;
        --color-background: #f0f9ff;
        --color-surface: #ffffff;
        --color-text: #0c4a6e;
        --color-text-secondary: #075985;
        --color-border: #e0f2fe;
        --color-error: #ef4444;
        --color-warning: #f59e0b;
        --color-success: #10b981;
      }
    `
  },
  {
    name: 'sunset',
    displayName: '落日橙',
    colors: {
      primary: '#f97316',
      secondary: '#dc2626',
      accent: '#ea580c',
      background: '#fff7ed',
      surface: '#ffffff',
      text: '#7c2d12',
      textSecondary: '#9a3412',
      border: '#fed7aa',
      error: '#ef4444',
      warning: '#f59e0b',
      success: '#10b981'
    },
    css: `
      :root {
        --color-primary: #f97316;
        --color-secondary: #dc2626;
        --color-accent: #ea580c;
        --color-background: #fff7ed;
        --color-surface: #ffffff;
        --color-text: #7c2d12;
        --color-text-secondary: #9a3412;
        --color-border: #fed7aa;
        --color-error: #ef4444;
        --color-warning: #f59e0b;
        --color-success: #10b981;
      }
    `
  },
  {
    name: 'purple',
    displayName: '优雅紫',
    colors: {
      primary: '#8b5cf6',
      secondary: '#7c3aed',
      accent: '#a855f7',
      background: '#faf5ff',
      surface: '#ffffff',
      text: '#4c1d95',
      textSecondary: '#5b21b6',
      border: '#e9d5ff',
      error: '#ef4444',
      warning: '#f59e0b',
      success: '#10b981'
    },
    css: `
      :root {
        --color-primary: #8b5cf6;
        --color-secondary: #7c3aed;
        --color-accent: #a855f7;
        --color-background: #faf5ff;
        --color-surface: #ffffff;
        --color-text: #4c1d95;
        --color-text-secondary: #5b21b6;
        --color-border: #e9d5ff;
        --color-error: #ef4444;
        --color-warning: #f59e0b;
        --color-success: #10b981;
      }
    `
  },
  {
    name: 'dark',
    displayName: '暗夜模式',
    colors: {
      primary: '#22d3ee',
      secondary: '#38bdf8',
      accent: '#c084fc',
      background: '#111827',
      surface: '#1f2937',
      text: '#f9fafb',
      textSecondary: '#d1d5db',
      border: '#374151',
      error: '#ef4444',
      warning: '#f59e0b',
      success: '#10b981'
    },
    css: `
      :root {
        --color-primary: #22d3ee;
        --color-secondary: #38bdf8;
        --color-accent: #c084fc;
        --color-background: #111827;
        --color-surface: #1f2937;
        --color-text: #f9fafb;
        --color-text-secondary: #d1d5db;
        --color-border: #374151;
        --color-error: #ef4444;
        --color-warning: #f59e0b;
        --color-success: #10b981;
      }
    `
  }
]

export const getTheme = (name: string): Theme => {
  return themes.find(theme => theme.name === name) || themes[0]
}

export const applyTheme = (theme: Theme) => {
  // 创建或更新style标签
  let themeStyle = document.getElementById('theme-styles')
  if (!themeStyle) {
    themeStyle = document.createElement('style')
    themeStyle.id = 'theme-styles'
    document.head.appendChild(themeStyle)
  }
  themeStyle.textContent = theme.css

  // 设置data-theme属性
  document.documentElement.setAttribute('data-theme', theme.name)

  // 为暗色主题设置额外的class
  if (theme.name === 'dark') {
    document.documentElement.classList.add('dark')

    // 为暗色主题添加Vditor工具栏样式
    let vditorDarkStyle = document.getElementById('vditor-dark-styles')
    if (!vditorDarkStyle) {
      vditorDarkStyle = document.createElement('style')
      vditorDarkStyle.id = 'vditor-dark-styles'
      vditorDarkStyle.textContent = `
        .vditor-toolbar button,
        .vditor-toolbar span,
        .vditor-toolbar div {
          color: var(--color-text) !important;
        }
        .vditor-toolbar .vditor-tooltipped {
          color: var(--color-text) !important;
        }
        .vditor-toolbar .vditor-tooltipped::after {
          border-top-color: var(--color-text) !important;
        }
        .vditor-toolbar .vditor-tooltipped::before {
          border-top-color: var(--color-text) !important;
        }
      `
      document.head.appendChild(vditorDarkStyle)
    }
  } else {
    document.documentElement.classList.remove('dark')

    // 移除暗色主题的Vditor样式
    const vditorDarkStyle = document.getElementById('vditor-dark-styles')
    if (vditorDarkStyle) {
      vditorDarkStyle.remove()
    }
  }
}

export const saveThemePreference = (themeName: string) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('theme-preference', themeName)
  }
}

export const loadThemePreference = (): string => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem('theme-preference') || 'default'
  }
  return 'default'
}