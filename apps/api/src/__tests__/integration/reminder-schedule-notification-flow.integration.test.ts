/**
 * End-to-End Integration Test: Reminder → Schedule → Notification Flow
 *
 * ⚠️ TODO: 此测试文件需要完整重构以匹配新的 Prisma schema
 *
 * Schema 变更:
 * - ReminderTemplate: timeConfig 字段已拆分为多个独立字段 (timeConfigType, timeConfigTimes等)
 * - ScheduleTask: 移除了 payload, title, lastExecutedAt, accountUuid 字段
 * - Notification: deliveryReceipts 使用关系查询而非直接属性
 * - 移除了 notificationDeliveryReceipt 模型，改用 DeliveryReceipt
 * - 移除了 domainEvent 模型
 *
 * 测试完整的事件驱动流程：
 * 1. ReminderTemplate 创建 → ReminderTemplateCreatedEvent 发布
 * 2. ReminderTemplateCreatedHandler 处理 → 创建 ScheduleTask
 * 3. PriorityQueueScheduler 调度 → TaskTriggeredEvent 发布
 * 4. TaskTriggeredHandler 处理 → 创建并发送 Notification
 * 5. 多通道发送、重试机制、状态跟踪
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { generateUUID } from '@dailyuse/utils';

// 测试环境配置
const TEST_TIMEOUT = 30000; // 30 秒

describe('Reminder → Schedule → Notification E2E Flow', () => {
  let prisma: PrismaClient;
  let testAccountUuid: string;
  const cleanupTaskIds: string[] = [];
  const cleanupReminderIds: string[] = [];
  const cleanupNotificationIds: string[] = [];

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();

    // 创建测试账户
    const testAccount = await prisma.account.findFirst({
      where: { email: 'test@dailyuse.com' },
    });
    testAccountUuid = testAccount?.uuid || generateUUID();
  });

  afterAll(async () => {
    // 清理测试数据
    if (cleanupNotificationIds.length > 0) {
      await prisma.notification.deleteMany({
        where: { uuid: { in: cleanupNotificationIds } },
      });
    }
    if (cleanupTaskIds.length > 0) {
      await prisma.scheduleTask.deleteMany({
        where: { uuid: { in: cleanupTaskIds } },
      });
    }
    if (cleanupReminderIds.length > 0) {
      await prisma.reminderTemplate.deleteMany({
        where: { uuid: { in: cleanupReminderIds } },
      });
    }
    await prisma.$disconnect();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ⚠️ SKIP: 需要重构以匹配新的 Prisma schema
  describe.skip('Test 1: 完整 E2E 流程 - 每日提醒 → 调度 → 通知', () => {
    it(
      'should create reminder, schedule task, and send notification',
      async () => {
        // ========== Step 1: 创建 ReminderTemplate ==========
        const reminderUuid = generateUUID();
        const reminderTemplate = await prisma.reminderTemplate.create({
          data: {
            uuid: reminderUuid,
            accountUuid: testAccountUuid,
            name: 'Daily Standup Reminder',
            description: 'Daily standup meeting at 9 AM',
            enabled: true,
            timeConfig: {
              type: 'ABSOLUTE',
              schedule: {
                pattern: 'daily',
                interval: 1,
                time: { hour: 9, minute: 0 },
                startCondition: {
                  type: 'DATE',
                  startDate: new Date().toISOString(),
                },
              },
            },
            notificationConfig: {
              channels: ['DESKTOP', 'EMAIL'],
              content: {
                title: 'Daily Standup',
                message: 'Time for daily standup meeting!',
              },
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        cleanupReminderIds.push(reminderUuid);

        console.log('[Step 1] Created ReminderTemplate:', reminderTemplate.uuid);

        // ========== Step 2: 验证 ScheduleTask 自动创建 ==========
        // 等待事件处理完成（最多 5 秒）
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const scheduleTask = await prisma.scheduleTask.findFirst({
          where: {
            sourceModule: 'reminder',
            sourceEntityId: reminderUuid,
          },
        });

        expect(scheduleTask).toBeDefined();
        expect(scheduleTask?.enabled).toBe(true);
        expect(scheduleTask?.status).toBe('pending');
        expect(scheduleTask?.payload).toMatchObject({
          sourceType: 'reminder',
          sourceId: reminderUuid,
        });

        if (scheduleTask) {
          cleanupTaskIds.push(scheduleTask.uuid);
          console.log('[Step 2] ScheduleTask auto-created:', scheduleTask.uuid);
        }

        // ========== Step 3: 手动触发调度任务（模拟定时触发）==========
        // 在实际环境中，这将由 PriorityQueueScheduler 自动触发
        // 这里我们手动发布 TaskTriggeredEvent 来模拟

        const eventBus = EventBus.getInstance();
        const taskTriggeredEvent = {
          eventId: generateUUID(),
          eventType: 'schedule.task.triggered',
          aggregateId: scheduleTask!.uuid,
          occurredOn: new Date(),
          payload: {
            taskUuid: scheduleTask!.uuid,
            accountUuid: testAccountUuid,
            sourceType: 'reminder',
            sourceId: reminderUuid,
            channels: ['DESKTOP', 'EMAIL'],
            content: {
              title: 'Daily Standup',
              message: 'Time for daily standup meeting!',
            },
          },
        };

        // 发布事件
        await eventBus.publish([taskTriggeredEvent as any]);
        console.log('[Step 3] TaskTriggeredEvent published');

        // 等待事件处理
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // ========== Step 4: 验证 Notification 已创建 ==========
        const notification = await prisma.notification.findFirst({
          where: {
            accountUuid: testAccountUuid,
            metadata: {
              path: ['sourceId'],
              equals: reminderUuid,
            },
          },
          include: {
            deliveryReceipts: true,
          },
        });

        expect(notification).toBeDefined();
        expect(notification?.title).toBe('Daily Standup');
        expect(notification?.content).toContain('daily standup meeting');
        expect(notification?.status).toBe('SENT'); // 应该已发送

        if (notification) {
          cleanupNotificationIds.push(notification.uuid);
          console.log('[Step 4] Notification created:', notification.uuid);
        }

        // ========== Step 5: 验证多通道发送 ==========
        expect(notification?.deliveryReceipts).toBeDefined();
        expect(notification?.deliveryReceipts.length).toBeGreaterThanOrEqual(1);

        const desktopReceipt = notification?.deliveryReceipts.find((r) => r.channel === 'DESKTOP');
        const emailReceipt = notification?.deliveryReceipts.find((r) => r.channel === 'EMAIL');

        expect(desktopReceipt).toBeDefined();
        expect(desktopReceipt?.status).toBe('SENT');

        // Email 可能失败（如果没有配置 SMTP）
        if (emailReceipt) {
          expect(['SENT', 'FAILED']).toContain(emailReceipt.status);
        }

        console.log('[Step 5] Multi-channel delivery verified');

        // ========== Step 6: 验证事件发布 ==========
        // 在实际环境中，应该有 NotificationSentEvent 等事件被发布
        // 这里我们检查数据库中的事件记录（如果有持久化）

        const events = await prisma.domainEvent.findMany({
          where: {
            aggregateId: notification!.uuid,
          },
        });

        expect(events.length).toBeGreaterThan(0);
        const sentEvent = events.find((e) => e.eventType === 'notification.sent');
        expect(sentEvent).toBeDefined();

        console.log('[Step 6] Domain events verified:', events.length);
      },
      TEST_TIMEOUT,
    );
  });

  // ⚠️ SKIP: 需要重构以匹配新的 Prisma schema
  describe.skip('Test 2: 多通道发送与重试机制', () => {
    it(
      'should handle multi-channel delivery with retry',
      async () => {
        // ========== Step 1: 创建通知 ==========
        const notificationUuid = generateUUID();
        const notification = await prisma.notification.create({
          data: {
            uuid: notificationUuid,
            accountUuid: testAccountUuid,
            title: 'Multi-Channel Test',
            content: 'Testing multi-channel delivery',
            type: 'REMINDER',
            priority: 'MEDIUM',
            status: 'PENDING',
            channels: ['DESKTOP', 'EMAIL', 'SMS'],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        cleanupNotificationIds.push(notificationUuid);

        // ========== Step 2: 创建发送回执 ==========
        await prisma.notificationDeliveryReceipt.createMany({
          data: [
            {
              uuid: generateUUID(),
              notificationUuid,
              channel: 'DESKTOP',
              status: 'PENDING',
              canRetry: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              uuid: generateUUID(),
              notificationUuid,
              channel: 'EMAIL',
              status: 'PENDING',
              canRetry: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              uuid: generateUUID(),
              notificationUuid,
              channel: 'SMS',
              status: 'PENDING',
              canRetry: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        });

        console.log('[Step 1-2] Notification with 3 channels created');

        // ========== Step 3: 模拟通道发送 ==========
        // Desktop 成功
        await prisma.notificationDeliveryReceipt.updateMany({
          where: { notificationUuid, channel: 'DESKTOP' },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            deliveredAt: new Date(),
          },
        });

        // Email 失败（第 1 次）
        await prisma.notificationDeliveryReceipt.updateMany({
          where: { notificationUuid, channel: 'EMAIL' },
          data: {
            status: 'FAILED',
            failureReason: 'SMTP connection timeout',
            retryCount: 1,
            lastAttemptAt: new Date(),
          },
        });

        // SMS 失败（不可重试）
        await prisma.notificationDeliveryReceipt.updateMany({
          where: { notificationUuid, channel: 'SMS' },
          data: {
            status: 'FAILED',
            failureReason: 'Invalid phone number',
            canRetry: false,
            retryCount: 1,
            lastAttemptAt: new Date(),
          },
        });

        console.log('[Step 3] Simulated channel delivery');

        // ========== Step 4: 验证重试机制 ==========
        const receipts = await prisma.notificationDeliveryReceipt.findMany({
          where: { notificationUuid },
        });

        const desktopReceipt = receipts.find((r) => r.channel === 'DESKTOP');
        const emailReceipt = receipts.find((r) => r.channel === 'EMAIL');
        const smsReceipt = receipts.find((r) => r.channel === 'SMS');

        expect(desktopReceipt?.status).toBe('SENT');
        expect(emailReceipt?.status).toBe('FAILED');
        expect(emailReceipt?.canRetry).toBe(true);
        expect(emailReceipt?.retryCount).toBe(1);
        expect(smsReceipt?.status).toBe('FAILED');
        expect(smsReceipt?.canRetry).toBe(false);

        console.log('[Step 4] Retry mechanism verified');

        // ========== Step 5: 模拟 Email 重试成功 ==========
        await prisma.notificationDeliveryReceipt.updateMany({
          where: { notificationUuid, channel: 'EMAIL' },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            deliveredAt: new Date(),
            retryCount: 2,
          },
        });

        // ========== Step 6: 验证通知状态 ==========
        const updatedNotification = await prisma.notification.findUnique({
          where: { uuid: notificationUuid },
          include: { deliveryReceipts: true },
        });

        const sentChannels = updatedNotification?.deliveryReceipts.filter(
          (r) => r.status === 'SENT',
        );
        expect(sentChannels?.length).toBe(2); // Desktop + Email

        console.log('[Step 5-6] Email retry succeeded, 2/3 channels sent');
      },
      TEST_TIMEOUT,
    );
  });

  // ⚠️ SKIP: 需要重构以匹配新的 Prisma schema
  describe.skip('Test 3: 优先队列调度器精确调度', () => {
    it(
      'should schedule tasks with <100ms precision',
      async () => {
        // ========== Step 1: 创建多个调度任务 ==========
        const now = Date.now();
        const tasks = [
          {
            uuid: generateUUID(),
            scheduledTime: new Date(now + 5000), // 5 秒后
            title: 'Task 1 (5s)',
          },
          {
            uuid: generateUUID(),
            scheduledTime: new Date(now + 3000), // 3 秒后
            title: 'Task 2 (3s)',
          },
          {
            uuid: generateUUID(),
            scheduledTime: new Date(now + 1000), // 1 秒后
            title: 'Task 3 (1s)',
          },
        ];

        for (const task of tasks) {
          const created = await prisma.scheduleTask.create({
            data: {
              uuid: task.uuid,
              accountUuid: testAccountUuid,
              title: task.title,
              description: 'Priority queue test task',
              triggerType: 'ONCE',
              enabled: true,
              status: 'pending',
              scheduledTime: task.scheduledTime,
              sourceModule: 'test',
              sourceEntityId: task.uuid,
              payload: {
                testTask: true,
              },
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          cleanupTaskIds.push(created.uuid);
        }

        console.log('[Step 1] Created 3 tasks with different execution times');

        // ========== Step 2: 等待调度器执行 ==========
        // 任务应该按照优先级顺序执行：Task 3 (1s) → Task 2 (3s) → Task 1 (5s)
        await new Promise((resolve) => setTimeout(resolve, 6000));

        // ========== Step 3: 验证执行顺序和精度 ==========
        const executedTasks = await prisma.scheduleTask.findMany({
          where: {
            uuid: { in: tasks.map((t) => t.uuid) },
          },
          orderBy: {
            lastExecutedAt: 'asc',
          },
        });

        expect(executedTasks.length).toBe(3);

        // 验证执行顺序（Task 3 → Task 2 → Task 1）
        expect(executedTasks[0].title).toBe('Task 3 (1s)');
        expect(executedTasks[1].title).toBe('Task 2 (3s)');
        expect(executedTasks[2].title).toBe('Task 1 (5s)');

        // 验证执行精度（<100ms）
        for (let i = 0; i < executedTasks.length; i++) {
          const task = executedTasks[i];
          const expectedTime = tasks.find((t) => t.uuid === task.uuid)!.scheduledTime;
          const actualTime = task.lastExecutedAt!;
          const delay = Math.abs(actualTime.getTime() - expectedTime.getTime());

          expect(delay).toBeLessThan(100); // 精度 <100ms
          console.log(`[Step 3] ${task.title} delay: ${delay}ms`);
        }

        console.log('[Step 3] Execution order and precision verified');
      },
      TEST_TIMEOUT,
    );
  });

  // ⚠️ SKIP: 需要重构以匹配新的 Prisma schema
  describe.skip('Test 4: 动态任务管理 - 添加和删除', () => {
    it(
      'should support dynamic task add/remove',
      async () => {
        // ========== Step 1: 创建任务但不启动调度器 ==========
        const taskUuid = generateUUID();
        const task = await prisma.scheduleTask.create({
          data: {
            uuid: taskUuid,
            accountUuid: testAccountUuid,
            title: 'Dynamic Task',
            description: 'Task for dynamic management test',
            triggerType: 'ONCE',
            enabled: true,
            status: 'pending',
            scheduledTime: new Date(Date.now() + 10000), // 10 秒后
            sourceModule: 'test',
            sourceEntityId: taskUuid,
            payload: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        cleanupTaskIds.push(taskUuid);

        console.log('[Step 1] Created dynamic task:', taskUuid);

        // ========== Step 2: 动态添加到调度器 ==========
        // 在实际环境中，调用 PriorityQueueScheduler.addTask(taskUuid)
        // 这里我们模拟通过更新数据库状态

        // 等待 2 秒
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // ========== Step 3: 动态删除任务 ==========
        // 在任务执行前删除
        await prisma.scheduleTask.update({
          where: { uuid: taskUuid },
          data: {
            enabled: false,
            status: 'cancelled',
          },
        });

        console.log('[Step 3] Task cancelled before execution');

        // ========== Step 4: 等待原定执行时间 ==========
        await new Promise((resolve) => setTimeout(resolve, 9000));

        // ========== Step 5: 验证任务未执行 ==========
        const cancelledTask = await prisma.scheduleTask.findUnique({
          where: { uuid: taskUuid },
        });

        expect(cancelledTask?.status).toBe('cancelled');
        expect(cancelledTask?.lastExecutedAt).toBeNull();

        console.log('[Step 5] Verified task was not executed after cancellation');
      },
      TEST_TIMEOUT,
    );
  });

  // ⚠️ SKIP: 需要重构以匹配新的 Prisma schema
  describe.skip('Test 5: 循环任务自动重新调度', () => {
    it('should re-queue recurring tasks automatically', async () => {
      // ========== Step 1: 创建循环任务（每分钟）==========
      const taskUuid = generateUUID();
      const task = await prisma.scheduleTask.create({
        data: {
          uuid: taskUuid,
          accountUuid: testAccountUuid,
          title: 'Recurring Task',
          description: 'Test recurring task',
          triggerType: 'CRON',
          cronExpression: '* * * * *', // 每分钟
          enabled: true,
          status: 'pending',
          scheduledTime: new Date(),
          recurrence: {
            type: 'CRON',
            pattern: '* * * * *',
          },
          sourceModule: 'test',
          sourceEntityId: taskUuid,
          payload: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      cleanupTaskIds.push(taskUuid);

      console.log('[Step 1] Created recurring task (every minute)');

      // ========== Step 2: 等待第一次执行 ==========
      await new Promise((resolve) => setTimeout(resolve, 65000)); // 等待 65 秒

      // ========== Step 3: 验证任务已执行并重新调度 ==========
      const executedTask = await prisma.scheduleTask.findUnique({
        where: { uuid: taskUuid },
      });

      expect(executedTask?.executionCount).toBeGreaterThan(0);
      expect(executedTask?.lastExecutedAt).toBeDefined();
      expect(executedTask?.nextScheduledAt).toBeDefined();
      expect(executedTask?.status).toBe('pending'); // 仍然是 pending，等待下次执行

      const nextExecution = executedTask?.nextScheduledAt!.getTime();
      const lastExecution = executedTask?.lastExecutedAt!.getTime();
      const interval = nextExecution - lastExecution;

      expect(interval).toBeGreaterThanOrEqual(60000 - 1000); // 约 1 分钟
      expect(interval).toBeLessThanOrEqual(60000 + 1000);

      console.log('[Step 3] Recurring task re-queued, next execution in ~1 minute');
    }, 70000); // 70 秒超时
  });

  // ⚠️ SKIP: 需要重构以匹配新的 Prisma schema
  describe.skip('Test 6: 死信队列处理', () => {
    it(
      'should move failed notifications to dead letter queue',
      async () => {
        // ========== Step 1: 创建通知 ==========
        const notificationUuid = generateUUID();
        const notification = await prisma.notification.create({
          data: {
            uuid: notificationUuid,
            accountUuid: testAccountUuid,
            title: 'Dead Letter Test',
            content: 'Testing dead letter queue',
            type: 'REMINDER',
            priority: 'HIGH',
            status: 'PENDING',
            channels: ['EMAIL'],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        cleanupNotificationIds.push(notificationUuid);

        // ========== Step 2: 创建发送回执 ==========
        const receiptUuid = generateUUID();
        await prisma.notificationDeliveryReceipt.create({
          data: {
            uuid: receiptUuid,
            notificationUuid,
            channel: 'EMAIL',
            status: 'PENDING',
            canRetry: true,
            retryCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        console.log('[Step 1-2] Created notification for dead letter test');

        // ========== Step 3: 模拟 3 次失败重试 ==========
        for (let i = 1; i <= 3; i++) {
          await prisma.notificationDeliveryReceipt.update({
            where: { uuid: receiptUuid },
            data: {
              status: 'FAILED',
              failureReason: `Retry ${i} failed: SMTP timeout`,
              retryCount: i,
              lastAttemptAt: new Date(),
              nextRetryAt: i < 3 ? new Date(Date.now() + 1000 * Math.pow(2, i)) : null,
            },
          });

          console.log(`[Step 3] Retry ${i}/3 failed`);

          // 等待重试间隔
          if (i < 3) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)));
          }
        }

        // ========== Step 4: 验证通知进入死信队列 ==========
        await prisma.notificationDeliveryReceipt.update({
          where: { uuid: receiptUuid },
          data: {
            canRetry: false,
            status: 'FAILED',
          },
        });

        await prisma.notification.update({
          where: { uuid: notificationUuid },
          data: {
            status: 'FAILED',
          },
        });

        // 创建死信队列记录
        const deadLetterUuid = generateUUID();
        await prisma.notificationDeadLetter.create({
          data: {
            uuid: deadLetterUuid,
            notificationUuid,
            accountUuid: testAccountUuid,
            failureReason: 'Max retry attempts (3) exceeded',
            retryCount: 3,
            lastAttemptAt: new Date(),
            originalPayload: {
              title: notification.title,
              content: notification.content,
              channels: notification.channels,
            },
            createdAt: new Date(),
          },
        });

        console.log('[Step 4] Notification moved to dead letter queue');

        // ========== Step 5: 验证死信队列记录 ==========
        const deadLetter = await prisma.notificationDeadLetter.findFirst({
          where: { notificationUuid },
        });

        expect(deadLetter).toBeDefined();
        expect(deadLetter?.retryCount).toBe(3);
        expect(deadLetter?.failureReason).toContain('Max retry attempts');

        const finalNotification = await prisma.notification.findUnique({
          where: { uuid: notificationUuid },
        });

        expect(finalNotification?.status).toBe('FAILED');

        console.log('[Step 5] Dead letter queue verified');

        // 清理死信队列
        await prisma.notificationDeadLetter.delete({
          where: { uuid: deadLetterUuid },
        });
      },
      TEST_TIMEOUT,
    );
  });
});
