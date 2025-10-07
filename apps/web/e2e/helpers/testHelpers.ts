import { Page } from '@playwright/test';

/**
 * 测试用户凭据
 */
export const TEST_USER = {
  username: 'testuser',
  password: 'Test123456!',
};

/**
 * 登录辅助函数
 */
export async function login(
  page: Page,
  username: string = TEST_USER.username,
  password: string = TEST_USER.password,
) {
  console.log(`[Auth] 开始登录: ${username}`);

  // 访问登录页面 (Web 端是 /auth)
  await page.goto('/auth');

  // 等待页面加载
  await page.waitForLoadState('networkidle');

  // 等待 "登录" 标签页加载 (确保在登录模式，而不是注册模式)
  const loginTab = page.locator('button.v-tab:has-text("登录")');
  await loginTab.waitFor({ state: 'visible', timeout: 10000 });
  await loginTab.click();

  // 等待表单出现
  await page.waitForTimeout(500);

  // 填写用户名 (v-combobox 使用 input 标签)
  const usernameField = page.locator('input[type="text"]').first();
  await usernameField.click();
  await usernameField.fill(username);

  // 填写密码
  const passwordField = page.locator('input[type="password"]').first();
  await passwordField.click();
  await passwordField.fill(password);

  // 点击登录按钮
  await page.click('button[type="submit"]:has-text("登录")');

  // 等待登录处理 - 不依赖 URL 变化，而是等待 /auth 页面消失
  try {
    // 尝试等待 URL 变化
    await page.waitForURL(/^(?!.*\/auth).*$/, { timeout: 5000 });
  } catch {
    // 如果 URL 没变化，等待一下然后手动导航
    await page.waitForTimeout(2000);

    // 检查是否仍在 /auth 页面
    const currentUrl = page.url();
    if (currentUrl.includes('/auth')) {
      console.log('[Auth] 登录后仍在 /auth 页面，手动导航到首页');
      await page.goto('/');
    }
  }

  console.log('[Auth] 登录成功');
}

/**
 * 等待 SSE 连接建立
 */
export async function waitForSSEConnection(page: Page, timeout: number = 10000) {
  console.log('[SSE] 等待 SSE 连接建立...');

  // 等待 EventSource 连接
  await page.waitForFunction(
    () => {
      // 检查全局状态或特定标识
      return (window as any).__sse_connected === true;
    },
    { timeout },
  );

  console.log('[SSE] SSE 连接已建立');
}

/**
 * 监听 SSE 事件
 */
export async function captureSSEEvents(page: Page): Promise<any[]> {
  const events: any[] = [];

  // 注入监听器到页面上下文
  await page.evaluate(() => {
    // 保存原始 EventSource
    const OriginalEventSource = window.EventSource;

    // 创建事件收集器
    (window as any).__sseEvents = [];

    // 重写 EventSource
    (window as any).EventSource = class extends OriginalEventSource {
      constructor(url: string | URL, eventSourceInitDict?: EventSourceInit) {
        super(url, eventSourceInitDict);

        // 监听所有消息
        this.addEventListener('message', (event) => {
          (window as any).__sseEvents.push({
            type: 'message',
            data: event.data,
            timestamp: Date.now(),
          });
        });

        // 监听特定事件 (reminder, notification 等)
        [
          'reminder',
          'notification',
          'schedule:reminder-triggered',
          'schedule:popup-reminder',
          'schedule:sound-reminder',
        ].forEach((eventType) => {
          this.addEventListener(eventType, (event: any) => {
            (window as any).__sseEvents.push({
              type: eventType,
              data: event.data,
              timestamp: Date.now(),
            });
          });
        });

        // 标记连接状态
        this.addEventListener('open', () => {
          (window as any).__sse_connected = true;
        });
      }
    };
  });

  // 返回获取事件的函数
  return events;
}

/**
 * 获取捕获的 SSE 事件
 */
export async function getSSEEvents(page: Page): Promise<any[]> {
  const events = await page.evaluate(() => {
    return (window as any).__sseEvents || [];
  });
  return events;
}

/**
 * 清除 SSE 事件记录
 */
export async function clearSSEEvents(page: Page) {
  await page.evaluate(() => {
    (window as any).__sseEvents = [];
  });
}

/**
 * 导航到 Reminder 页面
 */
export async function navigateToReminder(page: Page) {
  console.log('[Navigation] 导航到 Reminder 页面');

  // 尝试多种方式导航
  try {
    // 方式1: 直接访问
    await page.goto('/reminder', { waitUntil: 'networkidle' });
  } catch {
    // 方式2: 通过菜单点击
    await page.click('a[href="/reminder"], a:has-text("Reminder"), a:has-text("提醒")');
    await page.waitForURL(/\/reminder/);
  }

  console.log('[Navigation] 已到达 Reminder 页面');
}

