// 删除旧的编辑器文件
const fs = require('fs')
const path = require('path')

const editorFiles = [
  'src/components/editor/DiaryEditorTipTap.tsx',
  'src/components/editor/DiaryEditorTipTapReal.tsx',
  'src/components/editor/DiaryEditorMDX.tsx',
  'src/components/editor/DiaryEditorQuill.tsx',
  'src/lib/extensions/CustomOrderedList.ts'
]

console.log('🧹 清理旧的编辑器文件...\n')

editorFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file)
  if (fs.existsSync(filePath)) {
    try {
      // 备份到 old-editors 文件夹
      const backupDir = path.join(process.cwd(), 'old-editors')
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
      }

      const backupPath = path.join(backupDir, path.basename(file))
      fs.copyFileSync(filePath, backupPath)

      // 删除原文件
      fs.unlinkSync(filePath)
      console.log(`✅ 已移动 ${file} -> old-editors/${path.basename(file)}`)
    } catch (error) {
      console.log(`❌ 删除 ${file} 失败:`, error.message)
    }
  } else {
    console.log(`⚠️  ${file} 不存在`)
  }
})

console.log('\n✨ 清理完成！旧编辑器已备份到 old-editors 文件夹')