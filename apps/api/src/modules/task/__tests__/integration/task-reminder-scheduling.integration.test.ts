import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { TaskTemplateApplicationService } from '../../application/services/TaskTemplateApplicationService';
import { ScheduleContainer } from '../../../schedule/infrastructure/di/ScheduleContainer';
import { TaskContainer } from '../../infrastructure/di/TaskContainer';
import { TaskContracts, ScheduleContracts } from '@dailyuse/contracts';
import { generateUUID } from '@dailyuse/utils';

// 禁用 Prisma Mock 以使用真实数据库
vi.unmock('@prisma/client');
vi.unmock('../config/prisma');

/**
 * Task Reminder Scheduling Integration Tests
 *
 * 测试任务模板的提醒功能与 Schedule 模块的集成
 *
 * 场景：
 * - 创建带提醒配置的任务模板时，应该创建对应的 RecurringScheduleTask
 * - 更新任务模板的提醒配置时，应该更新对应的 RecurringScheduleTask
 * - 禁用任务模板的提醒时，应该禁用对应的 RecurringScheduleTask
 * - 删除任务模板时，应该删除对应的 RecurringScheduleTask
 */
describe('Task Reminder Scheduling Integration', () => {
  let prisma: PrismaClient;
  let taskService: TaskTemplateApplicationService;
  let scheduleContainer: ScheduleContainer;
  let taskContainer: TaskContainer;
  let testAccountUuid: string;

  // 用于追踪异步事件处理的完成状态
  let lastEventPromise: Promise<void> = Promise.resolve();

  // 事件发射器实现，自动同步到 Schedule 模块
  const simpleEventEmitter = {
    emit: (event: string, payload: any): boolean => {
      console.log(`[TestEventEmitter] 触发事件: ${event}`);

      if (event === 'TaskTemplateCreated') {
        lastEventPromise = (async () => {
          try {
            const template = payload.payload.template;

            // 检查是否启用提醒
            if (!template.reminderConfig?.enabled) {
              console.log(`[跳过] 任务模板未启用提醒: ${template.title}`);
              return;
            }

            // 计算提醒时间的 cron 表达式
            const cronExpression = calculateTaskReminderCron(template);
            if (!cronExpression) {
              console.warn(`[警告] 无法生成提醒 cron 表达式: ${template.title}`);
              return;
            }

            console.log(`[调试] 准备创建任务提醒，cron: ${cronExpression}`);

            await scheduleContainer.recurringScheduleTaskDomainService.createTask({
              name: `[任务提醒] ${template.title}`,
              description: `任务 "${template.title}" 的提醒`,
              triggerType: ScheduleContracts.TriggerType.CRON,
              cronExpression,
              enabled: true,
              sourceModule: 'task',
              sourceEntityId: template.uuid,
              metadata: {
                accountUuid: payload.payload.accountUuid,
                templateTitle: template.title,
                reminderConfig: template.reminderConfig,
                taskTimeConfig: template.timeConfig,
              },
            });

            console.log(`[✓] 已创建任务提醒: ${template.title}, cron: ${cronExpression}`);
          } catch (error) {
            console.error(`[错误] 创建任务提醒失败:`, error);
            throw error;
          }
        })();
      } else if (event === 'TaskTemplateUpdated') {
        lastEventPromise = (async () => {
          try {
            const template = payload.payload.template;

            // 查找现有的调度任务
            const existingTasks =
              await scheduleContainer.recurringScheduleTaskDomainService.findBySource(
                'task',
                template.uuid,
              );

            if (existingTasks.length === 0) {
              console.log(`[警告] 未找到关联的调度任务: ${template.title}`);
              // 如果启用了提醒，创建新任务
              if (template.reminderConfig?.enabled) {
                const cronExpression = calculateTaskReminderCron(template);
                if (cronExpression) {
                  await scheduleContainer.recurringScheduleTaskDomainService.createTask({
                    name: `[任务提醒] ${template.title}`,
                    description: `任务 "${template.title}" 的提醒`,
                    triggerType: ScheduleContracts.TriggerType.CRON,
                    cronExpression,
                    enabled: true,
                    sourceModule: 'task',
                    sourceEntityId: template.uuid,
                    metadata: {
                      accountUuid: payload.payload.accountUuid,
                      templateTitle: template.title,
                      reminderConfig: template.reminderConfig,
                    },
                  });
                  console.log(`[✓] 已创建新任务提醒: ${template.title}`);
                }
              }
              return;
            }

            const taskUuid = existingTasks[0].uuid;

            // 如果提醒被禁用，禁用调度任务
            if (!template.reminderConfig?.enabled) {
              await scheduleContainer.recurringScheduleTaskDomainService.updateTask(taskUuid, {
                enabled: false,
              });
              console.log(`[✓] 已禁用任务提醒: ${template.title}`);
              return;
            }

            // 更新调度任务
            const cronExpression = calculateTaskReminderCron(template);
            const updateData: any = {
              name: `[任务提醒] ${template.title}`,
              description: `任务 "${template.title}" 的提醒`,
              enabled: true,
              metadata: {
                accountUuid: payload.payload.accountUuid,
                templateTitle: template.title,
                reminderConfig: template.reminderConfig,
                taskTimeConfig: template.timeConfig,
              },
            };

            if (cronExpression) {
              updateData.cronExpression = cronExpression;
            }

            await scheduleContainer.recurringScheduleTaskDomainService.updateTask(
              taskUuid,
              updateData,
            );

            console.log(
              `[✓] 已更新任务提醒: ${template.title}${updateData.cronExpression ? `, cron: ${updateData.cronExpression}` : ''}`,
            );
          } catch (error) {
            console.error(`[错误] 更新任务提醒失败:`, error);
            throw error;
          }
        })();
      } else if (event === 'TaskTemplateDeleted') {
        lastEventPromise = (async () => {
          try {
            const templateUuid = payload.payload.templateUuid;
            const existingTasks =
              await scheduleContainer.recurringScheduleTaskDomainService.findBySource(
                'task',
                templateUuid,
              );

            for (const task of existingTasks) {
              await scheduleContainer.recurringScheduleTaskDomainService.deleteTask(task.uuid);
            }

            console.log(`[✓] 已删除任务提醒: ${payload.payload.templateTitle || templateUuid}`);
          } catch (error) {
            console.error(`[错误] 删除任务提醒失败:`, error);
            throw error;
          }
        })();
      }

      return true;
    },
  };

  /**
   * 根据任务的时间配置计算提醒的 cron 表达式
   *
   * 示例：
   * - 每天任务，提前30分钟提醒：如果任务在9:00，提醒在8:30
   * - 每周任务，提前1小时提醒：如果任务在周一14:00，提醒在周一13:00
   */
  function calculateTaskReminderCron(template: any): string | null {
    const { timeConfig, reminderConfig } = template;
    if (!timeConfig || !reminderConfig?.enabled) {
      return null;
    }

    const minutesBefore = reminderConfig.minutesBefore || 30;

    // 处理每日任务
    if (timeConfig.type === 'daily') {
      const time = timeConfig.times?.[0] || '09:00';
      const [hour, minute] = time.split(':').map(Number);

      // 计算提醒时间
      let reminderMinute = minute - minutesBefore;
      let reminderHour = hour;

      if (reminderMinute < 0) {
        reminderMinute += 60;
        reminderHour -= 1;
      }
      if (reminderHour < 0) {
        reminderHour += 24;
      }

      return `0 ${reminderMinute} ${reminderHour} * * *`;
    }

    // 处理每周任务
    if (timeConfig.type === 'weekly') {
      const time = timeConfig.times?.[0] || '09:00';
      const weekdays = timeConfig.weekdays || [1];
      const [hour, minute] = time.split(':').map(Number);

      // 计算提醒时间
      let reminderMinute = minute - minutesBefore;
      let reminderHour = hour;

      if (reminderMinute < 0) {
        reminderMinute += 60;
        reminderHour -= 1;
      }
      if (reminderHour < 0) {
        reminderHour += 24;
      }

      const cronWeekdays = weekdays.join(',');
      return `0 ${reminderMinute} ${reminderHour} * * ${cronWeekdays}`;
    }

    // 处理每月任务
    if (timeConfig.type === 'monthly') {
      const time = timeConfig.times?.[0] || '09:00';
      const monthDays = timeConfig.monthDays || [1];
      const [hour, minute] = time.split(':').map(Number);

      // 计算提醒时间
      let reminderMinute = minute - minutesBefore;
      let reminderHour = hour;

      if (reminderMinute < 0) {
        reminderMinute += 60;
        reminderHour -= 1;
      }
      if (reminderHour < 0) {
        reminderHour += 24;
      }

      const cronDays = monthDays.join(',');
      return `0 ${reminderMinute} ${reminderHour} ${cronDays} * *`;
    }

    return null;
  }

  beforeAll(async () => {
    // 初始化数据库连接
    prisma = new PrismaClient();

    // 初始化容器
    scheduleContainer = ScheduleContainer.getInstance();
    await scheduleContainer.initialize(prisma);

    taskContainer = TaskContainer.getInstance();
    await taskContainer.initialize(prisma);

    // 创建测试用的 TaskTemplateApplicationService，注入事件发射器
    const templateRepo = await taskContainer.getPrismaTaskTemplateRepository();
    taskService = new TaskTemplateApplicationService(templateRepo);
    // 注入事件发射器（需要在 TaskTemplateDomainService 中实现）
    (taskService as any).domainService.eventEmitter = simpleEventEmitter;

    // 创建测试账户
    testAccountUuid = generateUUID();
  });

  afterAll(async () => {
    // 清理测试数据
    await prisma.recurringScheduleTask.deleteMany({
      where: { sourceModule: 'task' },
    });
    await prisma.taskTemplate.deleteMany({
      where: { accountUuid: testAccountUuid },
    });
    await prisma.$disconnect();
  });

  beforeEach(() => {
    // 重置事件 Promise
    lastEventPromise = Promise.resolve();
  });

  describe('Test 1: Daily Task with Reminder', () => {
    it('should create a reminder schedule task when task template has reminder enabled', async () => {
      const request: TaskContracts.CreateTaskTemplateRequest = {
        uuid: generateUUID(),
        title: 'Morning Exercise',
        description: 'Daily exercise routine',
        timeConfig: {
          type: 'daily' as any,
          times: ['08:00'],
        },
        reminderConfig: {
          enabled: true,
          minutesBefore: 30, // 提前30分钟提醒（7:30）
          methods: ['notification' as any],
        },
        properties: {
          importance: 'HIGH' as any,
          urgency: 'MEDIUM' as any,
          tags: [],
        },
      };

      const template = await taskService.createTemplate(testAccountUuid, request);

      // 等待事件处理完成
      await lastEventPromise;

      // 验证创建了 RecurringScheduleTask
      const scheduleTasks = await scheduleContainer.recurringScheduleTaskDomainService.findBySource(
        'task',
        template.uuid,
      );

      expect(scheduleTasks).toHaveLength(1);
      const task = scheduleTasks[0];
      expect(task.triggerType).toBe('cron');
      expect(task.cronExpression).toBe('0 30 7 * * *'); // 7:30 AM
      expect(task.enabled).toBe(true);
      expect(task.name).toBe('[任务提醒] Morning Exercise');

      console.log('✅ Daily task reminder created:', {
        templateUuid: template.uuid,
        cronExpression: task.cronExpression,
        reminderTime: '7:30 AM (30 minutes before 8:00 AM)',
      });
    });
  });

  describe('Test 2: Weekly Task with Reminder', () => {
    it('should create a reminder for weekly task on specific weekdays', async () => {
      const request: TaskContracts.CreateTaskTemplateRequest = {
        uuid: generateUUID(),
        title: 'Weekly Team Meeting',
        description: 'Recurring team meeting',
        timeConfig: {
          type: 'weekly' as any,
          times: ['14:00'],
          weekdays: [1, 3, 5], // 周一、周三、周五
        },
        reminderConfig: {
          enabled: true,
          minutesBefore: 60, // 提前1小时提醒（13:00）
          methods: ['notification' as any, 'sound' as any],
        },
        properties: {
          importance: 'HIGH' as any,
          urgency: 'HIGH' as any,
          tags: ['work'],
        },
      };

      const template = await taskService.createTemplate(testAccountUuid, request);
      await lastEventPromise;

      const scheduleTasks = await scheduleContainer.recurringScheduleTaskDomainService.findBySource(
        'task',
        template.uuid,
      );

      expect(scheduleTasks).toHaveLength(1);
      expect(scheduleTasks[0].cronExpression).toBe('0 0 13 * * 1,3,5'); // 周一、三、五 13:00
      expect(scheduleTasks[0].enabled).toBe(true);

      console.log('✅ Weekly task reminder created:', {
        templateUuid: template.uuid,
        cronExpression: scheduleTasks[0].cronExpression,
      });
    });
  });

  describe('Test 3: Disable/Enable Task Reminder', () => {
    it('should disable reminder when task reminder is disabled', async () => {
      const request: TaskContracts.CreateTaskTemplateRequest = {
        uuid: generateUUID(),
        title: 'Toggle Reminder Test',
        timeConfig: {
          type: 'daily' as any,
          times: ['09:00'],
        },
        reminderConfig: {
          enabled: true,
          minutesBefore: 15,
          methods: ['notification' as any],
        },
        properties: {
          importance: 'MEDIUM' as any,
          urgency: 'MEDIUM' as any,
          tags: [],
        },
      };

      const template = await taskService.createTemplate(testAccountUuid, request);
      await lastEventPromise;

      // 禁用提醒
      await taskService.updateTemplate(testAccountUuid, template.uuid, {
        reminderConfig: {
          enabled: false,
          minutesBefore: 15,
          methods: ['notification' as any],
        },
      });
      await lastEventPromise;

      let scheduleTasks = await scheduleContainer.recurringScheduleTaskDomainService.findBySource(
        'task',
        template.uuid,
      );

      expect(scheduleTasks).toHaveLength(1);
      expect(scheduleTasks[0].enabled).toBe(false);
      expect(scheduleTasks[0].status).toBe('paused');

      // 重新启用提醒
      await taskService.updateTemplate(testAccountUuid, template.uuid, {
        reminderConfig: {
          enabled: true,
          minutesBefore: 15,
          methods: ['notification' as any],
        },
      });
      await lastEventPromise;

      scheduleTasks = await scheduleContainer.recurringScheduleTaskDomainService.findBySource(
        'task',
        template.uuid,
      );

      expect(scheduleTasks).toHaveLength(1);
      expect(scheduleTasks[0].enabled).toBe(true);
      expect(scheduleTasks[0].status).toBe('active');

      console.log('✅ Task reminder disable/enable test passed');
    });
  });

  describe('Test 4: Update Reminder Time', () => {
    it('should update cron expression when reminder time changes', async () => {
      const request: TaskContracts.CreateTaskTemplateRequest = {
        uuid: generateUUID(),
        title: 'Update Reminder Time Test',
        timeConfig: {
          type: 'daily' as any,
          times: ['10:00'],
        },
        reminderConfig: {
          enabled: true,
          minutesBefore: 30, // 9:30
          methods: ['notification' as any],
        },
        properties: {
          importance: 'MEDIUM' as any,
          urgency: 'MEDIUM' as any,
          tags: [],
        },
      };

      const template = await taskService.createTemplate(testAccountUuid, request);
      await lastEventPromise;

      // 更新提醒时间为提前1小时
      await taskService.updateTemplate(testAccountUuid, template.uuid, {
        reminderConfig: {
          enabled: true,
          minutesBefore: 60, // 9:00
          methods: ['notification' as any],
        },
      });
      await lastEventPromise;

      const scheduleTasks = await scheduleContainer.recurringScheduleTaskDomainService.findBySource(
        'task',
        template.uuid,
      );

      expect(scheduleTasks[0].cronExpression).toBe('0 0 9 * * *'); // 9:00 AM

      console.log('✅ Task reminder time update test passed');
    });
  });

  describe('Test 5: Delete Task Cascades to Schedule', () => {
    it('should delete reminder task when template is deleted', async () => {
      const request: TaskContracts.CreateTaskTemplateRequest = {
        uuid: generateUUID(),
        title: 'Delete Test Task',
        timeConfig: {
          type: 'daily' as any,
          times: ['12:00'],
        },
        reminderConfig: {
          enabled: true,
          minutesBefore: 30,
          methods: ['notification' as any],
        },
        properties: {
          importance: 'LOW' as any,
          urgency: 'LOW' as any,
          tags: [],
        },
      };

      const template = await taskService.createTemplate(testAccountUuid, request);
      await lastEventPromise;

      // 删除任务模板
      await taskService.deleteTemplate(testAccountUuid, template.uuid);
      await lastEventPromise;

      // 验证调度任务已删除
      const scheduleTasks = await scheduleContainer.recurringScheduleTaskDomainService.findBySource(
        'task',
        template.uuid,
      );

      expect(scheduleTasks).toHaveLength(0);

      console.log('✅ Task cascade delete test passed');
    });
  });
});