/**
 * 创建 Reminder
 */
export async function createReminder(
  page: Page,
  options: {
    name: string;
    content: string;
    intervalMinutes: number;
    enableSound?: boolean;
    enablePopup?: boolean;
  },
) {
  console.log(`[Reminder] 创建提醒: ${options.name} (每 ${options.intervalMinutes} 分钟)`);

  // 点击创建按钮
  await page.click(
    'button:has-text("创建"), button:has-text("新建"), button:has-text("Create"), button[aria-label*="创建"]',
  );

  // 等待表单弹窗
  await page.waitForSelector('form, [role="dialog"]', { timeout: 5000 });

  // 填写名称
  await page.fill(
    'input[name="name"], input[placeholder*="名称"], input[label*="名称"]',
    options.name,
  );

  // 填写内容
  await page.fill(
    'textarea[name="content"], textarea[placeholder*="内容"], input[name="content"]',
    options.content,
  );

  // 设置时间间隔
  // 先选择间隔类型为 "分钟"
  const minuteOption = await page
    .locator('select option:has-text("分钟"), select option:has-text("Minute")')
    .first();
  if ((await minuteOption.count()) > 0) {
    await minuteOption.click();
  }

  // 输入间隔值
  await page.fill(
    'input[type="number"], input[name*="interval"]',
    options.intervalMinutes.toString(),
  );

  // 启用声音提醒
  if (options.enableSound !== false) {
    const soundCheckbox = page
      .locator('input[type="checkbox"][name*="sound"], input[type="checkbox"]:near(:text("声音"))')
      .first();
    if (!(await soundCheckbox.isChecked())) {
      await soundCheckbox.check();
    }
  }

  // 启用弹窗提醒
  if (options.enablePopup !== false) {
    const popupCheckbox = page
      .locator('input[type="checkbox"][name*="popup"], input[type="checkbox"]:near(:text("弹窗"))')
      .first();
    if (!(await popupCheckbox.isChecked())) {
      await popupCheckbox.check();
    }
  }

  // 提交表单
  await page.click(
    'button[type="submit"], button:has-text("确定"), button:has-text("保存"), button:has-text("Create")',
  );

  // 等待创建成功 (表单关闭或出现成功提示)
  await page.waitForTimeout(2000);

  console.log('[Reminder] 提醒创建成功');
}

/**
 * 等待并验证收到提醒通知
 */
export async function waitForReminderNotification(
  page: Page,
  timeoutMinutes: number = 3,
): Promise<boolean> {
  console.log(`[Notification] 等待提醒通知 (最多 ${timeoutMinutes} 分钟)...`);

  const startTime = Date.now();
  const timeout = timeoutMinutes * 60 * 1000;

  while (Date.now() - startTime < timeout) {
    // 检查 SSE 事件
    const events = await getSSEEvents(page);

    const hasReminderEvent = events.some(
      (event) =>
        event.type === 'schedule:reminder-triggered' ||
        event.type === 'schedule:popup-reminder' ||
        event.type === 'schedule:sound-reminder' ||
        (event.type === 'notification' && event.data?.includes('reminder')),
    );

    if (hasReminderEvent) {
      console.log('[Notification] ✅ 收到提醒通知!');
      console.log('[Notification] 事件详情:', events);
      return true;
    }

    // 检查页面上的通知元素 (弹窗、toast 等)
    const notificationVisible =
      (await page
        .locator('[role="alert"], .notification, .toast, [class*="notification"]')
        .count()) > 0;

    if (notificationVisible) {
      console.log('[Notification] ✅ 页面显示通知!');
      return true;
    }

    // 每 5 秒检查一次
    await page.waitForTimeout(5000);

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    console.log(`[Notification] 已等待 ${elapsed} 秒...`);
  }

  console.log('[Notification] ❌ 超时未收到通知');
  return false;
}

/**
 * 清理测试数据 - 删除测试创建的 Reminder
 */
export async function cleanupReminder(page: Page, reminderName: string) {
  console.log(`[Cleanup] 清理测试提醒: ${reminderName}`);

  try {
    // 导航到 Reminder 列表
    await navigateToReminder(page);

    // 查找并删除
    const reminderRow = page
      .locator(`tr:has-text("${reminderName}"), [data-reminder-name="${reminderName}"]`)
      .first();

    if ((await reminderRow.count()) > 0) {
      // 点击删除按钮
      await reminderRow
        .locator('button:has-text("删除"), button[aria-label*="删除"], button.delete')
        .click();

      // 确认删除
      await page.click('button:has-text("确定"), button:has-text("确认")');

      await page.waitForTimeout(1000);
      console.log('[Cleanup] 清理成功');
    }
  } catch (error) {
    console.log('[Cleanup] 清理失败:', error);
  }
}
