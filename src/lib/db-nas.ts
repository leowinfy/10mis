import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import { Diary } from '@/types/diary'

// 数据文件路径
const DATA_DIR = path.join(process.cwd(), 'data', 'db')
const DIARIES_FILE = path.join(DATA_DIR, 'diaries.json')
const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads')

// 异步权限修复函数
async function fixPermissions(): Promise<void> {
  try {
    console.log('尝试修复权限...')

    // 修复数据目录权限
    await fsPromises.mkdir(DATA_DIR, { recursive: true })
    await fsPromises.chmod(DATA_DIR, 0o777)

    // 修复上传目录权限
    await fsPromises.mkdir(UPLOAD_DIR, { recursive: true })
    await fsPromises.chmod(UPLOAD_DIR, 0o777)

    // 创建或修复数据库文件
    try {
      await fsPromises.access(DIARIES_FILE)
    } catch {
      // 文件不存在，创建新文件
      await fsPromises.writeFile(DIARIES_FILE, '[]', 'utf8')
    }

    // 修复数据库文件权限
    await fsPromises.chmod(DIARIES_FILE, 0o666)

    console.log('权限修复成功')
  } catch (error) {
    console.error('权限修复失败:', error)
    throw error
  }
}

// 确保数据目录存在（增强版）
async function ensureDataDirEnhanced(): Promise<boolean> {
  try {
    // 首先尝试正常访问
    if (fs.existsSync(DATA_DIR) && fs.existsSync(DIARIES_FILE)) {
      try {
        await fsPromises.access(DIARIES_FILE, fs.constants.W_OK)
        return true
      } catch (accessError) {
        console.log('文件权限问题，尝试修复...')
      }
    }

    // 尝试修复权限
    await fixPermissions()

    // 验证修复结果
    await fsPromises.access(DIARIES_FILE, fs.constants.W_OK)
    console.log('数据库文件可写')

    return true
  } catch (error) {
    console.error('数据目录初始化失败:', error)
    console.error('错误详情:', {
      dataDir: DATA_DIR,
      diariesFile: DIARIES_FILE,
      cwd: process.cwd(),
      uid: typeof process.getuid === 'function' ? process.getuid() : 'unknown',
      gid: typeof process.getgid === 'function' ? process.getgid() : 'unknown',
      errorMessage: error instanceof Error ? error.message : String(error)
    })

    // 不要抛出错误，让应用继续运行
    console.log('应用将在只读模式下运行，某些功能可能不可用')
    return false
  }
}

// 同步版本（兼容现有代码）
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

    // 尝试修复权限
    try {
      fs.accessSync(DIARIES_FILE, fs.constants.W_OK)
    } catch (accessError) {
      console.log('尝试修复文件权限...')
      try {
        fs.chmodSync(DIARIES_FILE, 0o666)
        fs.accessSync(DIARIES_FILE, fs.constants.W_OK)
        console.log('文件权限修复成功')
      } catch (chmodError) {
        console.warn('无法修复文件权限，可能需要手动处理')
      }
    }

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

// 读取所有日记（增强版）
async function readDiariesEnhanced(): Promise<Diary[]> {
  const hasPermission = await ensureDataDirEnhanced()

  if (!hasPermission) {
    console.warn('无法访问数据库文件，返回空列表')
    return []
  }

  try {
    const data = await fsPromises.readFile(DIARIES_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('读取日记文件失败:', error)
    console.error('文件路径:', DIARIES_FILE)

    // 尝试修复损坏的文件
    try {
      await fsPromises.writeFile(DIARIES_FILE, '[]', 'utf8')
      console.log('已创建新的数据库文件')
      return []
    } catch (fixError) {
      console.error('修复数据库文件失败:', fixError)
    }

    return []
  }
}

// 保存所有日记（增强版）
async function saveDiariesEnhanced(diaries: Diary[]): Promise<boolean> {
  const hasPermission = await ensureDataDirEnhanced()

  if (!hasPermission) {
    throw new Error('无法创建或访问数据目录')
  }

  try {
    const jsonData = JSON.stringify(diaries, null, 2)
    await fsPromises.writeFile(DIARIES_FILE, jsonData, 'utf8')
    console.log(`成功保存 ${diaries.length} 条日记`)
    return true
  } catch (error) {
    console.error('保存日记文件失败:', error)
    console.error('错误详情:', {
      diariesCount: diaries.length,
      filePath: DIARIES_FILE,
      errorMessage: error instanceof Error ? error.message : String(error)
    })

    // 尝试修复权限后重试
    try {
      console.log('尝试修复权限后重试...')
      await fixPermissions()
      const retryJsonData = JSON.stringify(diaries, null, 2)
      await fsPromises.writeFile(DIARIES_FILE, retryJsonData, 'utf8')
      console.log('重试成功')
      return true
    } catch (retryError) {
      console.error('重试失败:', retryError)
      throw new Error('保存数据失败: ' + (error instanceof Error ? error.message : String(error)))
    }
  }
}

// 同步读取函数（保持兼容性）
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

// 同步保存函数（保持兼容性）
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

// 数据库操作函数（异步版本）
export const dbOperationsEnhanced = {
  // 获取所有日记
  getAllDiaries: async (): Promise<Diary[]> => {
    const diaries = await readDiariesEnhanced()
    return diaries.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  },

  // 根据ID获取日记
  getDiaryById: async (id: number): Promise<Diary | undefined> => {
    const diaries = await readDiariesEnhanced()
    return diaries.find(diary => diary.id === id)
  },

  // 创建日记
  createDiary: async (title: string, content: string, images: string[] = [], created_at?: string): Promise<number> => {
    const diaries = await readDiariesEnhanced()
    const maxId = diaries.reduce((max, diary) => Math.max(max, diary.id), 0)
    const newDiary: Diary = {
      id: maxId + 1,
      title,
      content,
      images,
      created_at: created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    diaries.push(newDiary)
    await saveDiariesEnhanced(diaries)

    return newDiary.id
  },

  // 更新日记
  updateDiary: async (id: number, title?: string, content?: string, images?: string[], created_at?: string): Promise<boolean> => {
    const diaries = await readDiariesEnhanced()
    const index = diaries.findIndex(diary => diary.id === id)

    if (index === -1) {
      return false
    }

    if (title !== undefined) diaries[index].title = title
    if (content !== undefined) diaries[index].content = content
    if (images !== undefined) diaries[index].images = images
    if (created_at !== undefined) diaries[index].created_at = created_at
    diaries[index].updated_at = new Date().toISOString()

    return await saveDiariesEnhanced(diaries)
  },

  // 删除日记
  deleteDiary: async (id: number): Promise<boolean> => {
    const diaries = await readDiariesEnhanced()
    const filteredDiaries = diaries.filter(diary => diary.id !== id)

    if (filteredDiaries.length === diaries.length) {
      return false
    }

    return await saveDiariesEnhanced(filteredDiaries)
  },

  // 搜索日记
  searchDiaries: async (query: string): Promise<Diary[]> => {
    const diaries = await readDiariesEnhanced()
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

// 同步版本的generateId
function generateId(): number {
  const diaries = readDiaries()
  const maxId = diaries.reduce((max, diary) => Math.max(max, diary.id), 0)
  return maxId + 1
}

// 保持原有的同步版本导出（兼容性）
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

