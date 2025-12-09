const { test, expect } = require('@playwright/test');

test.describe('Vditor图片上传测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3009/diary/new');
  });

  test('应该能够通过拖拽上传图片', async ({ page }) => {
    // 等待编辑器加载
    await page.waitForSelector('.vditor-ir', { timeout: 10000 });

    // 获取编辑器内容区域
    const editorContent = await page.locator('.vditor-ir').first();

    // 模拟拖拽图片文件
    const fileInput = await page.locator('input[type="file"]');
    const filePath = 'tests/fixtures/test-image.jpg';

    // 创建一个测试图片文件（如果不存在）
    // 注意：确保 tests/fixtures/test-image.jpg 文件存在
    await fileInput.setInputFiles(filePath);

    // 等待上传完成
    await page.waitForTimeout(2000);

    // 检查是否插入了图片链接
    const content = await page.inputValue('textarea[placeholder*="写日记吧"]');
    expect(content).toContain('![');
    expect(content).toContain('test-image.jpg');
  });

  test('应该能够通过粘贴上传图片', async ({ page }) => {
    // 等待编辑器加载
    await page.waitForSelector('.vditor-ir', { timeout: 10000 });

    // 模拟粘贴图片
    await page.evaluate(() => {
      const clipboardData = new DataTransfer();
      const file = new File(['test'], 'test-image.png', { type: 'image/png' });
      clipboardData.items.add(file);

      const event = new ClipboardEvent('paste', {
        clipboardData: clipboardData,
        bubbles: true
      });

      document.querySelector('.vditor-ir')?.dispatchEvent(event);
    });

    // 等待上传完成
    await page.waitForTimeout(2000);

    // 检查是否插入了图片链接
    const content = await page.inputValue('textarea[placeholder*="写日记吧"]');
    expect(content).toContain('![');
  });

  test('应该显示上传失败的错误信息', async ({ page }) => {
    // 等待编辑器加载
    await page.waitForSelector('.vditor-ir', { timeout: 10000 });

    // 监听控制台错误
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });

    // 模拟上传非图片文件
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/test-file.txt');

    // 等待处理完成
    await page.waitForTimeout(1000);

    // 检查是否有错误信息
    const hasError = consoleMessages.some(msg =>
      msg.includes('没有选择文件') || msg.includes('不支持的文件类型')
    );
    expect(hasError).toBeTruthy();
  });
});