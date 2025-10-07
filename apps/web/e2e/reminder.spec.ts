import { test, expect } from '@playwright/test';
import {
  login,
  navigateToReminder,
  createReminder,
  captureSSEEvents,
  waitForReminderNotification,
  getSSEEvents,
  cleanupReminder,
  TEST_USER,
} from './helpers/testHelpers';

/**
 * Reminder E2E 测试套件
 *
 * 测试完整流程:
 * 1. 用户登录
 * 2. 导航到 Reminder 页面
 * 3. 创建一个每分钟触发的 Reminder
 * 4. 等待 3 分钟
 * 5. 验证收到提醒通知 (SSE 事件 + 页面通知)
 */
test.describe('Reminder E2E Flow', () => {
  const REMINDER_NAME = `E2E Test - ${Date.now()}`;
  const REMINDER_CONTENT = '这是一个自动化测试提醒，应该每分钟触发一次';

  test.beforeEach(async ({ page }) => {
    console.log('\n========================================');
    console.log('🚀 开始 E2E 测试');
    console.log('========================================\n');

    // 设置 SSE 事件捕获
    await captureSSEEvents(page);
  });

  test.afterEach(async ({ page }) => {
    console.log('\n========================================');
    console.log('🧹 清理测试数据');
    console.log('========================================\n');

    // 清理测试创建的 Reminder
    await cleanupReminder(page, REMINDER_NAME);
  });

  test('创建每分钟提醒并验证接收通知', async ({ page }) => {
    // ==================== Step 1: 登录 ====================
    test.setTimeout(5 * 60 * 1000); // 5 分钟超时

    console.log('\n📝 Step 1: 用户登录');
    await login(page, TEST_USER.username, TEST_USER.password);

    // 验证登录成功
    await expect(page).toHaveURL(/\/(home|dashboard|reminder)/);
    console.log('✅ 登录成功\n');

    // ==================== Step 2: 导航到 Reminder ====================
    console.log('📝 Step 2: 导航到 Reminder 页面');
    await navigateToReminder(page);

    // 验证页面加载
    await expect(page).toHaveURL(/\/reminder/);
    console.log('✅ 成功进入 Reminder 页面\n');

    // ==================== Step 3: 创建 Reminder ====================
    console.log('📝 Step 3: 创建每分钟提醒');

    // 截图：创建前
    await page.screenshot({ path: 'test-results/01-before-create.png', fullPage: true });

    await createReminder(page, {
      name: REMINDER_NAME,
      content: REMINDER_CONTENT,
      intervalMinutes: 1,
      enableSound: true,
      enablePopup: true,
    });

    // 截图：创建后
    await page.screenshot({ path: 'test-results/02-after-create.png', fullPage: true });

    // 验证 Reminder 出现在列表中
    const reminderExists = (await page.locator(`text=${REMINDER_NAME}`).count()) > 0;
    expect(reminderExists).toBe(true);
    console.log('✅ Reminder 创建成功并显示在列表中\n');

    // ==================== Step 4: 等待第一次触发 ====================
    console.log('📝 Step 4: 等待提醒触发 (最多 3 分钟)');
    console.log('⏰ 开始等待...');
    console.log('   - 预期第一次触发: ~1 分钟后');
    console.log('   - 预期第二次触发: ~2 分钟后');
    console.log('   - 最大等待时间: 3 分钟\n');

    const startTime = Date.now();

    // 等待通知
    const receivedNotification = await waitForReminderNotification(page, 3);

    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);

    // ==================== Step 5: 验证通知 ====================
    console.log('\n📝 Step 5: 验证通知接收');

    expect(receivedNotification).toBe(true);

    // 获取所有 SSE 事件
    const sseEvents = await getSSEEvents(page);
    console.log(`📡 捕获到 ${sseEvents.length} 个 SSE 事件:`);
    sseEvents.forEach((event, index) => {
      console.log(`   ${index + 1}. [${event.type}] at ${new Date(event.timestamp).toISOString()}`);
    });

    // 验证至少收到一个 reminder 相关事件
    const reminderEvents = sseEvents.filter(
      (e) =>
        e.type.includes('reminder') ||
        e.type.includes('notification') ||
        e.type === 'schedule:reminder-triggered' ||
        e.type === 'schedule:popup-reminder' ||
        e.type === 'schedule:sound-reminder',
    );

    expect(reminderEvents.length).toBeGreaterThan(0);

    // 截图：收到通知后
    await page.screenshot({ path: 'test-results/03-notification-received.png', fullPage: true });

    // ==================== 最终报告 ====================
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              ✅ E2E 测试完成                               ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║  Reminder 名称: ${REMINDER_NAME.padEnd(35)} ║`);
    console.log(`║  创建时间: ${new Date(startTime).toLocaleTimeString().padEnd(41)} ║`);
    console.log(
      `║  首次触发: ${elapsedTime}s 后${' '.repeat(43 - elapsedTime.toString().length)}║`,
    );
    console.log(
      `║  SSE 事件数: ${sseEvents.length}${' '.repeat(44 - sseEvents.length.toString().length)}║`,
    );
    console.log(
      `║  Reminder 事件: ${reminderEvents.length}${' '.repeat(41 - reminderEvents.length.toString().length)}║`,
    );
    console.log('╚════════════════════════════════════════════════════════════╝\n');
  });

  test('创建提醒后立即验证 SSE 连接', async ({ page }) => {
    console.log('\n📝 快速测试: 验证 SSE 连接建立');

    // 登录
    await login(page, TEST_USER.username, TEST_USER.password);

    // 导航到 Reminder
    await navigateToReminder(page);

    // 验证 SSE 连接状态
    const sseConnected = await page.evaluate(() => {
      return (window as any).__sse_connected === true;
    });

    // 如果未连接，等待最多 10 秒
    if (!sseConnected) {
      await page.waitForFunction(() => (window as any).__sse_connected === true, {
        timeout: 10000,
      });
    }

    console.log('✅ SSE 连接已建立');

    // 验证
    const finalState = await page.evaluate(() => (window as any).__sse_connected);
    expect(finalState).toBe(true);
  });
});
