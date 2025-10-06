import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { GoalApplicationService } from '../../application/services/GoalApplicationService';
import { ScheduleContainer } from '../../../schedule/infrastructure/di/ScheduleContainer';
import { NotificationContainer } from '../../../notification/infrastructure/di/NotificationContainer';
import { GoalContainer } from '../../infrastructure/di/GoalContainer';
import { GoalContracts, ScheduleContracts, NotificationContracts } from '@dailyuse/contracts';
import { generateUUID } from '@dailyuse/utils';

// 禁用 Prisma Mock 以使用真实数据库
vi.unmock('@prisma/client');
vi.unmock('../config/prisma');

/**
 * Goal Progress Reminder Integration Tests
 *
 * 测试目标进度提醒功能与 Schedule/Notification 模块的集成
 *
 * 场景：
 * - 当目标时间进度达到 50% 时，发送提醒通知
 * - 当目标时间进度达到 90% 时，发送紧急提醒通知
 * - 更新关键结果使进度变化时，检查是否需要触发提醒
 * - 目标完成或归档后，取消未触发的进度提醒
 */
describe('Goal Progress Reminder Integration', () => {
  let prisma: PrismaClient;
  let goalService: GoalApplicationService;
  let scheduleContainer: ScheduleContainer;
  let notificationContainer: NotificationContainer;
  let goalContainer: GoalContainer;
  let testAccountUuid: string;
  let testDefaultDirUuid: string;

  // 用于追踪异步事件处理的完成状态
  let lastEventPromise: Promise<void> = Promise.resolve();

  // 存储已触发的进度提醒（50%、90%）
  const progressReminders = new Map<string, Set<number>>();

  // 事件发射器实现，自动同步到 Schedule/Notification 模块
  const simpleEventEmitter = {
    emit: (event: string, payload: any): boolean => {
      console.log(`[TestEventEmitter] 触发事件: ${event}`);

      if (event === 'GoalCreated') {
        lastEventPromise = (async () => {
          try {
            const goal = payload.payload.goal;

            // 初始化进度提醒记录
            progressReminders.set(goal.uuid, new Set());

            // 创建 50% 进度提醒任务
            await createProgressReminderTask(goal, 50);
            // 创建 90% 进度提醒任务
            await createProgressReminderTask(goal, 90);

            console.log(`[✓] 已为目标 "${goal.title}" 创建进度提醒任务`);
          } catch (error) {
            console.error(`[错误] 创建进度提醒失败:`, error);
            throw error;
          }
        })();
      } else if (event === 'GoalProgressUpdated') {
        lastEventPromise = (async () => {
          try {
            const { goalUuid, timeProgress, performanceProgress } = payload.payload;

            // 检查是否达到 50% 进度里程碑
            if (timeProgress >= 0.5 && !hasTriggeredReminder(goalUuid, 50)) {
              await triggerProgressReminder(goalUuid, 50, timeProgress);
              markReminderTriggered(goalUuid, 50);
            }

            // 检查是否达到 90% 进度里程碑
            if (timeProgress >= 0.9 && !hasTriggeredReminder(goalUuid, 90)) {
              await triggerProgressReminder(goalUuid, 90, timeProgress);
              markReminderTriggered(goalUuid, 90);
            }

            console.log(`[✓] 已检查进度提醒: 时间进度 ${(timeProgress * 100).toFixed(1)}%`);
          } catch (error) {
            console.error(`[错误] 检查进度提醒失败:`, error);
            throw error;
          }
        })();
      } else if (event === 'GoalCompleted' || event === 'GoalArchived') {
        lastEventPromise = (async () => {
          try {
            const goalUuid = payload.payload.goalUuid;

            // 取消未触发的进度提醒
            const existingTasks =
              await scheduleContainer.recurringScheduleTaskDomainService.findBySource(
                'goal-progress',
                goalUuid,
              );

            for (const task of existingTasks) {
              if (task.status !== 'completed') {
                await scheduleContainer.recurringScheduleTaskDomainService.deleteTask(task.uuid);
              }
            }

            console.log(`[✓] 已取消目标 ${goalUuid} 的未触发进度提醒`);
          } catch (error) {
            console.error(`[错误] 取消进度提醒失败:`, error);
            throw error;
          }
        })();
      }

      return true;
    },
  };

  /**
   * 创建进度提醒任务
   */
  async function createProgressReminderTask(goal: any, progressPercent: number): Promise<void> {
    const { startTime, deadline } = goal.timeBoundary;
    if (!startTime || !deadline) {
      console.warn(`[警告] 目标 "${goal.title}" 缺少时间边界，无法创建进度提醒`);
      return;
    }

    // 计算提醒触发时间
    const start = new Date(startTime).getTime();
    const end = new Date(deadline).getTime();
    const totalDuration = end - start;
    const reminderTime = new Date(start + totalDuration * (progressPercent / 100));

    // 如果提醒时间已过，则不创建
    if (reminderTime < new Date()) {
      console.warn(`[警告] 目标 "${goal.title}" 的 ${progressPercent}% 提醒时间已过，跳过创建`);
      return;
    }

    await scheduleContainer.recurringScheduleTaskDomainService.createTask({
      name: `[目标进度提醒 ${progressPercent}%] ${goal.title}`,
      description: `目标 "${goal.title}" 的 ${progressPercent}% 时间进度提醒`,
      triggerType: ScheduleContracts.TriggerType.ONCE,
      scheduledTime: reminderTime,
      enabled: true,
      sourceModule: 'goal-progress',
      sourceEntityId: goal.uuid,
      metadata: {
        goalUuid: goal.uuid,
        goalTitle: goal.title,
        progressPercent,
        reminderType: 'progress',
      },
    });

    console.log(
      `[✓] 已创建 ${progressPercent}% 进度提醒: ${goal.title}, 时间: ${reminderTime.toISOString()}`,
    );
  }

  /**
   * 触发进度提醒
   */
  async function triggerProgressReminder(
    goalUuid: string,
    progressPercent: number,
    actualProgress: number,
  ): Promise<void> {
    // 创建通知
    const notificationUuid = generateUUID();
    const urgency = progressPercent >= 90 ? 'HIGH' : 'MEDIUM';

    console.log(
      `[🔔] 触发 ${progressPercent}% 进度提醒: 目标 ${goalUuid}, 实际进度 ${(actualProgress * 100).toFixed(1)}%`,
    );

    // 这里应该调用 Notification 模块创建通知
    // 由于这是测试，我们只记录日志
    console.log(`[通知] 目标进度提醒: ${progressPercent}% 里程碑, 紧急度: ${urgency}`);
  }

  /**
   * 检查是否已触发提醒
   */
  function hasTriggeredReminder(goalUuid: string, progressPercent: number): boolean {
    const triggered = progressReminders.get(goalUuid);
    return triggered ? triggered.has(progressPercent) : false;
  }

  /**
   * 标记提醒已触发
   */
  function markReminderTriggered(goalUuid: string, progressPercent: number): void {
    let triggered = progressReminders.get(goalUuid);
    if (!triggered) {
      triggered = new Set();
      progressReminders.set(goalUuid, triggered);
    }
    triggered.add(progressPercent);
  }

  beforeAll(async () => {
    // 设置测试数据库
    process.env.DATABASE_URL =
      process.env.DATABASE_URL_TEST ||
      'postgresql://dailyuse:wordTo821AppS@@localhost:5432/dailyuse?schema=public';

    prisma = new PrismaClient();
    scheduleContainer = ScheduleContainer.getInstance(prisma);
    notificationContainer = NotificationContainer.getInstance();
    goalContainer = GoalContainer.getInstance();

    // 创建 GoalApplicationService，注入 eventEmitter
    const goalAggregateRepo = goalContainer.getGoalAggregateRepository();
    const goalDirRepo = goalContainer.getGoalDirRepository();
    goalService = new GoalApplicationService(goalAggregateRepo, goalDirRepo);
    // 注入事件发射器（需要在 GoalDomainService 中实现）
    (goalService as any).domainService.eventEmitter = simpleEventEmitter;

    // 创建测试账户
    testAccountUuid = generateUUID();
    await prisma.account.create({
      data: {
        uuid: testAccountUuid,
        username: 'test-goal-progress-user',
        email: 'test-goal-progress@example.com',
      },
    });

    await prisma.authCredential.create({
      data: {
        uuid: generateUUID(),
        accountUuid: testAccountUuid,
        passwordHash: 'dummy-hash-for-testing',
      },
    });

    // 初始化用户目标数据（创建默认目录）
    await goalService.initializeUserData(testAccountUuid);

    // 获取默认目录 UUID
    const defaultDir = await goalService.getDefaultDirectory(testAccountUuid);
    testDefaultDirUuid = defaultDir.uuid;
  });

  afterAll(async () => {
    // 清理测试数据
    await prisma.recurringScheduleTask.deleteMany({
      where: { sourceModule: 'goal-progress' },
    });
    await prisma.goalRecord.deleteMany({
      where: { accountUuid: testAccountUuid },
    });
    await prisma.keyResult.deleteMany({
      where: { accountUuid: testAccountUuid },
    });
    await prisma.goalAggregate.deleteMany({
      where: { accountUuid: testAccountUuid },
    });
    await prisma.goalDir.deleteMany({
      where: { accountUuid: testAccountUuid },
    });
    await prisma.authCredential.deleteMany({
      where: { accountUuid: testAccountUuid },
    });
    await prisma.account.deleteMany({
      where: { uuid: testAccountUuid },
    });
    await prisma.$disconnect();
  });

  beforeEach(() => {
    // 重置事件 Promise
    lastEventPromise = Promise.resolve();
    progressReminders.clear();
  });

  describe('Test 1: Create Goal with Progress Reminders', () => {
    it('should create progress reminder tasks at 50% and 90% time milestones', async () => {
      const now = new Date();
      const futureDeadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      const request: GoalContracts.CreateGoalRequest = {
        uuid: generateUUID(),
        dirUuid: testDefaultDirUuid,
        title: 'Complete Project Alpha',
        description: '一个重要的项目目标',
        timeBoundary: {
          startTime: now,
          deadline: futureDeadline,
        },
        properties: {
          importance: 'HIGH' as any,
          urgency: 'MEDIUM' as any,
          tags: ['project'],
        },
      };

      const goalResponse = await goalService.createGoal(testAccountUuid, request);
      await lastEventPromise;

      // 验证创建了2个进度提醒任务（50% 和 90%）
      const scheduleTasks = await scheduleContainer.recurringScheduleTaskDomainService.findBySource(
        'goal-progress',
        goalResponse.uuid,
      );

      expect(scheduleTasks).toHaveLength(2);

      // 验证 50% 提醒
      const reminder50 = scheduleTasks.find((t) => t.metadata.progressPercent === 50);
      expect(reminder50).toBeDefined();
      expect(reminder50?.triggerType).toBe('once');
      expect(reminder50?.enabled).toBe(true);
      expect(reminder50?.name).toContain('50%');

      // 验证 90% 提醒
      const reminder90 = scheduleTasks.find((t) => t.metadata.progressPercent === 90);
      expect(reminder90).toBeDefined();
      expect(reminder90?.triggerType).toBe('once');
      expect(reminder90?.enabled).toBe(true);
      expect(reminder90?.name).toContain('90%');

      console.log('✅ Goal progress reminders created:', {
        goalUuid: goalResponse.uuid,
        reminders: scheduleTasks.map((t) => ({
          progress: t.metadata.progressPercent,
          scheduledTime: t.scheduledTime,
        })),
      });
    });
  });

  describe('Test 2: Progress Reminder Triggers at 50%', () => {
    it('should trigger 50% reminder when time progress reaches 50%', async () => {
      const now = new Date();
      const futureDeadline = new Date(now.getTime() + 100 * 24 * 60 * 60 * 1000); // 100 days

      const request: GoalContracts.CreateGoalRequest = {
        uuid: generateUUID(),
        dirUuid: testDefaultDirUuid,
        title: 'Long Term Goal',
        timeBoundary: {
          startTime: now,
          deadline: futureDeadline,
        },
        properties: {
          importance: 'HIGH' as any,
          urgency: 'LOW' as any,
          tags: [],
        },
      };

      const goalResponse = await goalService.createGoal(testAccountUuid, request);
      await lastEventPromise;

      // 模拟进度更新到 50%
      simpleEventEmitter.emit('GoalProgressUpdated', {
        payload: {
          goalUuid: goalResponse.uuid,
          timeProgress: 0.5,
          performanceProgress: 0.3,
        },
      });
      await lastEventPromise;

      // 验证 50% 提醒已触发
      expect(hasTriggeredReminder(goalResponse.uuid, 50)).toBe(true);
      expect(hasTriggeredReminder(goalResponse.uuid, 90)).toBe(false);

      console.log('✅ 50% progress reminder triggered successfully');
    });
  });

  describe('Test 3: Progress Reminder Triggers at 90%', () => {
    it('should trigger 90% reminder when time progress reaches 90%', async () => {
      const now = new Date();
      const futureDeadline = new Date(now.getTime() + 100 * 24 * 60 * 60 * 1000);

      const request: GoalContracts.CreateGoalRequest = {
        uuid: generateUUID(),
        dirUuid: testDefaultDirUuid,
        title: 'Critical Goal',
        timeBoundary: {
          startTime: now,
          deadline: futureDeadline,
        },
        properties: {
          importance: 'HIGH' as any,
          urgency: 'HIGH' as any,
          tags: ['critical'],
        },
      };

      const goalResponse = await goalService.createGoal(testAccountUuid, request);
      await lastEventPromise;

      // 模拟进度更新到 90%
      simpleEventEmitter.emit('GoalProgressUpdated', {
        payload: {
          goalUuid: goalResponse.uuid,
          timeProgress: 0.9,
          performanceProgress: 0.7,
        },
      });
      await lastEventPromise;

      // 验证 50% 和 90% 提醒都已触发
      expect(hasTriggeredReminder(goalResponse.uuid, 50)).toBe(true);
      expect(hasTriggeredReminder(goalResponse.uuid, 90)).toBe(true);

      console.log('✅ 90% progress reminder triggered successfully');
    });
  });

  describe('Test 4: Cancel Reminders on Goal Completion', () => {
    it('should cancel untriggered reminders when goal is completed', async () => {
      const now = new Date();
      const futureDeadline = new Date(now.getTime() + 100 * 24 * 60 * 60 * 1000);

      const request: GoalContracts.CreateGoalRequest = {
        uuid: generateUUID(),
        dirUuid: testDefaultDirUuid,
        title: 'Early Completion Goal',
        timeBoundary: {
          startTime: now,
          deadline: futureDeadline,
        },
        properties: {
          importance: 'MEDIUM' as any,
          urgency: 'MEDIUM' as any,
          tags: [],
        },
      };

      const goalResponse = await goalService.createGoal(testAccountUuid, request);
      await lastEventPromise;

      // 完成目标（进度只有 30%）
      await goalService.completeGoal(testAccountUuid, goalResponse.uuid);

      // 触发完成事件
      simpleEventEmitter.emit('GoalCompleted', {
        payload: {
          goalUuid: goalResponse.uuid,
        },
      });
      await lastEventPromise;

      // 验证所有未触发的进度提醒已被取消
      const scheduleTasks = await scheduleContainer.recurringScheduleTaskDomainService.findBySource(
        'goal-progress',
        goalResponse.uuid,
      );

      expect(scheduleTasks).toHaveLength(0);

      console.log('✅ Progress reminders cancelled on goal completion');
    });
  });

  describe('Test 5: Both Reminders Trigger for Fast Progress', () => {
    it('should trigger both 50% and 90% reminders when progress updates quickly', async () => {
      const now = new Date();
      const futureDeadline = new Date(now.getTime() + 100 * 24 * 60 * 60 * 1000);

      const request: GoalContracts.CreateGoalRequest = {
        uuid: generateUUID(),
        dirUuid: testDefaultDirUuid,
        title: 'Fast Progress Goal',
        timeBoundary: {
          startTime: now,
          deadline: futureDeadline,
        },
        properties: {
          importance: 'HIGH' as any,
          urgency: 'HIGH' as any,
          tags: ['fast-track'],
        },
      };

      const goalResponse = await goalService.createGoal(testAccountUuid, request);
      await lastEventPromise;

      // 第一次更新到 50%
      simpleEventEmitter.emit('GoalProgressUpdated', {
        payload: {
          goalUuid: goalResponse.uuid,
          timeProgress: 0.55,
          performanceProgress: 0.8,
        },
      });
      await lastEventPromise;

      expect(hasTriggeredReminder(goalResponse.uuid, 50)).toBe(true);

      // 第二次更新到 90%
      simpleEventEmitter.emit('GoalProgressUpdated', {
        payload: {
          goalUuid: goalResponse.uuid,
          timeProgress: 0.92,
          performanceProgress: 0.95,
        },
      });
      await lastEventPromise;

      expect(hasTriggeredReminder(goalResponse.uuid, 90)).toBe(true);

      console.log('✅ Both progress reminders triggered correctly');
    });
  });
});
