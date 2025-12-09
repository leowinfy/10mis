/**
 * Markdown内容清理工具
 * 用于修复MDX Editor中的常见问题
 */

/**
 * 激进清理Markdown内容 - 用于解决MDX Editor的转义和换行问题
 */
export function aggressiveClean(text: string): string {
  let cleaned = text

  // 1. 处理多余的换行符
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')  // 最多保留两个换行符

  // 2. 移除所有Markdown标记前的转义符
  cleaned = cleaned.replace(/\\(\*|`|_|#|\\|\[|\]|\(|\))/g, '$1')

  // 3. 修复特殊组合
  cleaned = cleaned.replace(/\\\*\\\*/g, '**')  // **bold**
  cleaned = cleaned.replace(/\\\*(.+?)\\\*/g, '*$1*')  // *italic*

  // 4. 移除行尾多余空格
  cleaned = cleaned.replace(/[ \t]+$/gm, '')

  // 5. 确保文档开头和结尾没有空行
  cleaned = cleaned.replace(/^\n+|\n+$/g, '')

  // 6. 修复粘贴时可能产生的特殊问题
  cleaned = cleaned.replace(/\u200B/g, '')  // 移除零宽空格
  cleaned = cleaned.replace(/\t/g, '  ')    // 将制表符转换为两个空格

  // 7. 修复连续的空格
  cleaned = cleaned.replace(/  +/g, ' ')

  // 8. 确保段落之间只有一个空行
  cleaned = cleaned.replace(/\n{2,}\n+/g, '\n\n')

  return cleaned
}

/**
 * 标准清理Markdown内容
 */
export function cleanMarkdown(text: string): string {
  return aggressiveClean(text)
}

/**
 * 清理粘贴的文本
 */
export function cleanPastedText(text: string): string {
  // 粘贴时进行更激进的清理
  return aggressiveClean(text)
}

/**
 * 实时输入清理 - 在用户输入时应用
 */
export function realTimeClean(text: string): string {
  // 实时清理需要更保守，避免影响用户的编辑体验
  let cleaned = text

  // 只处理明显的问题
  // 1. 防止过多的换行
  if (cleaned.includes('\n\n\n')) {
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
  }

  // 2. 修复明显的转义问题（仅当看起来像是错误转义时）
  // 例如：\*\*text\*\* 应该是 **text**
  cleaned = cleaned.replace(/\\\*\\\*(.+?)\\\*\\\*/g, '**$1**')

  return cleaned
}