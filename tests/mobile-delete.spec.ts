const { test, devices } = require('@playwright/test');

test.describe('移动端删除功能测试', () => {
  // 使用移动设备模拟
  test.use({ ...devices['iPhone 12'] });

  test('应该能够在移动端删除日记', async ({ page }) => {
    // 访问日记列表
    await page.goto('http://localhost:3009/diaries');
    await page.waitForLoadState('networkidle');

    // 查找第一个日记卡片
    const firstDiaryCard = page.locator('[data-testid="diary-card"]').first();
    await expect(firstDiaryCard).toBeVisible();

    // 点击删除按钮
    const deleteButton = firstDiaryCard.locator('[data-testid="delete-button"]');
    await deleteButton.click();

    // 验证自定义确认对话框出现
    const confirmDialog = page.locator('[data-testid="confirm-dialog"]');
    await expect(confirmDialog).toBeVisible();

    // 检查对话框内容
    await expect(page.locator('text=删除日记')).toBeVisible();
    await expect(page.locator('text=确定要删除这篇日记吗？')).toBeVisible();
    await expect(page.locator('button:has-text("确定")')).toBeVisible();
    await expect(page.locator('button:has-text("取消")')).toBeVisible();

    // 点击取消按钮
    await page.locator('button:has-text("取消")').click();
    await expect(confirmDialog).not.toBeVisible();

    // 再次点击删除按钮
    await deleteButton.click();
    await expect(confirmDialog).toBeVisible();

    // 点击确定按钮
    await page.locator('button:has-text("确定")').click();
    await expect(confirmDialog).not.toBeVisible();

    // 等待删除完成
    await page.waitForTimeout(1000);

    // 验证日记已被删除（列表中不再存在）
    await expect(firstDiaryCard).not.toBeVisible();
  });

  test('应该能够在日记详情页删除日记', async ({ page }) => {
    // 访问日记列表
    await page.goto('http://localhost:3009/diaries');
    await page.waitForLoadState('networkidle');

    // 点击第一个日记进入详情页
    const firstDiaryCard = page.locator('[data-testid="diary-card"]').first();
    await firstDiaryCard.click();

    // 等待详情页加载
    await page.waitForSelector('h1');
    await page.waitForLoadState('networkidle');

    // 点击删除按钮
    const deleteButton = page.locator('button:has-text("删除")');
    await deleteButton.click();

    // 验证自定义确认对话框出现
    const confirmDialog = page.locator('[data-testid="confirm-dialog"]');
    await expect(confirmDialog).toBeVisible();

    // 检查对话框内容
    await expect(page.locator('text=删除日记')).toBeVisible();
    await expect(page.locator('text=确定要删除这篇日记吗？此操作不可恢复。')).toBeVisible();

    // 点击取消按钮
    await page.locator('button:has-text("取消")').click();
    await expect(confirmDialog).not.toBeVisible();

    // 再次点击删除按钮
    await deleteButton.click();
    await expect(confirmDialog).toBeVisible();

    // 点击确定按钮
    await page.locator('button:has-text("确定")').click();
    await expect(confirmDialog).not.toBeVisible();

    // 等待跳转到日记列表页
    await page.waitForURL('**/diaries');
    await expect(page.locator('text=日记列表')).toBeVisible();
  });

  test('应该支持触摸操作', async ({ page }) => {
    // 访问日记列表
    await page.goto('http://localhost:3009/diaries');
    await page.waitForLoadState('networkidle');

    // 查找第一个日记卡片
    const firstDiaryCard = page.locator('[data-testid="diary-card"]').first();
    await expect(firstDiaryCard).toBeVisible();

    // 使用触摸点击删除按钮
    const deleteButton = firstDiaryCard.locator('[data-testid="delete-button"]');
    await deleteButton.tap();

    // 验证自定义确认对话框出现
    const confirmDialog = page.locator('[data-testid="confirm-dialog"]');
    await expect(confirmDialog).toBeVisible();

    // 使用触摸点击取消按钮
    await page.locator('button:has-text("取消")').tap();
    await expect(confirmDialog).not.toBeVisible();
  });
});