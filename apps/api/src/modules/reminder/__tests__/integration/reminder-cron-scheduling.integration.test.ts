import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { ReminderApplicationService } from '../../application/services/ReminderApplicationService';
import { ScheduleContainer } from '../../../schedule/infrastructure/di/ScheduleContainer';
import { ReminderContainer } from '../../infrastructure/di/ReminderContainer';
import { ReminderTemplate } from '@dailyuse/domain-server';
import { RecurringScheduleTask } from '@dailyuse/domain-core';
import { ScheduleContracts, ReminderContracts } from '@dailyuse/contracts';
import { generateUUID } from '@dailyuse/utils';

// 禁用 Prisma Mock 以使用真实数据库
vi.unmock('@prisma/client');
vi.unmock('../config/prisma');

/**
 * Reminder Cron Scheduling Integration Tests
 *
 * 测试提醒模板与 RecurringScheduleTask 的集成
 */
describe('Reminder Cron Scheduling Integration', () => {
  let prisma: PrismaClient;
  let reminderService: ReminderApplicationService;
  let scheduleContainer: ScheduleContainer;
  let reminderContainer: ReminderContainer;
  let testAccountUuid: string;
  let testGroupUuid: string;

  // 用于追踪异步事件处理的完成状态
  let lastEventPromise: Promise<void> = Promise.resolve();

  // 简单的事件发射器实现，自动同步到 Schedule 模块
  const simpleEventEmitter = {
    emit: (event: string, payload: any): boolean => {
      console.log(`[TestEventEmitter] 触发事件: ${event}`);

      if (event === 'ReminderTemplateCreated') {
        // 创建一个 Promise 来跟踪事件处理完成
        lastEventPromise = (async () => {
          try {
            const template = ReminderTemplate.fromDTO(payload.payload.template);

            if (!template.shouldCreateScheduleTask()) {
              console.log(`[跳过] 模板未启用: ${template.name}`);
              return;
            }

            const metadata = template.getScheduleTaskMetadata();

            // 检查是否是 ONCE 类型（ABSOLUTE with pattern: 'once'）
            const timeConfig = template.timeConfig;
            const isOnce =
              timeConfig.type === ('ABSOLUTE' as any) &&
              timeConfig.schedule?.pattern === ('once' as any);

            if (isOnce) {
              // ONCE 类型：创建一次性任务
              const scheduledTime = timeConfig.schedule?.endCondition?.endDate;
              if (!scheduledTime) {
                console.warn(`[警告] ONCE 类型缺少 scheduledTime: ${template.name}`);
                return;
              }

              console.log(`[调试] 准备创建 ONCE 任务，时间: ${scheduledTime}`);

              await scheduleContainer.recurringScheduleTaskDomainService.createTask({
                name: template.getScheduleTaskName(),
                description: template.description,
                triggerType: ScheduleContracts.TriggerType.ONCE,
                scheduledTime: new Date(scheduledTime),
                enabled: true,
                sourceModule: 'reminder',
                sourceEntityId: template.uuid,
                metadata: {
                  ...metadata,
                  accountUuid: payload.payload.accountUuid,
                },
              });

              console.log(`[✓] 已创建 ONCE 调度任务: ${template.name}, 时间: ${scheduledTime}`);
            } else {
              // CRON 类型：创建循环任务
              const cronExpression = template.toCronExpression();
              if (!cronExpression) {
                console.warn(`[警告] 无法生成 cron 表达式: ${template.name}`);
                return;
              }

              console.log(`[调试] 准备创建任务，cron: ${cronExpression}`);
              console.log(`[调试] scheduleContainer:`, !!scheduleContainer);
              console.log(
                `[调试] recurringScheduleTaskDomainService:`,
                !!scheduleContainer?.recurringScheduleTaskDomainService,
              );

              await scheduleContainer.recurringScheduleTaskDomainService.createTask({
                name: template.getScheduleTaskName(),
                description: template.description,
                triggerType: ScheduleContracts.TriggerType.CRON,
                cronExpression,
                enabled: true,
                sourceModule: 'reminder',
                sourceEntityId: template.uuid,
                metadata: {
                  ...metadata,
                  accountUuid: payload.payload.accountUuid,
                },
              });

              console.log(`[✓] 已创建调度任务: ${template.name}, cron: ${cronExpression}`);
            }
          } catch (error) {
            console.error(`[错误] 创建调度任务失败:`, error);
            throw error;
          }
        })();
      } else if (event === 'ReminderTemplateUpdated') {
        // 处理模板更新事件
        lastEventPromise = (async () => {
          try {
            const template = ReminderTemplate.fromDTO(payload.payload.template);

            // 查找现有的调度任务
            const existingTasks =
              await scheduleContainer.recurringScheduleTaskDomainService.findBySource(
                'reminder',
                template.uuid,
              );

            if (existingTasks.length === 0) {
              console.log(`[警告] 未找到关联的调度任务: ${template.name}`);
              return;
            }

            const taskUuid = existingTasks[0].uuid;

            if (!template.shouldCreateScheduleTask()) {
              // 如果模板被禁用，禁用调度任务
              await scheduleContainer.recurringScheduleTaskDomainService.updateTask(taskUuid, {
                enabled: false,
              });
              console.log(`[✓] 已禁用调度任务: ${template.name}`);
              return;
            }

            // 准备更新数据
            const metadata = template.getScheduleTaskMetadata();
            const updateData: any = {
              name: template.getScheduleTaskName(),
              description: template.description,
              enabled: template.enabled,
              metadata: {
                ...metadata,
                accountUuid: payload.payload.accountUuid,
              },
            };

            // 检查是否是 ONCE 类型
            const timeConfig = template.timeConfig;
            const isOnce =
              timeConfig.type === ('ABSOLUTE' as any) &&
              timeConfig.schedule?.pattern === ('once' as any);

            if (isOnce) {
              // ONCE 类型：更新 scheduledTime
              const scheduledTime = timeConfig.schedule?.endCondition?.endDate;
              if (scheduledTime) {
                updateData.scheduledTime = new Date(scheduledTime);
              }
            } else {
              // CRON 类型：更新 cron 表达式
              const cronExpression = template.toCronExpression();
              if (cronExpression) {
                updateData.cronExpression = cronExpression;
              }
            }

            await scheduleContainer.recurringScheduleTaskDomainService.updateTask(
              taskUuid,
              updateData,
            );

            console.log(
              `[✓] 已更新调度任务: ${template.name}${updateData.cronExpression ? `, cron: ${updateData.cronExpression}` : ''}`,
            );
          } catch (error) {
            console.error(`[错误] 更新调度任务失败:`, error);
            throw error;
          }
        })();
      } else if (event === 'ReminderTemplateDeleted') {
        // 处理模板删除事件
        lastEventPromise = (async () => {
          try {
            const templateUuid = payload.payload.templateUuid;

            // 查找并删除关联的调度任务
            const existingTasks =
              await scheduleContainer.recurringScheduleTaskDomainService.findBySource(
                'reminder',
                templateUuid,
              );

            for (const task of existingTasks) {
              await scheduleContainer.recurringScheduleTaskDomainService.deleteTask(task.uuid);
              console.log(`[✓] 已删除调度任务: ${task.name}`);
            }
          } catch (error) {
            console.error(`[错误] 删除调度任务失败:`, error);
            throw error;
          }
        })();
      }

      return true;
    },
  };

  beforeAll(async () => {
    // 设置正确的数据库 URL (必须在创建 PrismaClient 之前设置)
    process.env.DATABASE_URL =
      process.env.DATABASE_URL_TEST ||
      'postgresql://dailyuse:wordTo821AppS@@localhost:5432/dailyuse?schema=public';

    prisma = new PrismaClient();
    scheduleContainer = ScheduleContainer.getInstance(prisma);
    reminderContainer = ReminderContainer.getInstance();

    // 创建 ReminderApplicationService，注入 eventEmitter
    reminderService = new ReminderApplicationService(
      reminderContainer.getReminderTemplateAggregateRepository(),
      reminderContainer.getReminderTemplateGroupAggregateRepository(),
      simpleEventEmitter,
    );

    // 创建测试账户（Account 模块负责）
    testAccountUuid = generateUUID();
    await prisma.account.create({
      data: {
        uuid: testAccountUuid,
        username: 'test-cron-user',
        email: 'test-cron@example.com',
      },
    });

    // 创建认证凭证（Authentication 模块负责）
    await prisma.authCredential.create({
      data: {
        uuid: generateUUID(),
        accountUuid: testAccountUuid,
        passwordHash: 'dummy-hash-for-testing',
        passwordSalt: 'dummy-salt-for-testing',
        passwordAlgorithm: 'bcrypt',
        passwordCreatedAt: new Date(),
      },
    });

    // 创建测试分组
    testGroupUuid = generateUUID();
    await prisma.reminderTemplateGroup.create({
      data: {
        uuid: testGroupUuid,
        accountUuid: testAccountUuid,
        name: 'Test Cron Group',
        description: 'Integration test group',
      },
    });
  });

  afterAll(async () => {
    // 清理测试数据（按依赖顺序）
    await prisma.recurringScheduleTask.deleteMany({
      where: { sourceModule: 'reminder' },
    });
    await prisma.reminderTemplate.deleteMany({
      where: { accountUuid: testAccountUuid },
    });
    await prisma.reminderTemplateGroup.deleteMany({
      where: { uuid: testGroupUuid },
    });
    // 删除认证凭证（Authentication 模块）
    await prisma.authCredential.deleteMany({
      where: { accountUuid: testAccountUuid },
    });
    // 删除账户（Account 模块）
    await prisma.account.deleteMany({
      where: { uuid: testAccountUuid },
    });
    await prisma.$disconnect();
  });

  describe('Test 1: Daily Reminder with Cron', () => {
    it('should create a daily reminder at 9 AM', async () => {
      // 创建每日提醒
      const request: ReminderContracts.CreateReminderTemplateRequest = {
        uuid: generateUUID(),
        groupUuid: testGroupUuid,
        name: 'Daily Morning Reminder',
        message: 'Good morning! Start your day.',
        priority: 'NORMAL' as any,
        category: 'daily',
        tags: [],
        enabled: true,
        timeConfig: {
          type: 'daily' as any,
          times: ['09:00'], // 9:00 AM
        },
      };

      const template = await reminderService.createReminderTemplate(request, testAccountUuid);

      // 等待事件处理完成
      await lastEventPromise;

      expect(template).toBeDefined();
      expect(template.uuid).toBeDefined();
      expect(template.enabled).toBe(true);

      // 验证创建了 RecurringScheduleTask
      const scheduleTasks = await scheduleContainer.recurringScheduleTaskDomainService.findBySource(
        'reminder',
        template.uuid,
      );

      expect(scheduleTasks).toHaveLength(1);
      const task = scheduleTasks[0];
      expect(task.triggerType).toBe('cron');
      expect(task.cronExpression).toBe('0 0 9 * * *'); // Daily at 9:00 AM
      expect(task.enabled).toBe(true);
      expect(task.status).toBe('active');

      console.log('✅ Daily reminder created:', {
        templateUuid: template.uuid,
        cronExpression: task.cronExpression,
        nextRunAt: task.nextRunAt,
      });
    });
  });

  describe('Test 2: Weekly Reminder with Weekdays', () => {
    it('should create a weekly reminder on Monday, Wednesday, Friday', async () => {
      const request: ReminderContracts.CreateReminderTemplateRequest = {
        uuid: generateUUID(),
        groupUuid: testGroupUuid,
        name: 'Weekly Work Reminder',
        message: 'Check your weekly tasks',
        priority: 'HIGH' as any,
        category: 'work',
        tags: [],
        enabled: true,
        timeConfig: {
          type: 'weekly' as any,
          times: ['14:30'], // 2:30 PM
          weekdays: [1, 3, 5], // Monday, Wednesday, Friday
        },
      };

      const template = await reminderService.createReminderTemplate(request, testAccountUuid);

      // 等待事件处理完成
      await lastEventPromise;

      expect(template).toBeDefined();

      // 验证创建了 RecurringScheduleTask
      const scheduleTasks = await scheduleContainer.recurringScheduleTaskDomainService.findBySource(
        'reminder',
        template.uuid,
      );

      expect(scheduleTasks).toHaveLength(1);
      const task = scheduleTasks[0];
      expect(task.triggerType).toBe('cron');
      expect(task.cronExpression).toBe('0 30 14 * * 1,3,5'); // Mon, Wed, Fri at 2:30 PM
      expect(task.enabled).toBe(true);

      console.log('✅ Weekly reminder created:', {
        templateUuid: template.uuid,
        cronExpression: task.cronExpression,
        nextRunAt: task.nextRunAt,
      });
    });
  });

  describe('Test 3: Monthly Reminder with MonthDays', () => {
    it('should create a monthly reminder on 1st and 15th', async () => {
      const request: ReminderContracts.CreateReminderTemplateRequest = {
        uuid: generateUUID(),
        groupUuid: testGroupUuid,
        name: 'Monthly Payment Reminder',
        message: 'Pay your bills',
        priority: 'URGENT' as any,
        category: 'finance',
        tags: [],
        enabled: true,
        timeConfig: {
          type: 'monthly' as any,
          times: ['10:00'], // 10:00 AM
          monthDays: [1, 15], // 1st and 15th of each month
        },
      };

      const template = await reminderService.createReminderTemplate(request, testAccountUuid);

      // 等待事件处理完成
      await lastEventPromise;

      expect(template).toBeDefined();

      // 验证创建了 RecurringScheduleTask
      const scheduleTasks = await scheduleContainer.recurringScheduleTaskDomainService.findBySource(
        'reminder',
        template.uuid,
      );

      expect(scheduleTasks).toHaveLength(1);
      const task = scheduleTasks[0];
      expect(task.triggerType).toBe('cron');
      expect(task.cronExpression).toBe('0 0 10 1,15 * *'); // 1st and 15th at 10:00 AM
      expect(task.enabled).toBe(true);

      console.log('✅ Monthly reminder created:', {
        templateUuid: template.uuid,
        cronExpression: task.cronExpression,
        nextRunAt: task.nextRunAt,
      });
    });
  });

  describe('Test 4: Enable/Disable Reminder', () => {
    it('should enable and disable the reminder schedule', async () => {
      // 创建提醒
      const request: ReminderContracts.CreateReminderTemplateRequest = {
        uuid: generateUUID(),
        groupUuid: testGroupUuid,
        name: 'Toggle Test Reminder',
        message: 'Test enable/disable',
        priority: 'NORMAL' as any,
        category: 'test',
        tags: [],
        enabled: true,
        timeConfig: {
          type: 'daily' as any,
          times: ['08:00'],
        },
      };

      const template = await reminderService.createReminderTemplate(request, testAccountUuid);

      // 等待事件处理完成
      await lastEventPromise;

      // 禁用提醒
      await reminderService.updateReminderTemplate(
        template.uuid,
        { enabled: false },
        testAccountUuid,
      );

      // 等待事件处理完成
      await lastEventPromise;

      // 验证调度任务已禁用
      let scheduleTasks = await scheduleContainer.recurringScheduleTaskDomainService.findBySource(
        'reminder',
        template.uuid,
      );

      expect(scheduleTasks).toHaveLength(1);
      expect(scheduleTasks[0].enabled).toBe(false);
      expect(scheduleTasks[0].status).toBe('paused');

      // 重新启用提醒
      await reminderService.updateReminderTemplate(
        template.uuid,
        { enabled: true },
        testAccountUuid,
      );

      // 等待事件处理完成
      await lastEventPromise;

      // 验证调度任务已启用
      scheduleTasks = await scheduleContainer.recurringScheduleTaskDomainService.findBySource(
        'reminder',
        template.uuid,
      );

      expect(scheduleTasks).toHaveLength(1);
      expect(scheduleTasks[0].enabled).toBe(true);
      expect(scheduleTasks[0].status).toBe('active');

      console.log('✅ Enable/disable test passed');
    });
  });

  describe('Test 5: Delete Template Cascades to Schedule', () => {
    it('should delete the schedule task when template is deleted', async () => {
      // 创建提醒
      const request: ReminderContracts.CreateReminderTemplateRequest = {
        uuid: generateUUID(),
        groupUuid: testGroupUuid,
        name: 'Delete Test Reminder',
        message: 'Will be deleted',
        priority: 'LOW' as any,
        category: 'test',
        tags: [],
        enabled: true,
        timeConfig: {
          type: 'daily' as any,
          times: ['12:00'],
        },
      };

      const template = await reminderService.createReminderTemplate(request, testAccountUuid);

      // 等待事件处理完成
      await lastEventPromise;

      // 验证调度任务存在
      let scheduleTasks = await scheduleContainer.recurringScheduleTaskDomainService.findBySource(
        'reminder',
        template.uuid,
      );
      expect(scheduleTasks).toHaveLength(1);

      // 删除提醒模板
      await reminderService.deleteReminderTemplate(template.uuid, testAccountUuid);

      // 等待事件处理完成
      await lastEventPromise;

      // 验证调度任务也被删除
      scheduleTasks = await scheduleContainer.recurringScheduleTaskDomainService.findBySource(
        'reminder',
        template.uuid,
      );
      expect(scheduleTasks).toHaveLength(0);

      console.log('✅ Cascade delete test passed');
    });
  });

  describe('Test 6: Update Time Config Updates Cron', () => {
    it('should update cron expression when time config changes', async () => {
      // 创建每日提醒
      const request: ReminderContracts.CreateReminderTemplateRequest = {
        uuid: generateUUID(),
        groupUuid: testGroupUuid,
        name: 'Update Time Test',
        message: 'Will update time',
        priority: 'NORMAL' as any,
        category: 'test',
        tags: [],
        enabled: true,
        timeConfig: {
          type: 'daily' as any,
          times: ['09:00'], // 9:00 AM
        },
      };

      const template = await reminderService.createReminderTemplate(request, testAccountUuid);

      // 等待事件处理完成
      await lastEventPromise;

      // 获取初始 cron 表达式
      let scheduleTasks = await scheduleContainer.recurringScheduleTaskDomainService.findBySource(
        'reminder',
        template.uuid,
      );
      expect(scheduleTasks[0].cronExpression).toBe('0 0 9 * * *');

      // 更新时间配置为每日下午 3 点
      await reminderService.updateReminderTemplate(
        template.uuid,
        {
          timeConfig: {
            type: 'daily' as any,
            times: ['15:00'], // 3:00 PM
          },
        },
        testAccountUuid,
      );

      // 等待事件处理完成
      await lastEventPromise;

      // 验证 cron 表达式已更新
      scheduleTasks = await scheduleContainer.recurringScheduleTaskDomainService.findBySource(
        'reminder',
        template.uuid,
      );
      expect(scheduleTasks[0].cronExpression).toBe('0 0 15 * * *'); // Updated to 3:00 PM

      // 更新为每周提醒
      await reminderService.updateReminderTemplate(
        template.uuid,
        {
          timeConfig: {
            type: 'weekly' as any,
            times: ['10:30'],
            weekdays: [2, 4], // Tuesday, Thursday
          },
        },
        testAccountUuid,
      );

      // 等待事件处理完成
      await lastEventPromise;

      // 验证 cron 表达式已更新为每周
      scheduleTasks = await scheduleContainer.recurringScheduleTaskDomainService.findBySource(
        'reminder',
        template.uuid,
      );
      expect(scheduleTasks[0].cronExpression).toBe('0 30 10 * * 2,4'); // Tue, Thu at 10:30 AM

      console.log('✅ Time config update test passed');
    });
  });

  describe('Test 7: Once Trigger Type', () => {
    it('should create a one-time reminder', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

      const request: ReminderContracts.CreateReminderTemplateRequest = {
        uuid: generateUUID(),
        groupUuid: testGroupUuid,
        name: 'One-time Event Reminder',
        message: 'Important meeting',
        priority: 'URGENT' as any,
        category: 'meeting',
        tags: [],
        enabled: true,
        timeConfig: {
          type: 'ABSOLUTE' as any,
          schedule: {
            pattern: 'once' as any,
            endCondition: {
              type: 'date',
              endDate: futureDate,
            },
          },
        },
      };

      const template = await reminderService.createReminderTemplate(request, testAccountUuid);

      // 等待事件处理完成
      await lastEventPromise;

      // 验证创建了 RecurringScheduleTask with ONCE trigger
      const scheduleTasks = await scheduleContainer.recurringScheduleTaskDomainService.findBySource(
        'reminder',
        template.uuid,
      );

      expect(scheduleTasks).toHaveLength(1);
      const task = scheduleTasks[0];
      expect(task.triggerType).toBe('once');
      expect(task.scheduledTime).toBeDefined();
      expect(task.cronExpression).toBeUndefined();

      console.log('✅ One-time reminder created:', {
        templateUuid: template.uuid,
        triggerType: task.triggerType,
        scheduledTime: task.scheduledTime,
      });
    });
  });
});
