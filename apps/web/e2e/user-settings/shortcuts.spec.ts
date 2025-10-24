import { test, expect } from '@playwright/test';

/**
 * E2E 测试：快捷键设置
 * 测试快捷键录制、冲突检测、恢复默认等功能
 */

test.describe('Shortcut Settings', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到设置页面
    await page.goto('/settings');

    // 等待页面加载完成
    await page.waitForLoadState('networkidle');

    // 点击快捷键设置 tab
    await page.getByRole('tab', { name: /快捷键|Shortcuts/i }).click();
  });

  test('should display shortcut settings', async ({ page }) => {
    // 验证标题存在
    await expect(page.getByText(/快捷键设置|Shortcut Settings/i)).toBeVisible();

    // 验证启用快捷键开关存在
    await expect(page.locator('text=/启用快捷键|Enable Shortcuts/i')).toBeVisible();
  });

  test('should toggle shortcuts on/off', async ({ page }) => {
    // 查找快捷键总开关
    const shortcutToggle = page.locator('[role="switch"]').first();

    // 获取初始状态
    const initialState = await shortcutToggle.getAttribute('aria-checked');

    // 切换状态
    await shortcutToggle.click();
    await page.waitForTimeout(500);

    // 验证状态已改变
    const newState = await shortcutToggle.getAttribute('aria-checked');
    expect(newState).not.toBe(initialState);

    // 验证快捷键列表显示/隐藏
    const shortcutList = page.locator('text=/新建任务|New Task|NEW_TASK/i');
    const isVisible = await shortcutList.isVisible();

    if (newState === 'true') {
      expect(isVisible).toBeTruthy();
    }
  });

  test('should display predefined shortcuts', async ({ page }) => {
    // 确保快捷键已启用
    const shortcutToggle = page.locator('[role="switch"]').first();
    const isEnabled = await shortcutToggle.getAttribute('aria-checked');

    if (isEnabled !== 'true') {
      await shortcutToggle.click();
      await page.waitForTimeout(500);
    }

    // 验证预定义快捷键存在
    await expect(page.locator('text=/新建任务|New Task/i')).toBeVisible();
    await expect(page.locator('text=/全局搜索|Global Search|Search/i')).toBeVisible();
    await expect(page.locator('text=/保存|Save/i')).toBeVisible();
  });

  test('should record new shortcut', async ({ page }) => {
    // 确保快捷键已启用
    const shortcutToggle = page.locator('[role="switch"]').first();
    const isEnabled = await shortcutToggle.getAttribute('aria-checked');

    if (isEnabled !== 'true') {
      await shortcutToggle.click();
      await page.waitForTimeout(500);
    }

    // 找到第一个快捷键输入框
    const shortcutInput = page.locator('input[readonly]').first();

    // 聚焦输入框
    await shortcutInput.click();
    await page.waitForTimeout(200);

    // 模拟按键（Ctrl+Shift+N）
    await page.keyboard.down('Control');
    await page.keyboard.down('Shift');
    await page.keyboard.press('N');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Control');

    // 等待按键被记录
    await page.waitForTimeout(500);

    // 验证快捷键已更新
    const value = await shortcutInput.inputValue();
    expect(value).toMatch(/Ctrl.*Shift.*N|⌃.*⇧.*N/i);
  });

  test('should search shortcuts', async ({ page }) => {
    // 确保快捷键已启用
    const shortcutToggle = page.locator('[role="switch"]').first();
    const isEnabled = await shortcutToggle.getAttribute('aria-checked');

    if (isEnabled !== 'true') {
      await shortcutToggle.click();
      await page.waitForTimeout(500);
    }

    // 找到搜索框
    const searchInput = page.getByPlaceholder(/搜索快捷键|Search shortcuts/i);

    if (await searchInput.isVisible()) {
      // 搜索 "任务"
      await searchInput.fill('任务');
      await page.waitForTimeout(300);

      // 验证只显示匹配的快捷键
      await expect(page.locator('text=/新建任务|New Task/i')).toBeVisible();

      // 验证不匹配的快捷键被隐藏
      const searchResults = await page.locator('[role="list"] li, .v-list-item').count();
      expect(searchResults).toBeLessThan(10); // 假设总共有10个以上的快捷键
    }
  });

  test('should detect shortcut conflicts', async ({ page }) => {
    // 确保快捷键已启用
    const shortcutToggle = page.locator('[role="switch"]').first();
    const isEnabled = await shortcutToggle.getAttribute('aria-checked');

    if (isEnabled !== 'true') {
      await shortcutToggle.click();
      await page.waitForTimeout(500);
    }

    // 设置第一个快捷键
    const firstInput = page.locator('input[readonly]').nth(0);
    await firstInput.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('T');
    await page.keyboard.up('Control');
    await page.waitForTimeout(500);

    // 为第二个快捷键设置相同的组合（制造冲突）
    const secondInput = page.locator('input[readonly]').nth(1);
    await secondInput.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('T');
    await page.keyboard.up('Control');
    await page.waitForTimeout(500);

    // 验证冲突提示出现
    const conflictIndicator = page.locator('text=/冲突|Conflict/i');
    await expect(conflictIndicator).toBeVisible({ timeout: 2000 });
  });

  test('should clear shortcut', async ({ page }) => {
    // 确保快捷键已启用
    const shortcutToggle = page.locator('[role="switch"]').first();
    const isEnabled = await shortcutToggle.getAttribute('aria-checked');

    if (isEnabled !== 'true') {
      await shortcutToggle.click();
      await page.waitForTimeout(500);
    }

    // 找到第一个快捷键输入框
    const shortcutInput = page.locator('input[readonly]').first();

    // 设置一个快捷键
    await shortcutInput.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('X');
    await page.keyboard.up('Control');
    await page.waitForTimeout(500);

    // 点击清除按钮
    const clearButton = shortcutInput
      .locator('..')
      .getByRole('button', { name: /清除|Clear|close/i })
      .first();
    await clearButton.click();
    await page.waitForTimeout(500);

    // 验证快捷键已清除
    const value = await shortcutInput.inputValue();
    expect(value).toBe('');
  });

  test('should restore individual shortcut to default', async ({ page }) => {
    // 确保快捷键已启用
    const shortcutToggle = page.locator('[role="switch"]').first();
    const isEnabled = await shortcutToggle.getAttribute('aria-checked');

    if (isEnabled !== 'true') {
      await shortcutToggle.click();
      await page.waitForTimeout(500);
    }

    // 找到第一个快捷键输入框
    const shortcutInput = page.locator('input[readonly]').first();
    const originalValue = await shortcutInput.inputValue();

    // 修改快捷键
    await shortcutInput.click();
    await page.keyboard.down('Control');
    await page.keyboard.down('Alt');
    await page.keyboard.press('X');
    await page.keyboard.up('Alt');
    await page.keyboard.up('Control');
    await page.waitForTimeout(500);

    // 点击恢复默认按钮
    const restoreButton = shortcutInput
      .locator('..')
      .getByRole('button', { name: /恢复默认|Restore|restore/i })
      .first();

    if (await restoreButton.isVisible()) {
      await restoreButton.click();
      await page.waitForTimeout(500);

      // 验证已恢复默认值
      const restoredValue = await shortcutInput.inputValue();
      expect(restoredValue).toBe(originalValue);
    }
  });

  test('should restore all shortcuts to defaults', async ({ page }) => {
    // 确保快捷键已启用
    const shortcutToggle = page.locator('[role="switch"]').first();
    const isEnabled = await shortcutToggle.getAttribute('aria-checked');

    if (isEnabled !== 'true') {
      await shortcutToggle.click();
      await page.waitForTimeout(500);
    }

    // 修改多个快捷键
    const firstInput = page.locator('input[readonly]').nth(0);
    await firstInput.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('Q');
    await page.keyboard.up('Control');
    await page.waitForTimeout(300);

    const secondInput = page.locator('input[readonly]').nth(1);
    await secondInput.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('W');
    await page.keyboard.up('Control');
    await page.waitForTimeout(300);

    // 点击恢复所有默认按钮
    const restoreAllButton = page.getByRole('button', { name: /恢复默认|Restore Defaults/i });
    await restoreAllButton.click();
    await page.waitForTimeout(1000);

    // 验证快捷键已恢复默认（检查第一个输入框）
    const restoredValue = await firstInput.inputValue();
    expect(restoredValue).toMatch(/Ctrl.*N|⌃.*N/i); // 假设默认是 Ctrl+N
  });

  test('should save shortcut changes', async ({ page }) => {
    // 确保快捷键已启用
    const shortcutToggle = page.locator('[role="switch"]').first();
    const isEnabled = await shortcutToggle.getAttribute('aria-checked');

    if (isEnabled !== 'true') {
      await shortcutToggle.click();
      await page.waitForTimeout(500);
    }

    // 修改一个快捷键
    const shortcutInput = page.locator('input[readonly]').first();
    await shortcutInput.click();
    await page.keyboard.down('Control');
    await page.keyboard.down('Alt');
    await page.keyboard.press('M');
    await page.keyboard.up('Alt');
    await page.keyboard.up('Control');
    await page.waitForTimeout(500);

    // 点击保存按钮
    const saveButton = page.getByRole('button', { name: /保存|Save/i });

    if ((await saveButton.isVisible()) && !(await saveButton.isDisabled())) {
      await saveButton.click();

      // 验证成功提示
      await expect(page.locator('text=/保存成功|Saved/i')).toBeVisible({ timeout: 3000 });
    }

    // 刷新页面验证设置已保存
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /快捷键|Shortcuts/i }).click();

    // 验证快捷键保持不变
    const savedValue = await shortcutInput.inputValue();
    expect(savedValue).toMatch(/Ctrl.*Alt.*M|⌃.*⌥.*M/i);
  });

  test('should display platform-specific key symbols on Mac', async ({ page, browserName }) => {
    // 只在 Mac 上测试符号显示
    if (process.platform !== 'darwin') {
      test.skip();
      return;
    }

    // 确保快捷键已启用
    const shortcutToggle = page.locator('[role="switch"]').first();
    const isEnabled = await shortcutToggle.getAttribute('aria-checked');

    if (isEnabled !== 'true') {
      await shortcutToggle.click();
      await page.waitForTimeout(500);
    }

    // 验证 Mac 符号存在
    const shortcutInput = page.locator('input[readonly]').first();
    const value = await shortcutInput.inputValue();

    // Mac 应该显示符号而不是文字
    expect(value).toMatch(/⌘|⌃|⌥|⇧/);
  });
});
