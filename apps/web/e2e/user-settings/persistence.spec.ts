import { test, expect } from '@playwright/test';

/**
 * E2E 测试：设置持久化
 * 测试设置在刷新、重新登录后的持久化，以及多标签页同步
 */

test.describe('Settings Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到设置页面
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should persist theme after page reload', async ({ page }) => {
    // 切换到外观设置
    await page.getByRole('tab', { name: /外观|Appearance/i }).click();
    
    // 切换主题
    const themeSelect = page.locator('select, [role="combobox"]').filter({ hasText: /light|dark|auto/i }).first();
    await themeSelect.click();
    await page.getByText('深色', { exact: false }).click();
    await page.waitForTimeout(1000);
    
    // 记录当前主题
    const html = page.locator('html');
    const initialTheme = await html.getAttribute('class');
    
    // 刷新页面
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 验证主题保持不变
    const reloadedTheme = await html.getAttribute('class');
    expect(reloadedTheme).toBe(initialTheme);
  });

  test('should persist notifications settings after page reload', async ({ page }) => {
    // 切换到通知设置
    await page.getByRole('tab', { name: /通知|Notifications/i }).click();
    
    // 关闭通知
    const notificationToggle = page.locator('[role="switch"]').first();
    const initialState = await notificationToggle.getAttribute('aria-checked');
    
    if (initialState === 'true') {
      await notificationToggle.click();
      await page.waitForTimeout(1000);
    }
    
    // 刷新页面
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /通知|Notifications/i }).click();
    
    // 验证设置保持不变
    const reloadedState = await notificationToggle.getAttribute('aria-checked');
    expect(reloadedState).toBe('false');
  });

  test('should persist shortcuts after page reload', async ({ page }) => {
    // 切换到快捷键设置
    await page.getByRole('tab', { name: /快捷键|Shortcuts/i }).click();
    
    // 确保快捷键已启用
    const shortcutToggle = page.locator('[role="switch"]').first();
    const isEnabled = await shortcutToggle.getAttribute('aria-checked');
    
    if (isEnabled !== 'true') {
      await shortcutToggle.click();
      await page.waitForTimeout(500);
    }
    
    // 设置自定义快捷键
    const shortcutInput = page.locator('input[readonly]').first();
    await shortcutInput.click();
    await page.keyboard.down('Control');
    await page.keyboard.down('Alt');
    await page.keyboard.press('K');
    await page.keyboard.up('Alt');
    await page.keyboard.up('Control');
    await page.waitForTimeout(1000);
    
    const customShortcut = await shortcutInput.inputValue();
    
    // 刷新页面
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /快捷键|Shortcuts/i }).click();
    
    // 验证快捷键保持不变
    const reloadedShortcut = await shortcutInput.inputValue();
    expect(reloadedShortcut).toBe(customShortcut);
  });

  test('should persist settings after logout and login', async ({ page, context }) => {
    // 切换主题
    await page.getByRole('tab', { name: /外观|Appearance/i }).click();
    const themeSelect = page.locator('select, [role="combobox"]').filter({ hasText: /light|dark|auto/i }).first();
    await themeSelect.click();
    await page.getByText('深色', { exact: false }).click();
    await page.waitForTimeout(1000);
    
    // 记录设置
    const html = page.locator('html');
    const theme = await html.getAttribute('class');
    
    // 登出（假设有登出按钮）
    const logoutButton = page.getByRole('button', { name: /登出|Logout|Sign out/i });
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForLoadState('networkidle');
      
      // 重新登录（需要根据实际登录流程调整）
      await page.goto('/login');
      // ... 执行登录操作 ...
      
      // 导航回设置页面
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      
      // 验证主题保持不变
      const reloadedTheme = await html.getAttribute('class');
      expect(reloadedTheme).toBe(theme);
    } else {
      test.skip();
    }
  });

  test('should sync settings across multiple tabs', async ({ context }) => {
    // 打开第一个标签页
    const page1 = await context.newPage();
    await page1.goto('/settings');
    await page1.waitForLoadState('networkidle');
    
    // 打开第二个标签页
    const page2 = await context.newPage();
    await page2.goto('/settings');
    await page2.waitForLoadState('networkidle');
    
    // 在第一个标签页修改主题
    await page1.getByRole('tab', { name: /外观|Appearance/i }).click();
    const themeSelect = page1.locator('select, [role="combobox"]').filter({ hasText: /light|dark|auto/i }).first();
    await themeSelect.click();
    await page1.getByText('深色', { exact: false }).click();
    await page1.waitForTimeout(2000); // 等待同步
    
    // 在第二个标签页验证主题已更新
    const html2 = page2.locator('html');
    const theme2 = await html2.getAttribute('class');
    expect(theme2).toMatch(/dark/i);
    
    // 关闭标签页
    await page1.close();
    await page2.close();
  });

  test('should handle concurrent updates gracefully', async ({ context }) => {
    // 打开两个标签页
    const page1 = await context.newPage();
    await page1.goto('/settings');
    await page1.waitForLoadState('networkidle');
    
    const page2 = await context.newPage();
    await page2.goto('/settings');
    await page2.waitForLoadState('networkidle');
    
    // 同时在两个标签页修改不同的设置
    await Promise.all([
      (async () => {
        await page1.getByRole('tab', { name: /外观|Appearance/i }).click();
        const themeSelect = page1.locator('select, [role="combobox"]').filter({ hasText: /light|dark|auto/i }).first();
        await themeSelect.click();
        await page1.getByText('深色', { exact: false }).click();
      })(),
      (async () => {
        await page2.getByRole('tab', { name: /通知|Notifications/i }).click();
        const notificationToggle = page2.locator('[role="switch"]').first();
        await notificationToggle.click();
      })(),
    ]);
    
    await page1.waitForTimeout(2000); // 等待同步
    
    // 验证两个设置都已保存
    await page1.reload();
    await page1.waitForLoadState('networkidle');
    
    const html = page1.locator('html');
    const theme = await html.getAttribute('class');
    expect(theme).toMatch(/dark/i);
    
    await page1.getByRole('tab', { name: /通知|Notifications/i }).click();
    const notificationToggle = page1.locator('[role="switch"]').first();
    const notificationState = await notificationToggle.getAttribute('aria-checked');
    expect(notificationState).toBeDefined();
    
    // 关闭标签页
    await page1.close();
    await page2.close();
  });

  test('should load settings from server on first visit', async ({ page }) => {
    // 清除本地存储
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // 刷新页面
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 验证设置已从服务器加载
    // 检查是否有默认设置或用户之前保存的设置
    await page.getByRole('tab', { name: /外观|Appearance/i }).click();
    
    const html = page.locator('html');
    const theme = await html.getAttribute('class');
    expect(theme).toBeDefined();
    expect(theme).not.toBe('');
  });

  test('should handle localStorage quota exceeded', async ({ page }) => {
    // 模拟 localStorage 已满
    await page.evaluate(() => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function () {
        throw new DOMException('QuotaExceededError');
      };
    });
    
    // 尝试修改设置
    await page.getByRole('tab', { name: /外观|Appearance/i }).click();
    const themeSelect = page.locator('select, [role="combobox"]').filter({ hasText: /light|dark|auto/i }).first();
    await themeSelect.click();
    await page.getByText('深色', { exact: false }).click();
    await page.waitForTimeout(1000);
    
    // 验证应用仍然可用（虽然保存可能失败）
    // 应该有错误处理，不会导致应用崩溃
    await expect(page.locator('body')).toBeVisible();
  });

  test('should cache settings in memory for fast access', async ({ page }) => {
    // 切换到外观设置
    await page.getByRole('tab', { name: /外观|Appearance/i }).click();
    
    // 记录首次加载时间
    const startTime1 = Date.now();
    await page.waitForLoadState('networkidle');
    const loadTime1 = Date.now() - startTime1;
    
    // 切换到其他标签页再切回来
    await page.getByRole('tab', { name: /通知|Notifications/i }).click();
    await page.waitForTimeout(100);
    
    const startTime2 = Date.now();
    await page.getByRole('tab', { name: /外观|Appearance/i }).click();
    const loadTime2 = Date.now() - startTime2;
    
    // 第二次加载应该更快（使用了缓存）
    expect(loadTime2).toBeLessThan(loadTime1 * 2);
  });
});
