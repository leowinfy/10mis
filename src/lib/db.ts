import fs from 'fs'
import path from 'path'
import { Diary } from '@/types/diary'

// 数据文件路径
const DATA_DIR = path.join(process.cwd(), 'data', 'db')
const DIARIES_FILE = path.join(DATA_DIR, 'diaries.json')

// 确保数据目录存在
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }

  if (!fs.existsSync(DIARIES_FILE)) {
    fs.writeFileSync(DIARIES_FILE, '[]', 'utf8')
  }
}

// 读取所有日记
function readDiaries(): Diary[] {
  ensureDataDir()
  try {
    const data = fs.readFileSync(DIARIES_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('读取日记文件失败:', error)
    return []
  }
}

// 保存所有日记
function saveDiaries(diaries: Diary[]): void {
  ensureDataDir()
  try {
    fs.writeFileSync(DIARIES_FILE, JSON.stringify(diaries, null, 2), 'utf8')
  } catch (error) {
    console.error('保存日记文件失败:', error)
    throw error
  }
}

// 生成唯一ID
function generateId(): number {
  const diaries = readDiaries()
  const maxId = diaries.reduce((max, diary) => Math.max(max, diary.id), 0)
  return maxId + 1
}

// 数据库操作函数
export const dbOperations = {
  // 获取所有日记
  getAllDiaries: (): Diary[] => {
    const diaries = readDiaries()
    return diaries.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  },

  // 根据ID获取日记
  getDiaryById: (id: number): Diary | undefined => {
    const diaries = readDiaries()
    return diaries.find(diary => diary.id === id)
  },

  // 创建日记
  createDiary: (title: string, content: string, images: string[] = [], created_at?: string): number => {
    const diaries = readDiaries()
    const newDiary: Diary = {
      id: generateId(),
      title,
      content,
      images,
      created_at: created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    diaries.push(newDiary)
    saveDiaries(diaries)

    return newDiary.id
  },

  // 更新日记
  updateDiary: (id: number, title?: string, content?: string, images?: string[], created_at?: string): boolean => {
    const diaries = readDiaries()
    const index = diaries.findIndex(diary => diary.id === id)

    if (index === -1) {
      return false
    }

    if (title !== undefined) diaries[index].title = title
    if (content !== undefined) diaries[index].content = content
    if (images !== undefined) diaries[index].images = images
    if (created_at !== undefined) diaries[index].created_at = created_at
    diaries[index].updated_at = new Date().toISOString()

    saveDiaries(diaries)
    return true
  },

  // 删除日记
  deleteDiary: (id: number): boolean => {
    const diaries = readDiaries()
    const filteredDiaries = diaries.filter(diary => diary.id !== id)

    if (filteredDiaries.length === diaries.length) {
      return false
    }

    saveDiaries(filteredDiaries)
    return true
  },

  // 搜索日记
  searchDiaries: (query: string): Diary[] => {
    const diaries = readDiaries()
    const searchTerm = query.toLowerCase()

    return diaries
      .filter(diary =>
        diary.title.toLowerCase().includes(searchTerm) ||
        diary.content.toLowerCase().includes(searchTerm)
      )
      .sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
  },
}

// 备份数据
export function backupData(): string {
  ensureDataDir()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = path.join(DATA_DIR, `backup-${timestamp}.json`)

  try {
    fs.copyFileSync(DIARIES_FILE, backupFile)
    return backupFile
  } catch (error) {
    console.error('备份数据失败:', error)
    throw error
  }
}

// 清理旧备份（保留最近30天）
export function cleanupOldBackups(): void {
  ensureDataDir()
  try {
    const files = fs.readdirSync(DATA_DIR)
    const backupFiles = files.filter(f => f.startsWith('backup-') && f.endsWith('.json'))

    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)

    backupFiles.forEach(file => {
      const filePath = path.join(DATA_DIR, file)
      const stats = fs.statSync(filePath)

      if (stats.mtime.getTime() < thirtyDaysAgo) {
        fs.unlinkSync(filePath)
      }
    })
  } catch (error) {
    console.error('清理旧备份失败:', error)
  }
}