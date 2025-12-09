/**
 * Markdown 和 HTML 转换工具
 * 用于 TipTap 编辑器
 */


// 简单的 Markdown 到 HTML 转换器
export function markdownToHtml(markdown: string): string {
  if (!markdown) return ''

  // 分割成段落
  const paragraphs = markdown.split(/\n\n+/)
  const htmlParagraphs = paragraphs.map(paragraph => {
    if (!paragraph) return ''

    let html = paragraph

    // 处理标题 - 必须在行首
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>')
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>')
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>')
    html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>')
    html = html.replace(/^##### (.*$)/gm, '<h5>$1</h5>')
    html = html.replace(/^###### (.*$)/gm, '<h6>$1</h6>')

    // 如果已经是标题，跳过其他处理
    if (html.match(/^<h[1-6]>/)) return html

    // 处理分割线
    if (html.trim() === '---') {
      return '<hr>'
    }

    // 处理代码块
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')

    // 处理内联代码（避免处理代码块中的反引号）
    if (!html.includes('<pre>')) {
      html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
    }

    // 处理粗体（避免处理已经处理过的）
    html = html.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')

    // 处理斜体（避免处理粗体）
    html = html.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>')

    // 处理删除线
    html = html.replace(/~~([^~]+)~~/g, '<s>$1</s>')

    // 处理链接
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

    // 处理图片
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')

    // 处理引用
    if (html.startsWith('> ')) {
      const lines = html.split('\n')
      const quoteLines = lines.map(line => line.startsWith('> ') ? line.substring(2) : line)
      return `<blockquote><p>${quoteLines.join('<br>')}</p></blockquote>`
    }

    // 处理无序列表
    const listItems = html.match(/^\* (.+)$/gm)
    if (listItems && listItems.length > 0) {
      const lis = listItems.map(item => `<li>${item.substring(2)}</li>`).join('')
      return `<ul>${lis}</ul>`
    }

    // 处理有序列表
    const orderedListItems = html.match(/^\d+\. (.+)$/gm)
    if (orderedListItems && orderedListItems.length > 0) {
      // 获取第一个列表项的序号
      const firstItemMatch = orderedListItems[0].match(/^(\d+)\. /)
      const startIndex = firstItemMatch ? parseInt(firstItemMatch[1]) : 1

      const lis = orderedListItems.map(item => {
        const match = item.match(/^\d+\. (.+)$/)
        return match ? `<li>${match[1]}</li>` : ''
      }).join('')

      // 如果起始序号不是1，添加start属性
      if (startIndex !== 1) {
        return `<ol start="${startIndex}">${lis}</ol>`
      }
      return `<ol>${lis}</ol>`
    }

    // 如果不是特殊格式，包装成段落
    if (!html.startsWith('<') && html.trim()) {
      return `<p>${html.replace(/\n/g, '<br>')}</p>`
    }

    return html
  })

  // 过滤空段落
  return htmlParagraphs.filter(p => p && p.trim()).join('\n')
}

// HTML 到 Markdown 转换器（专为TipTap优化）
export function htmlToMarkdown(html: string): string {
  if (!html) return ''

  let markdown = html

  // 处理标题
  markdown = markdown.replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n')
  markdown = markdown.replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n')
  markdown = markdown.replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n')
  markdown = markdown.replace(/<h4>(.*?)<\/h4>/g, '#### $1\n\n')
  markdown = markdown.replace(/<h5>(.*?)<\/h5>/g, '##### $1\n\n')
  markdown = markdown.replace(/<h6>(.*?)<\/h6>/g, '###### $1\n\n')

  // 处理粗体
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**')

  // 处理斜体
  markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*')

  // 处理删除线
  markdown = markdown.replace(/<s>(.*?)<\/s>/g, '~~$1~~')

  // 处理代码块
  markdown = markdown.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (match, code) => {
    // 清理代码内的HTML实体
    const cleanCode = code
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
    return '```\n' + cleanCode + '\n```\n'
  })

  // 处理内联代码
  markdown = markdown.replace(/<code>(.*?)<\/code>/g, '`$1`')

  // 处理链接
  markdown = markdown.replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)')

  // 处理有序列表 - TipTap会为每个li创建单独的ol标签
  // 需要收集所有的ol标签并按序号排序
  const processOrderedLists = (html: string) => {
    // 收集所有有序列表项，包含它们的序号信息
    const listItems: { number: number; content: string }[] = []
    let tempHtml = html

    // 查找所有ol标签
    let olMatch
    const olRegex = /<ol[^>]*start\s*=\s["']?(\d+)["']?[^>]*>([\s\S]*?)<\/ol>/g
    while ((olMatch = olRegex.exec(tempHtml)) !== null) {
      const startNumber = parseInt(olMatch[1])
      const olContent = olMatch[2]

      // 提取ol内的li内容
      const liMatch = olContent.match(/<li>([\s\S]*?)<\/li>/)
      if (liMatch) {
        let liContent = liMatch[1]

        // 处理li内的p标签和其他内容
        liContent = liContent
          .replace(/<\/p><p>/g, '\n') // 段落间换行
          .replace(/<p[^>]*>/g, '')   // 移除p开始标签
          .replace(/<\/p>/g, '')      // 移除p结束标签
          .replace(/<[^>]*>/g, '')    // 移除其他标签
          .replace(/&nbsp;/g, ' ')   // 处理空格
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim()

        // 将多个空格和换行符合并为单个空格
        liContent = liContent.replace(/\s+/g, ' ')

        if (liContent) {
          listItems.push({
            number: startNumber,
            content: liContent
          })
        }
      }
    }

    // 如果找到列表项，将它们排序并转换为markdown
    if (listItems.length > 0) {
      // 按序号排序
      listItems.sort((a, b) => a.number - b.number)

      // 转换为markdown
      let markdown = ''
      listItems.forEach(item => {
        markdown += `${item.number}. ${item.content}\n`
      })

      // 移除原始的ol标签
      markdown = html.replace(/<ol[^>]*>[\s\S]*?<\/ol>/g, '')

      // 将markdown插入到原位置
      return markdown
    }

    return html
  }

  // 处理有序列表
  markdown = processOrderedLists(markdown)

  // 处理图片 - TipTap使用src属性而不是src=
  markdown = markdown.replace(/<img src="(.*?)" alt="(.*?)">/g, '![$2]($1)')

  // 处理无序列表
  markdown = markdown.replace(/<ul>([\s\S]*?)<\/ul>/g, (match, content) => {
    // 分割每个li项
    const liItems = content.split(/<\/li>/)
    let result = ''

    liItems.forEach((item: string) => {
      if (item.includes('<li')) {
        // 提取li标签内的所有内容
        const liMatch = item.match(/<li[^>]*>([\s\S]*)/)
        if (liMatch) {
          let liContent = liMatch[1]

          // 移除所有HTML标签，但保留文本内容
          liContent = liContent
            .replace(/<p>/g, '')
            .replace(/<\/p>/g, '\n')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .trim()

          // 将多个换行符替换为单个空格
          liContent = liContent.replace(/\n+/g, ' ')

          if (liContent) {
            result += `* ${liContent}\n`
          }
        }
      }
    })

    return result
  })

  // 处理引用
  markdown = markdown.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (match, content) => {
    // 移除引用内的段落标签
    const quoteContent = content
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '')
      .replace(/<br \/>/g, '\n> ')
      .replace(/\n+$/, '')
      .trim()

    return quoteContent.split('\n').map((line: string) => '> ' + line).join('\n') + '\n\n'
  })

  // 处理分割线
  markdown = markdown.replace(/<hr>/g, '---\n\n')

  // 处理换行
  markdown = markdown.replace(/<br \/>/g, '\n')
  markdown = markdown.replace(/<br>/g, '\n')

  // 处理段落
  markdown = markdown.replace(/<p>([\s\S]*?)<\/p>/g, '$1\n\n')

  // 处理多个空格
  markdown = markdown.replace(/  +/g, ' ')

  // 清理多余的空行
  markdown = markdown.replace(/\n{3,}/g, '\n\n')

  // 移除开头和结尾的空行
  markdown = markdown.replace(/^\n+|\n+$/g, '')

  return markdown
}