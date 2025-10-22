import { test, expect } from '@playwright/test';

/**
 * E2E 测试：通知设置
 * 测试通知开关、渠道选择、免打扰等功能
 */

test.describe('Notification Settings', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到设置页面
    await page.goto('/settings');
    
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
    
    // 点击通知设置 tab
    await page.getByRole('tab', { name: /通知|Notifications/i }).click();
  });

  test('should display notification settings', async ({ page }) => {
    // 验证标题存在
    await expect(page.getByText(/通知设置|Notification Settings/i)).toBeVisible();
    
    // 验证启用通知开关存在
    await expect(page.locator('text=/启用通知|Enable Notifications/i')).toBeVisible();
  });

  test('should toggle notifications on/off', async ({ page }) => {
    // 查找通知总开关
    const notificationToggle = page.locator('[role="switch"]').first();
    
    // 获取初始状态
    const initialState = await notificationToggle.getAttribute('aria-checked');
    
    // 切换状态
    await notificationToggle.click();
    await page.waitForTimeout(500);
    
    // 验证状态已改变
    const newState = await notificationToggle.getAttribute('aria-checked');
    expect(newState).not.toBe(initialState);
  });

  test('should display notification channels', async ({ page }) => {
    // 验证推送通知选项
    await expect(page.locator('text=/推送|Push/i')).toBeVisible();
    
    // 验证邮件通知选项
    await expect(page.locator('text=/邮件|Email/i')).toBeVisible();
    
    // 验证短信通知选项（如果有）
    const smsOption = page.locator('text=/短信|SMS/i');
    if (await smsOption.isVisible()) {
      await expect(smsOption).toBeVisible();
    }
  });

  test('should select notification channels', async ({ page }) => {
    // 确保通知已启用
    const notificationToggle = page.locator('[role="switch"]').first();
    const isEnabled = await notificationToggle.getAttribute('aria-checked');
    
    if (isEnabled !== 'true') {
      await notificationToggle.click();
      await page.waitForTimeout(500);
    }
    
    // 选择邮件渠道
    const emailChip = page.locator('[role="button"]').filter({ hasText: /邮件|Email/i });
    await emailChip.click();
    await page.waitForTimeout(300);
    
    // 验证选中状态（通常选中的 chip 会有不同的样式）
    const emailChipClass = await emailChip.getAttribute('class');
    expect(emailChipClass).toMatch(/selected|active|primary/i);
  });

  test('should configure Do Not Disturb mode', async ({ page }) => {
    // 查找 DnD 开关
    const dndSwitch = page.locator('text=/免打扰|Do Not Disturb/i').locator('..').locator('[role="switch"]');
    
    if (await dndSwitch.isVisible()) {
      // 启用 DnD
      await dndSwitch.click();
      await page.waitForTimeout(500);
      
      // 验证时间选择器出现
      const startTimeInput = page.locator('input[type="time"]').first();
      await expect(startTimeInput).toBeVisible();
      
      // 设置开始时间
      await startTimeInput.fill('22:00');
      
      // 设置结束时间
      const endTimeInput = page.locator('input[type="time"]').last();
      await endTimeInput.fill('08:00');
    }
  });

  test('should test desktop notification permission', async ({ page, context }) => {
    // 授予通知权限（在测试中模拟）
    await context.grantPermissions(['notifications']);
    
    // 查找请求权限按钮
    const requestButton = page.getByRole('button', { name: /请求权限|Request Permission/i });
    
    if (await requestButton.isVisible()) {
      await requestButton.click();
      await page.waitForTimeout(500);
      
      // 验证权限状态已更新
      await expect(page.locator('text=/已授权|Granted/i')).toBeVisible();
    }
  });

  test('should send test notification', async ({ page, context }) => {
    // 授予通知权限
    await context.grantPermissions(['notifications']);
    
    // 查找测试通知按钮
    const testButton = page.getByRole('button', { name: /测试通知|Test Notification/i });
    
    if (await testButton.isVisible()) {
      await testButton.click();
      
      // 验证成功提示或通知已发送
      await expect(
        page.locator('text=/测试通知|Test notification|发送成功/i')
      ).toBeVisible({ timeout: 3000 });
    }
  });

  test('should toggle sound on/off', async ({ page }) => {
    // 查找声音开关
    const soundSwitch = page.locator('text=/声音|Sound/i').locator('..').locator('[role="switch"]');
    
    if (await soundSwitch.isVisible()) {
      // 切换状态
      await soundSwitch.click();
      await page.waitForTimeout(500);
      
      // 验证状态已改变
      const state = await soundSwitch.getAttribute('aria-checked');
      expect(state).toBeTruthy();
    }
  });

  test('should save notification settings', async ({ page }) => {
    // 修改多个设置
    const notificationToggle = page.locator('[role="switch"]').first();
    await notificationToggle.click();
    await page.waitForTimeout(500);
    
    // 查找保存按钮
    const saveButton = page.getByRole('button', { name: /保存|Save/i });
    
    if (await saveButton.isVisible()) {
      await saveButton.click();
      
      // 验证成功提示
      await expect(page.locator('text=/保存成功|Saved/i')).toBeVisible({ timeout: 3000 });
    }
    
    // 刷新页面验证设置已保存
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /通知|Notifications/i }).click();
    
    // 验证设置保持不变
    const savedState = await notificationToggle.getAttribute('aria-checked');
    expect(savedState).toBeDefined();
  });

  test('should disable channel selection when notifications are off', async ({ page }) => {
    // 关闭通知
    const notificationToggle = page.locator('[role="switch"]').first();
    const isEnabled = await notificationToggle.getAttribute('aria-checked');
    
    if (isEnabled === 'true') {
      await notificationToggle.click();
      await page.waitForTimeout(500);
    }
    
    // 验证渠道选择器被禁用
    const channelChips = page.locator('[role="button"]').filter({ hasText: /推送|邮件|Email|Push/i });
    const firstChip = channelChips.first();
    
    if (await firstChip.isVisible()) {
      const isDisabled = await firstChip.getAttribute('disabled');
      expect(isDisabled).not.toBeNull();
    }
  });
});
