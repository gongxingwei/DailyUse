import { test, expect } from '@playwright/test';

/**
 * E2E 测试：外观设置
 * 测试主题切换、语言切换等功能
 */

test.describe('Appearance Settings', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到设置页面
    await page.goto('/settings');

    // 等待页面加载完成
    await page.waitForLoadState('networkidle');

    // 点击外观设置 tab
    await page.getByRole('tab', { name: /外观|Appearance/i }).click();
  });

  test('should display appearance settings', async ({ page }) => {
    // 验证标题存在
    await expect(page.getByText(/外观设置|Appearance/i)).toBeVisible();

    // 验证主题选择器存在
    await expect(page.locator('text=主题')).toBeVisible();

    // 验证语言选择器存在
    await expect(page.locator('text=语言')).toBeVisible();
  });

  test('should switch theme', async ({ page }) => {
    // 查找主题选择下拉框
    const themeSelect = page
      .locator('select, [role="combobox"]')
      .filter({ hasText: /light|dark|auto/i })
      .first();

    // 切换到深色主题
    await themeSelect.click();
    await page.getByText('深色', { exact: false }).click();

    // 等待主题应用
    await page.waitForTimeout(500);

    // 验证主题已切换（检查 HTML 元素的 class 或 data 属性）
    const html = page.locator('html');
    const classList = await html.getAttribute('class');

    // 根据实际实现验证（可能是 class="dark" 或 data-theme="dark"）
    expect(classList).toMatch(/dark/i);
  });

  test('should save theme preference', async ({ page }) => {
    // 切换主题
    const themeSelect = page
      .locator('select, [role="combobox"]')
      .filter({ hasText: /light|dark|auto/i })
      .first();
    await themeSelect.click();
    await page.getByText('深色', { exact: false }).click();

    // 刷新页面
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 验证主题保持不变
    const html = page.locator('html');
    const classList = await html.getAttribute('class');
    expect(classList).toMatch(/dark/i);
  });

  test('should switch language', async ({ page }) => {
    // 查找语言选择下拉框
    const languageSelect = page
      .locator('select, [role="combobox"]')
      .filter({ hasText: /中文|English/i })
      .first();

    // 获取当前语言
    const currentText = await page.locator('h2, h3').first().textContent();

    // 切换语言
    await languageSelect.click();
    await page.getByText(/English|中文/).click();

    // 等待语言切换
    await page.waitForTimeout(500);

    // 验证页面文字已改变
    const newText = await page.locator('h2, h3').first().textContent();
    expect(newText).not.toBe(currentText);
  });

  test('should display color scheme options', async ({ page }) => {
    // 验证自动跟随系统选项
    await expect(page.locator('text=/自动|Auto/')).toBeVisible();

    // 验证浅色主题选项
    await expect(page.locator('text=/浅色|Light/')).toBeVisible();

    // 验证深色主题选项
    await expect(page.locator('text=/深色|Dark/')).toBeVisible();
  });

  test('should show success message after save', async ({ page }) => {
    // 修改设置
    const themeSelect = page
      .locator('select, [role="combobox"]')
      .filter({ hasText: /light|dark|auto/i })
      .first();
    await themeSelect.click();
    await page.getByText('深色', { exact: false }).click();

    // 查找并点击保存按钮（如果有）
    const saveButton = page.getByRole('button', { name: /保存|Save/i });
    if (await saveButton.isVisible()) {
      await saveButton.click();

      // 验证成功提示
      await expect(page.locator('text=/保存成功|Saved/i')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should handle auto-save mode', async ({ page }) => {
    // 如果启用了自动保存，更改应该立即生效
    const themeSelect = page
      .locator('select, [role="combobox"]')
      .filter({ hasText: /light|dark|auto/i })
      .first();

    // 切换主题
    await themeSelect.click();
    await page.getByText('浅色', { exact: false }).click();

    // 等待自动保存
    await page.waitForTimeout(1000);

    // 刷新页面验证
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 验证设置已保存
    const html = page.locator('html');
    const classList = await html.getAttribute('class');
    expect(classList).toMatch(/light/i);
  });
});
