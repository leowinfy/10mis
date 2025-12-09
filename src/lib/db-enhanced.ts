import fs from 'fs'
import path from 'path'
import { Diary } from '@/types/diary'

// 数据文件路径
const DATA_DIR = path.join(process.cwd(), 'data', 'db')
const DIARIES_FILE = path.join(DATA_DIR, 'diaries.json')

// 确保数据目录存在
function ensureDataDir(): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      console.log(`创建数据目录: ${DATA_DIR}`)
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }

    if (!fs.existsSync(DIARIES_FILE)) {
      console.log(`创建数据库文件: ${DIARIES_FILE}`)
      fs.writeFileSync(DIARIES_FILE, '[]', 'utf8')
    }

    // 检查文件权限
    fs.accessSync(DIARIES_FILE, fs.constants.W_OK)

    return true
  } catch (error) {
    console.error('数据目录初始化失败:', error)
    console.error('错误详情:', {
      dataDir: DATA_DIR,
      diariesFile: DIARIES_FILE,
      cwd: process.cwd(),
      uid: typeof process.getuid === 'function' ? process.getuid() : 'unknown',
      gid: typeof process.getgid === 'function' ? process.getgid() : 'unknown'
    })
    return false
  }
}

// 读取所有日记
function readDiaries(): Diary[] {
  if (!ensureDataDir()) {
    return []
  }

  try {
    const data = fs.readFileSync(DIARIES_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('读取日记文件失败:', error)
    console.error('文件路径:', DIARIES_FILE)

    // 尝试修复损坏的文件
    try {
      fs.writeFileSync(DIARIES_FILE, '[]', 'utf8')
      console.log('已创建新的数据库文件')
      return []
    } catch (fixError) {
      console.error('修复数据库文件失败:', fixError)
    }

    return []
  }
}

// 保存所有日记
function saveDiaries(diaries: Diary[]): boolean {
  if (!ensureDataDir()) {
    throw new Error('无法创建或访问数据目录')
  }

  try {
    const jsonData = JSON.stringify(diaries, null, 2)
    fs.writeFileSync(DIARIES_FILE, jsonData, 'utf8')
    console.log(`成功保存 ${diaries.length} 条日记`)
    return true
  } catch (error) {
    console.error('保存日记文件失败:', error)
    console.error('错误详情:', {
      diariesCount: diaries.length,
      filePath: DIARIES_FILE,
      errorMessage: error instanceof Error ? error.message : String(error)
    })
    throw new Error('保存数据失败: ' + (error instanceof Error ? error.message : String(error)))
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

    return saveDiaries(diaries)
  },

  // 删除日记
  deleteDiary: (id: number): boolean => {
    const diaries = readDiaries()
    const filteredDiaries = diaries.filter(diary => diary.id !== id)

    if (filteredDiaries.length === diaries.length) {
      return false
    }

    return saveDiaries(filteredDiaries)
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
  }
}