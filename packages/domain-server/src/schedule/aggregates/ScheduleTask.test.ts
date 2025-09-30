/**
 * ScheduleTask 聚合根测试
 * @description 测试调度任务聚合根的业务逻辑
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScheduleTask } from '../aggregates/ScheduleTask';
import { TestHelpers, TEST_CONSTANTS } from '../../test/setup';
import {
  ScheduleTaskType,
  ScheduleStatus,
  SchedulePriority,
  RecurrenceType,
  AlertMethod,
  type IScheduleTask,
} from '@dailyuse/contracts';

describe('ScheduleTask 聚合根', () => {
  let validTaskData: IScheduleTask;
  let scheduleTask: ScheduleTask;

  beforeEach(() => {
    // 设置固定的测试时间
    global.createMockDate(TEST_CONSTANTS.TEST_DATE);

    // 准备有效的任务数据
    validTaskData = {
      uuid: TestHelpers.generateTestUuid('schedule'),
      basic: {
        name: '测试任务',
        description: '用于测试的调度任务',
        taskType: ScheduleTaskType.GENERAL_REMINDER,
        payload: {
          type: ScheduleTaskType.GENERAL_REMINDER,
          data: {
            title: '提醒标题',
            message: '提醒消息',
          },
        },
        createdBy: TEST_CONSTANTS.TEST_ACCOUNT_UUID,
      },
      scheduling: {
        scheduledTime: new Date(TEST_CONSTANTS.TOMORROW),
        priority: SchedulePriority.NORMAL,
        status: ScheduleStatus.PENDING,
        nextExecutionTime: new Date(TEST_CONSTANTS.TOMORROW),
      },
      execution: {
        executionCount: 0,
        maxRetries: 3,
        currentRetries: 0,
        timeoutSeconds: 30,
      },
      alertConfig: {
        methods: [AlertMethod.POPUP, AlertMethod.SOUND],
        allowSnooze: true,
        snoozeOptions: [5, 10, 15],
        popupDuration: 10,
      },
      lifecycle: {
        createdAt: new Date(TEST_CONSTANTS.TEST_DATE),
        updatedAt: new Date(TEST_CONSTANTS.TEST_DATE),
      },
      metadata: {
        tags: ['测试', '提醒'],
        enabled: true,
      },
    };

    scheduleTask = new ScheduleTask(validTaskData);
  });

  describe('聚合根创建', () => {
    it('应该成功创建有效的调度任务', () => {
      expect(scheduleTask.uuid).toBe(validTaskData.uuid);
      expect(scheduleTask.name).toBe('测试任务');
      expect(scheduleTask.taskType).toBe(ScheduleTaskType.GENERAL_REMINDER);
      expect(scheduleTask.status).toBe(ScheduleStatus.PENDING);
    });

    it('应该继承自 ScheduleTaskCore', () => {
      expect(scheduleTask).toBeInstanceOf(ScheduleTask);
      expect(typeof scheduleTask.validate).toBe('function');
      expect(typeof scheduleTask.execute).toBe('function');
    });
  });

  describe('任务执行', () => {
    it('应该成功执行通用提醒任务', async () => {
      const result = await scheduleTask.execute();

      expect(result.taskUuid).toBe(scheduleTask.uuid);
      expect(result.status).toBe(ScheduleStatus.COMPLETED);
      expect(result.executedAt).toBeInstanceOf(Date);
      expect(result.duration).toBeGreaterThan(0);
      expect(typeof result.result).toBe('string');
      expect(result.result).toContain('处理通用提醒');
    });

    it('应该正确更新执行状态', async () => {
      const originalCount = scheduleTask.executionCount;

      await scheduleTask.execute();

      expect(scheduleTask.executionCount).toBe(originalCount + 1);
      expect(scheduleTask.status).toBe(ScheduleStatus.COMPLETED);
      expect(scheduleTask.currentRetries).toBe(0);
    });

    it('应该处理任务提醒类型', async () => {
      const taskReminderData = {
        ...validTaskData,
        basic: {
          ...validTaskData.basic,
          taskType: ScheduleTaskType.TASK_REMINDER,
          payload: {
            type: ScheduleTaskType.TASK_REMINDER,
            data: {
              taskId: 'task-123',
            },
          },
        },
      };

      const taskReminder = new ScheduleTask(taskReminderData);
      const result = await taskReminder.execute();

      expect(result.status).toBe(ScheduleStatus.COMPLETED);
      expect(result.result).toContain('处理任务提醒');
      expect(result.result).toContain('task-123');
    });

    it('应该处理目标提醒类型', async () => {
      const goalReminderData = {
        ...validTaskData,
        basic: {
          ...validTaskData.basic,
          taskType: ScheduleTaskType.GOAL_REMINDER,
          payload: {
            type: ScheduleTaskType.GOAL_REMINDER,
            data: {
              goalId: 'goal-123',
            },
          },
        },
      };

      const goalReminder = new ScheduleTask(goalReminderData);
      const result = await goalReminder.execute();

      expect(result.status).toBe(ScheduleStatus.COMPLETED);
      expect(result.result).toContain('处理目标提醒');
      expect(result.result).toContain('goal-123');
    });

    it('应该处理执行失败的情况', async () => {
      // 模拟执行失败
      const mockError = new Error('执行失败');
      vi.spyOn(scheduleTask as any, 'performTask').mockRejectedValue(mockError);

      const result = await scheduleTask.execute();

      expect(result.status).toBe(ScheduleStatus.FAILED);
      expect(result.error).toBe('执行失败');
      expect(scheduleTask.status).toBe(ScheduleStatus.FAILED);
      expect(scheduleTask.currentRetries).toBe(1);
    });
  });

  describe('重复任务计算', () => {
    it('应该正确计算每日重复的下次执行时间', () => {
      const dailyTask = new ScheduleTask({
        ...validTaskData,
        scheduling: {
          ...validTaskData.scheduling,
          recurrence: {
            type: RecurrenceType.DAILY,
            interval: 1,
          },
        },
      });

      const nextTime = (dailyTask as any).calculateNextExecutionTime();
      const expectedTime = new Date(TEST_CONSTANTS.TOMORROW);
      expectedTime.setDate(expectedTime.getDate() + 1);

      expect(nextTime).toEqual(expectedTime);
    });

    it('应该正确计算每周重复的下次执行时间', () => {
      const weeklyTask = new ScheduleTask({
        ...validTaskData,
        scheduling: {
          ...validTaskData.scheduling,
          recurrence: {
            type: RecurrenceType.WEEKLY,
            interval: 1,
            daysOfWeek: [1, 3, 5], // 周一、周三、周五
          },
        },
      });

      const nextTime = (weeklyTask as any).calculateNextExecutionTime();
      expect(nextTime).toBeInstanceOf(Date);
    });

    it('应该正确计算每月重复的下次执行时间', () => {
      const monthlyTask = new ScheduleTask({
        ...validTaskData,
        scheduling: {
          ...validTaskData.scheduling,
          recurrence: {
            type: RecurrenceType.MONTHLY,
            interval: 1,
            dayOfMonth: 15,
          },
        },
      });

      const nextTime = (monthlyTask as any).calculateNextExecutionTime();
      expect(nextTime).toBeInstanceOf(Date);
      expect(nextTime.getDate()).toBe(15);
    });

    it('应该在达到最大执行次数时停止调度', () => {
      const limitedTask = new ScheduleTask({
        ...validTaskData,
        scheduling: {
          ...validTaskData.scheduling,
          recurrence: {
            type: RecurrenceType.DAILY,
            interval: 1,
            maxOccurrences: 1,
          },
        },
        execution: {
          ...validTaskData.execution,
          executionCount: 1, // 已执行1次
        },
      });

      const nextTime = (limitedTask as any).calculateNextExecutionTime();
      expect(nextTime).toBe(limitedTask.scheduledTime);
    });

    it('应该在超过结束日期时停止调度', () => {
      const expiredTask = new ScheduleTask({
        ...validTaskData,
        scheduling: {
          ...validTaskData.scheduling,
          recurrence: {
            type: RecurrenceType.DAILY,
            interval: 1,
            endDate: new Date(TEST_CONSTANTS.YESTERDAY),
          },
        },
      });

      const nextTime = (expiredTask as any).calculateNextExecutionTime();
      expect(nextTime).toBe(expiredTask.scheduledTime);
    });
  });

  describe('验证规则', () => {
    it('应该验证必需字段', () => {
      const invalidTask = new ScheduleTask({
        ...validTaskData,
        basic: {
          ...validTaskData.basic,
          name: '', // 空名称
        },
      });

      const result = invalidTask.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('任务名称不能为空');
    });

    it('应该验证任务类型', () => {
      const invalidTask = new ScheduleTask({
        ...validTaskData,
        basic: {
          ...validTaskData.basic,
          taskType: null as any,
        },
      });

      const result = invalidTask.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('任务类型不能为空');
    });

    it('应该验证计划执行时间', () => {
      const invalidTask = new ScheduleTask({
        ...validTaskData,
        scheduling: {
          ...validTaskData.scheduling,
          scheduledTime: null as any,
        },
      });

      const result = invalidTask.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('计划执行时间不能为空');
    });

    it('应该进行详细验证', () => {
      const pastTimeTask = new ScheduleTask({
        ...validTaskData,
        scheduling: {
          ...validTaskData.scheduling,
          scheduledTime: new Date(TEST_CONSTANTS.YESTERDAY),
        },
      });

      const result = pastTimeTask.validateDetailed();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('计划执行时间不能早于当前时间');
    });

    it('应该验证重复规则', () => {
      const invalidRecurrenceTask = new ScheduleTask({
        ...validTaskData,
        scheduling: {
          ...validTaskData.scheduling,
          recurrence: {
            type: RecurrenceType.DAILY,
            interval: 0, // 无效间隔
          },
        },
      });

      const result = invalidRecurrenceTask.validateDetailed();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('重复间隔必须大于0');
    });

    it('应该验证载荷数据', () => {
      const invalidPayloadTask = new ScheduleTask({
        ...validTaskData,
        basic: {
          ...validTaskData.basic,
          taskType: ScheduleTaskType.TASK_REMINDER,
          payload: {
            type: ScheduleTaskType.TASK_REMINDER,
            data: {}, // 缺少 taskId
          },
        },
      });

      const result = invalidPayloadTask.validateDetailed();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('任务提醒必须包含taskId');
    });
  });

  describe('静态工厂方法', () => {
    it('应该从 DTO 创建任务实例', () => {
      const dto = {
        uuid: 'task-123',
        name: '从DTO创建',
        description: 'DTO描述',
        taskType: ScheduleTaskType.GENERAL_REMINDER,
        payload: validTaskData.basic.payload,
        createdBy: 'user-123',
        scheduledTime: new Date(),
        priority: SchedulePriority.HIGH,
        status: ScheduleStatus.PENDING,
        executionCount: 0,
        maxRetries: 3,
        currentRetries: 0,
        alertConfig: validTaskData.alertConfig,
        createdAt: new Date(),
        updatedAt: new Date(),
        enabled: true,
      };

      const task = ScheduleTask.fromDTO(dto);
      expect(task.uuid).toBe('task-123');
      expect(task.name).toBe('从DTO创建');
      expect(task.priority).toBe(SchedulePriority.HIGH);
    });

    it('应该从创建请求创建任务实例', () => {
      const request = {
        name: '新任务',
        description: '新任务描述',
        taskType: ScheduleTaskType.GENERAL_REMINDER,
        scheduledTime: new Date(TEST_CONSTANTS.TOMORROW),
        priority: SchedulePriority.NORMAL,
        payload: validTaskData.basic.payload,
        maxRetries: 5,
        alertConfig: validTaskData.alertConfig,
        enabled: true,
      };

      const task = ScheduleTask.fromCreateRequest(request, 'new-task-uuid', 'creator-123');

      expect(task.uuid).toBe('new-task-uuid');
      expect(task.name).toBe('新任务');
      expect(task.createdBy).toBe('creator-123');
      expect(task.status).toBe(ScheduleStatus.PENDING);
      expect(task.executionCount).toBe(0);
      expect(task.maxRetries).toBe(5);
    });

    it('应该创建快速提醒任务', () => {
      const reminderTime = new Date(TEST_CONSTANTS.TOMORROW);

      const quickReminder = ScheduleTask.createQuickReminder(
        '会议提醒',
        '下午3点有重要会议',
        reminderTime,
        'user-123',
        {
          priority: SchedulePriority.HIGH,
          methods: [AlertMethod.POPUP, AlertMethod.EMAIL],
          allowSnooze: true,
          tags: ['会议', '工作'],
        },
      );

      expect(quickReminder.name).toBe('会议提醒');
      expect(quickReminder.description).toContain('快速提醒');
      expect(quickReminder.taskType).toBe(ScheduleTaskType.GENERAL_REMINDER);
      expect(quickReminder.priority).toBe(SchedulePriority.HIGH);
      expect(quickReminder.scheduledTime).toBe(reminderTime);
      expect(quickReminder.tags).toContain('会议');
      expect(quickReminder.alertConfig?.allowSnooze).toBe(true);
    });
  });

  describe('边界情况', () => {
    it('应该处理未知任务类型', async () => {
      const unknownTypeTask = new ScheduleTask({
        ...validTaskData,
        basic: {
          ...validTaskData.basic,
          taskType: 'UNKNOWN_TYPE' as any,
          payload: {
            type: 'UNKNOWN_TYPE' as any,
            data: {},
          },
        },
      });

      const result = await unknownTypeTask.execute();
      expect(result.status).toBe(ScheduleStatus.COMPLETED);
      expect(result.result).toContain('未知任务类型');
    });

    it('应该处理最大重试次数限制', () => {
      const task = new ScheduleTask({
        ...validTaskData,
        execution: {
          ...validTaskData.execution,
          maxRetries: 15, // 超过限制
        },
      });

      const result = task.validateDetailed();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('重试次数必须在0-10之间');
    });

    it('应该处理超时时间限制', () => {
      const task = new ScheduleTask({
        ...validTaskData,
        execution: {
          ...validTaskData.execution,
          timeoutSeconds: 5000, // 超过限制
        },
      });

      const result = task.validateDetailed();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('超时时间必须在1-3600秒之间');
    });

    it('应该处理无效的星期配置', () => {
      const task = new ScheduleTask({
        ...validTaskData,
        scheduling: {
          ...validTaskData.scheduling,
          recurrence: {
            type: RecurrenceType.WEEKLY,
            interval: 1,
            daysOfWeek: [7, 8], // 无效的星期
          },
        },
      });

      const result = task.validateDetailed();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('星期几配置无效，必须是0-6之间的数字');
    });

    it('应该处理无效的月份日期', () => {
      const task = new ScheduleTask({
        ...validTaskData,
        scheduling: {
          ...validTaskData.scheduling,
          recurrence: {
            type: RecurrenceType.MONTHLY,
            interval: 1,
            dayOfMonth: 32, // 无效的日期
          },
        },
      });

      const result = task.validateDetailed();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('月中日期配置无效，必须是1-31之间的数字');
    });

    it('应该要求自定义重复规则提供Cron表达式', () => {
      const task = new ScheduleTask({
        ...validTaskData,
        scheduling: {
          ...validTaskData.scheduling,
          recurrence: {
            type: RecurrenceType.CUSTOM,
            interval: 1,
            cronExpression: '', // 空表达式
          },
        },
      });

      const result = task.validateDetailed();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('自定义重复规则必须提供Cron表达式');
    });
  });
});
