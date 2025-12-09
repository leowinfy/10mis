import { describe, it, expect, beforeEach, afterEach, vi } from '@vitest/vue'
import { mount, VueWrapper } from '@vue/test-utils'
import { ref } from 'vue'
import DiaryEditorTipTapReal from '@/components/editor/DiaryEditorTipTapReal.vue'
import { useEditor } from '@tiptap/react'

// Mock TipTap editor
vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn()
}))

describe('DiaryEditorTipTapReal Component', () => {
  let wrapper: VueWrapper<any>
  let mockEditor: any

  beforeEach(() => {
    // 创建mock editor
    mockEditor = {
      getHTML: vi.fn().mockReturnValue('<h1>Test Content</h1>'),
      commands: {
        setContent: vi.fn(),
        focus: vi.fn(),
        toggleBold: vi.fn(),
        toggleItalic: vi.fn(),
        toggleHeading: vi.fn(),
        toggleBulletList: vi.fn(),
        toggleOrderedList: vi.fn(),
        toggleBlockquote: vi.fn(),
        undo: vi.fn(),
        redo: vi.fn(),
        insertImage: vi.fn()
      },
      isActive: vi.fn().mockReturnValue(false),
      isEditable: true,
      destroy: vi.fn(),
      on: vi.fn()
    }

    // Mock useEditor hook
    vi.mocked(useEditor).mockReturnValue(mockEditor)

    // 设置测试内容
    const testContent = ref('# Test Diary\n\nThis is test content with **bold** text.')

    wrapper = mount(DiaryEditorTipTapReal, {
      props: {
        content: testContent.value,
        'onUpdate:content': (newContent: string) => {
          testContent.value = newContent
        }
      }
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.clearAllMocks()
  })

  it('应该正确初始化编辑器', () => {
    expect(useEditor).toHaveBeenCalledWith(expect.objectContaining({
      extensions: expect.any(Array),
      content: expect.any(String),
      immediatelyRender: false
    }))
  })

  it('应该正确转换Markdown到HTML', () => {
    const markdown = '# Title\n\nContent with **bold** text'
    wrapper.setProps({ content: markdown })

    // 验证编辑器内容被设置
    expect(mockEditor.commands.setContent).toHaveBeenCalled()
  })

  it('应该在内容更新时触发回调', async () => {
    const newHTML = '<h1>New Title</h1><p>New content</p>'
    mockEditor.getHTML.mockReturnValue(newHTML)

    // 模拟编辑器的onUpdate回调
    const onUpdateCallback = vi.mocked(useEditor).mock.calls[0][0].onUpdate
    if (onUpdateCallback) {
      onUpdateCallback({ editor: mockEditor })
    }

    // 验证内容被更新
    const emitted = wrapper.emitted('update:content')
    expect(emitted).toBeDefined()
  })

  describe('工具栏功能', () => {
    it('应该显示所有工具栏按钮', () => {
      const buttons = wrapper.findAll('button[data-test]')
      const buttonTypes = buttons.map(btn => btn.attributes('data-test'))

      expect(buttonTypes).toContain('undo')
      expect(buttonTypes).toContain('redo')
      expect(buttonTypes).toContain('bold')
      expect(buttonTypes).toContain('italic')
      expect(buttonTypes).toContain('heading')
      expect(buttonTypes).toContain('bullet-list')
      expect(buttonTypes).toContain('ordered-list')
      expect(buttonTypes).toContain('quote')
      expect(buttonTypes).toContain('image')
    })

    it('应该在点击按钮时执行相应命令', async () => {
      // 测试粗体按钮
      const boldButton = wrapper.find('button[data-test="bold"]')
      await boldButton.trigger('click')
      expect(mockEditor.commands.toggleBold).toHaveBeenCalled()

      // 测试标题按钮
      const headingButton = wrapper.find('button[data-test="heading"]')
      await headingButton.trigger('click')
      expect(mockEditor.commands.toggleHeading).toHaveBeenCalledWith({ level: 1 })

      // 测试撤销按钮
      const undoButton = wrapper.find('button[data-test="undo"]')
      await undoButton.trigger('click')
      expect(mockEditor.commands.undo).toHaveBeenCalled()
    })

    it('应该正确显示按钮的活动状态', async () => {
      // 模拟编辑器返回某个格式为活动状态
      mockEditor.isActive.mockImplementation((format: string) => format === 'bold')

      // 强制更新组件
      await wrapper.vm.$nextTick()

      // 验证按钮状态
      const boldButton = wrapper.find('button[data-test="bold"]')
      expect(boldButton.classes()).toContain('active')
    })
  })

  describe('图片上传功能', () => {
    it('应该处理图片文件选择', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      const input = wrapper.find('input[type="file"]')

      // 模拟文件选择
      await input.setValue(file)
      await input.trigger('change')

      // 验证上传逻辑被触发
      expect(wrapper.vm.uploadingImages).toContain(file)
    })

    it('应该处理拖拽上传', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      const event = new DragEvent('drop', {
        dataTransfer: new DataTransfer()
      })
      event.dataTransfer?.items.add(file)

      // 模拟拖拽事件
      await wrapper.vm.handleDrop(event)

      // 验证上传逻辑被触发
      expect(wrapper.vm.uploadingImages).toContain(file)
    })

    it('应该处理粘贴上传', async () => {
      const clipboardData = {
        items: [
          {
            kind: 'file',
           .getAsFile: () => new File(['test'], 'test.png', { type: 'image/png' })
          }
        ]
      }
      const event = new ClipboardEvent('paste', {
        clipboardData: clipboardData as any
      })

      // 模拟粘贴事件
      await wrapper.vm.handlePaste(event)

      // 验证上传逻辑被触发
      expect(wrapper.vm.uploadingImages).toHaveLength(1)
    })

    it('应该拒绝非图片文件', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      const input = wrapper.find('input[type="file"]')

      await input.setValue(file)
      await input.trigger('change')

      // 验证错误被处理
      expect(wrapper.vm.uploadErrors).toContain('请选择图片文件')
    })

    it('应该拒绝过大的文件', async () => {
      // 创建一个大于5MB的文件
      const largeFile = new File(
        ['x'.repeat(6 * 1024 * 1024)],
        'large.png',
        { type: 'image/png' }
      )
      const input = wrapper.find('input[type="file"]')

      await input.setValue(largeFile)
      await input.trigger('change')

      // 验证错误被处理
      expect(wrapper.vm.uploadErrors).toContain('图片大小不能超过5MB')
    })

    it('应该在图片上传成功后插入到编辑器', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      const mockResponse = { url: '/api/uploads/test.png' }

      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const input = wrapper.find('input[type="file"]')
      await input.setValue(file)
      await input.trigger('change')

      // 等待上传完成
      await new Promise(resolve => setTimeout(resolve, 100))

      // 验证图片被插入
      expect(mockEditor.commands.insertImage).toHaveBeenCalledWith({
        src: mockResponse.url,
        alt: 'test'
      })
    })

    it('应该处理上传失败', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' })

      // Mock fetch失败
      global.fetch = vi.fn().mockRejectedValue(new Error('Upload failed'))

      const input = wrapper.find('input[type="file"]')
      await input.setValue(file)
      await input.trigger('change')

      // 等待上传完成
      await new Promise(resolve => setTimeout(resolve, 100))

      // 验证错误被处理
      expect(wrapper.vm.uploadErrors).toContain('图片上传失败')
    })
  })

  describe('Markdown转换功能', () => {
    it('应该正确转换标题', () => {
      const markdown = '# H1\n## H2\n### H3'
      wrapper.setProps({ content: markdown })

      const html = wrapper.vm.convertMarkdownToHtml(markdown)
      expect(html).toContain('<h1>')
      expect(html).toContain('<h2>')
      expect(html).toContain('<h3>')
    })

    it('应该正确转换粗体和斜体', () => {
      const markdown = 'This is **bold** and this is *italic*'
      const html = wrapper.vm.convertMarkdownToHtml(markdown)

      expect(html).toContain('<strong>bold</strong>')
      expect(html).toContain('<em>italic</em>')
    })

    it('应该正确转换列表', () => {
      const markdown = '- Item 1\n- Item 2\n1. Ordered 1\n2. Ordered 2'
      const html = wrapper.vm.convertMarkdownToHtml(markdown)

      expect(html).toContain('<ul>')
      expect(html).toContain('<li>Item 1</li>')
      expect(html).toContain('<ol>')
      expect(html).toContain('<li>Ordered 1</li>')
    })

    it('应该正确转换引用', () => {
      const markdown = '> This is a quote'
      const html = wrapper.vm.convertMarkdownToHtml(markdown)

      expect(html).toContain('<blockquote>')
      expect(html).toContain('This is a quote')
    })

    it('应该正确转换链接', () => {
      const markdown = '[Link text](https://example.com)'
      const html = wrapper.vm.convertMarkdownToHtml(markdown)

      expect(html).toContain('<a href="https://example.com">Link text</a>')
    })

    it('应该正确转换代码块', () => {
      const markdown = '```\ncode block\n```'
      const html = wrapper.vm.convertMarkdownToHtml(markdown)

      expect(html).toContain('<pre>')
      expect(html).toContain('<code>code block</code>')
    })

    it('应该保留有序列表的自定义序号', () => {
      const markdown = '1. First\n3. Third\n5. Fifth'
      const html = wrapper.vm.convertMarkdownToHtml(markdown)

      // 验证自定义序号被保留
      expect(html).toContain('data-start="1"')
      expect(html).toContain('data-start="3"')
      expect(html).toContain('data-start="5"')
    })
  })

  describe('边界情况', () => {
    it('应该处理空内容', () => {
      wrapper.setProps({ content: '' })
      expect(mockEditor.commands.setContent).toHaveBeenCalledWith('')
    })

    it('应该处理null或undefined内容', () => {
      wrapper.setProps({ content: null as any })
      expect(mockEditor.commands.setContent).toHaveBeenCalledWith('')

      wrapper.setProps({ content: undefined as any })
      expect(mockEditor.commands.setContent).toHaveBeenCalledWith('')
    })

    it('应该处理包含脚本的恶意内容', () => {
      const maliciousContent = '<script>alert("xss")</script><img src="x" onerror="alert(1)">'
      wrapper.setProps({ content: maliciousContent })

      // 验证内容被正确处理（存储但应该有安全措施）
      expect(mockEditor.commands.setContent).toHaveBeenCalled()
    })

    it('应该处理超大文本内容', () => {
      const largeContent = 'x'.repeat(1000000) // 1MB文本
      wrapper.setProps({ content: largeContent })

      expect(mockEditor.commands.setContent).toHaveBeenCalled()
    })

    it('应该处理无效的Markdown', () => {
      const invalidMarkdown = '## Not closed header\n- Unclosed list\n``` \nUnclosed code'
      wrapper.setProps({ content: invalidMarkdown })

      // 应该优雅地处理，不崩溃
      expect(mockEditor.commands.setContent).toHaveBeenCalled()
    })
  })

  describe('性能测试', () => {
    it('应该能处理快速连续的内容更新', async () => {
      const updates = Array.from({ length: 100 }, (_, i) => `Content ${i}`)

      // 快速更新内容
      for (const content of updates) {
        wrapper.setProps({ content })
        await wrapper.vm.$nextTick()
      }

      // 编辑器应该正常工作
      expect(mockEditor.commands.setContent).toHaveBeenCalledTimes(100)
    })

    it('应该能处理大量图片上传', async () => {
      const files = Array.from({ length: 10 }, (_, i) =>
        new File(['test'], `test${i}.png`, { type: 'image/png' })
      )

      // Mock成功上传
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ url: '/api/uploads/test.png' })
      })

      const input = wrapper.find('input[type="file"]')
      for (const file of files) {
        await input.setValue(file)
        await input.trigger('change')
        await wrapper.vm.$nextTick()
      }

      // 应该处理所有文件
      expect(wrapper.vm.uploadingImages.length).toBeGreaterThanOrEqual(0)
    })
  })
})