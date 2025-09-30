/**
 * TaskTemplate 聚合根测试
 * @description 测试任务模板聚合根的业务逻辑
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TaskTemplate } from '../aggregates/TaskTemplate';
import { TestHelpers, TEST_CONSTANTS } from '../../test/setup';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';
import type { TaskContracts } from '@dailyuse/contracts';

describe('TaskTemplate 聚合根', () => {
  let validTaskTemplateParams: any;
  let taskTemplate: TaskTemplate;

  beforeEach(() => {
    // 设置固定的测试时间
    global.createMockDate(TEST_CONSTANTS.TEST_DATE);

    // 准备有效的任务模板参数
    validTaskTemplateParams = {
      accountUuid: TEST_CONSTANTS.TEST_ACCOUNT_UUID,
      title: '测试任务模板',
      description: '用于测试的任务模板',
      timeConfig: {
        time: {
          timeType: 'SCHEDULED' as TaskContracts.TaskTimeType,
          startTime: '09:00',
          endTime: '10:00',
        },
        date: {
          startDate: new Date(TEST_CONSTANTS.TOMORROW),
          endDate: new Date(new Date(TEST_CONSTANTS.TOMORROW).getTime() + 7 * 24 * 60 * 60 * 1000),
        },
        schedule: {
          mode: 'DAILY' as TaskContracts.TaskScheduleMode,
          intervalDays: 1,
        },
        timezone: 'Asia/Shanghai',
      },
      reminderConfig: {
        enabled: true,
        minutesBefore: 15,
        methods: ['notification', 'sound'] as ('notification' | 'sound')[],
      },
      properties: {
        importance: ImportanceLevel.Important,
        urgency: UrgencyLevel.Medium,
        location: '办公室',
        tags: ['工作', '重要'],
      },
      goalLinks: [],
    };

    taskTemplate = new TaskTemplate({
      uuid: TestHelpers.generateTestUuid('task-template'),
      ...validTaskTemplateParams,
    });
  });

  describe('聚合根创建', () => {
    it('应该成功创建任务模板', () => {
      expect(taskTemplate.uuid).toBeDefined();
      expect(taskTemplate.title).toBe('测试任务模板');
      expect(taskTemplate.accountUuid).toBe(TEST_CONSTANTS.TEST_ACCOUNT_UUID);
      expect(taskTemplate.lifecycle.createdAt).toBeInstanceOf(Date);
    });

    it('应该继承自 TaskTemplateCore', () => {
      expect(taskTemplate).toBeInstanceOf(TaskTemplate);
      expect(typeof taskTemplate.activate).toBe('function');
      expect(typeof taskTemplate.pause).toBe('function');
      expect(typeof taskTemplate.complete).toBe('function');
    });
  });

  describe('静态工厂方法', () => {
    it('应该从 DTO 创建任务模板实例', () => {
      const dto: TaskContracts.TaskTemplateDTO = {
        uuid: 'template-123',
        accountUuid: 'account-123',
        title: '从DTO创建的模板',
        description: 'DTO描述',
        timeConfig: {
          time: {
            timeType: 'SCHEDULED' as TaskContracts.TaskTimeType,
            startTime: '10:00',
            endTime: '11:00',
          },
          date: {
            startDate: TEST_CONSTANTS.TOMORROW,
            endDate: undefined,
          },
          schedule: {
            mode: 'WEEKLY' as TaskContracts.TaskScheduleMode,
            weekdays: [1, 3, 5],
          },
          timezone: 'UTC',
        },
        reminderConfig: {
          enabled: false,
          minutesBefore: 0,
          methods: [],
        },
        properties: {
          importance: ImportanceLevel.Minor,
          urgency: UrgencyLevel.Low,
          tags: ['测试'],
        },
        goalLinks: [],
        lifecycle: {
          createdAt: TEST_CONSTANTS.TEST_DATE,
          updatedAt: TEST_CONSTANTS.TEST_DATE,
          status: 'draft',
        },
        stats: {
          totalInstances: 0,
          completedInstances: 0,
          completionRate: 0,
        },
      };

      const template = TaskTemplate.fromDTO(dto);

      expect(template.uuid).toBe('template-123');
      expect(template.title).toBe('从DTO创建的模板');
      expect(template.accountUuid).toBe('account-123');
      expect(template.lifecycle.createdAt).toEqual(new Date(TEST_CONSTANTS.TEST_DATE));
    });

    it('应该使用 create 方法创建新模板并发布事件', () => {
      const template = TaskTemplate.create(validTaskTemplateParams);

      expect(template.uuid).toBeDefined();
      expect(template.title).toBe('测试任务模板');
      expect(template.domainEvents.length).toBeGreaterThan(0);

      const createdEvent = template.domainEvents.find((e) => e.eventType === 'TaskTemplateCreated');
      expect(createdEvent).toBeDefined();
      expect((createdEvent?.payload as any)?.title).toBe('测试任务模板');
    });
  });

  describe('状态管理', () => {
    it('应该允许激活草稿状态的模板', () => {
      // 新创建的模板默认为草稿状态
      const template = TaskTemplate.create(validTaskTemplateParams);

      expect(() => template.activate()).not.toThrow();
      expect(template.lifecycle.status).toBe('active');

      const activatedEvent = template.domainEvents.find(
        (e) => e.eventType === 'TaskTemplateActivated',
      );
      expect(activatedEvent).toBeDefined();
    });

    it('应该拒绝激活已激活的模板', () => {
      const template = TaskTemplate.create(validTaskTemplateParams);
      template.activate();

      expect(() => template.activate()).toThrow('只有草稿或暂停状态的模板才能被激活');
    });

    it('应该允许暂停激活状态的模板', () => {
      const template = TaskTemplate.create(validTaskTemplateParams);
      template.activate();

      expect(() => template.pause()).not.toThrow();
      expect(template.lifecycle.status).toBe('paused');

      const pausedEvent = template.domainEvents.find((e) => e.eventType === 'TaskTemplatePaused');
      expect(pausedEvent).toBeDefined();
    });

    it('应该拒绝暂停未激活的模板', () => {
      const template = TaskTemplate.create(validTaskTemplateParams);

      expect(() => template.pause()).toThrow('只有激活状态的模板才能被暂停');
    });

    it('应该允许从暂停状态重新激活模板', () => {
      const template = TaskTemplate.create(validTaskTemplateParams);
      template.activate();
      template.pause();

      expect(() => template.activate()).not.toThrow();
      expect(template.lifecycle.status).toBe('active');
    });

    it('应该允许完成任意状态的模板', () => {
      const template = TaskTemplate.create(validTaskTemplateParams);

      expect(() => template.complete()).not.toThrow();
      expect(template.lifecycle.status).toBe('completed');

      const completedEvent = template.domainEvents.find(
        (e) => e.eventType === 'TaskTemplateCompleted',
      );
      expect(completedEvent).toBeDefined();
    });

    it('应该拒绝重复完成模板', () => {
      const template = TaskTemplate.create(validTaskTemplateParams);
      template.complete();

      expect(() => template.complete()).toThrow('模板已经完成');
    });

    it('应该允许归档任意状态的模板', () => {
      const template = TaskTemplate.create(validTaskTemplateParams);

      expect(() => template.archive()).not.toThrow();
      expect(template.lifecycle.status).toBe('archived');

      const archivedEvent = template.domainEvents.find(
        (e) => e.eventType === 'TaskTemplateArchived',
      );
      expect(archivedEvent).toBeDefined();
    });

    it('应该拒绝重复归档模板', () => {
      const template = TaskTemplate.create(validTaskTemplateParams);
      template.archive();

      expect(() => template.archive()).toThrow('模板已经归档');
    });
  });

  describe('时间配置', () => {
    it('应该正确处理计划任务时间类型', () => {
      const template = TaskTemplate.create({
        ...validTaskTemplateParams,
        timeConfig: {
          ...validTaskTemplateParams.timeConfig,
          time: {
            timeType: 'SCHEDULED' as TaskContracts.TaskTimeType,
            startTime: '14:30',
            endTime: '15:30',
          },
        },
      });

      expect(template.timeConfig.time.timeType).toBe('SCHEDULED');
      expect(template.timeConfig.time.startTime).toBe('14:30');
      expect(template.timeConfig.time.endTime).toBe('15:30');
    });

    it('应该正确处理全天任务时间类型', () => {
      const template = TaskTemplate.create({
        ...validTaskTemplateParams,
        timeConfig: {
          ...validTaskTemplateParams.timeConfig,
          time: {
            timeType: 'ALL_DAY' as TaskContracts.TaskTimeType,
          },
        },
      });

      expect(template.timeConfig.time.timeType).toBe('ALL_DAY');
      expect(template.timeConfig.time.startTime).toBeUndefined();
      expect(template.timeConfig.time.endTime).toBeUndefined();
    });

    it('应该正确处理每日重复模式', () => {
      const template = TaskTemplate.create({
        ...validTaskTemplateParams,
        timeConfig: {
          ...validTaskTemplateParams.timeConfig,
          schedule: {
            mode: 'DAILY' as TaskContracts.TaskScheduleMode,
            intervalDays: 2,
          },
        },
      });

      expect(template.timeConfig.schedule.mode).toBe('DAILY');
      expect(template.timeConfig.schedule.intervalDays).toBe(2);
    });

    it('应该正确处理每周重复模式', () => {
      const template = TaskTemplate.create({
        ...validTaskTemplateParams,
        timeConfig: {
          ...validTaskTemplateParams.timeConfig,
          schedule: {
            mode: 'WEEKLY' as TaskContracts.TaskScheduleMode,
            weekdays: [1, 3, 5], // 周一、周三、周五
          },
        },
      });

      expect(template.timeConfig.schedule.mode).toBe('WEEKLY');
      expect(template.timeConfig.schedule.weekdays).toEqual([1, 3, 5]);
    });

    it('应该正确处理每月重复模式', () => {
      const template = TaskTemplate.create({
        ...validTaskTemplateParams,
        timeConfig: {
          ...validTaskTemplateParams.timeConfig,
          schedule: {
            mode: 'MONTHLY' as TaskContracts.TaskScheduleMode,
            monthDays: [1, 15], // 每月1号和15号
          },
        },
      });

      expect(template.timeConfig.schedule.mode).toBe('MONTHLY');
      expect(template.timeConfig.schedule.monthDays).toEqual([1, 15]);
    });
  });

  describe('提醒配置', () => {
    it('应该正确配置启用的提醒', () => {
      const template = TaskTemplate.create({
        ...validTaskTemplateParams,
        reminderConfig: {
          enabled: true,
          minutesBefore: 30,
          methods: ['notification', 'sound'],
        },
      });

      expect(template.reminderConfig?.enabled).toBe(true);
      expect(template.reminderConfig?.minutesBefore).toBe(30);
      expect(template.reminderConfig?.methods).toEqual(['notification', 'sound']);
    });

    it('应该正确配置禁用的提醒', () => {
      const template = TaskTemplate.create({
        ...validTaskTemplateParams,
        reminderConfig: {
          enabled: false,
          minutesBefore: 0,
          methods: [],
        },
      });

      expect(template.reminderConfig?.enabled).toBe(false);
      expect(template.reminderConfig?.minutesBefore).toBe(0);
      expect(template.reminderConfig?.methods).toEqual([]);
    });
  });

  describe('任务属性', () => {
    it('应该正确设置重要性和紧急性', () => {
      const template = TaskTemplate.create({
        ...validTaskTemplateParams,
        properties: {
          ...validTaskTemplateParams.properties,
          importance: ImportanceLevel.Important,
          urgency: UrgencyLevel.High,
        },
      });

      expect(template.properties?.importance).toBe(ImportanceLevel.Important);
      expect(template.properties?.urgency).toBe(UrgencyLevel.High);
    });

    it('应该正确处理标签和位置', () => {
      const template = TaskTemplate.create({
        ...validTaskTemplateParams,
        properties: {
          ...validTaskTemplateParams.properties,
          location: '家里',
          tags: ['个人', '健康', '锻炼'],
        },
      });

      expect(template.properties?.location).toBe('家里');
      expect(template.properties?.tags).toEqual(['个人', '健康', '锻炼']);
    });
  });

  describe('版本管理', () => {
    it('应该在状态变更时正确更新时间戳', async () => {
      // 创建一个带有真实时间的模板
      const currentTime = new Date();
      const paramsWithRealTime = {
        ...validTaskTemplateParams,
        // 不传递 createdAt 和 updatedAt，让构造函数使用当前时间
      };
      delete (paramsWithRealTime as any).createdAt;
      delete (paramsWithRealTime as any).updatedAt;

      const template = TaskTemplate.create(paramsWithRealTime);
      const initialUpdatedAt = template.lifecycle.updatedAt;

      // 等待足够长的时间确保时间变化
      await TestHelpers.wait(100);
      template.activate();
      expect(template.lifecycle.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());

      // 记录激活后的时间
      const activatedAt = template.lifecycle.updatedAt;

      await TestHelpers.wait(100);
      template.pause();
      expect(template.lifecycle.updatedAt.getTime()).toBeGreaterThan(activatedAt.getTime());
    });

    it('应该正确更新时间戳', () => {
      const template = TaskTemplate.create(validTaskTemplateParams);
      // 这个测试已经在上面的测试中覆盖了
    });
  });

  describe('领域事件', () => {
    it('应该在创建时发布 TaskTemplateCreated 事件', () => {
      const template = TaskTemplate.create(validTaskTemplateParams);

      const events = template.domainEvents;
      expect(events.length).toBeGreaterThan(0);

      const createdEvent = events.find((e) => e.eventType === 'TaskTemplateCreated');
      expect(createdEvent).toBeDefined();
      expect(createdEvent?.aggregateId).toBe(template.uuid);
      expect(createdEvent?.accountUuid).toBe(TEST_CONSTANTS.TEST_ACCOUNT_UUID);
    });

    it('应该在激活时发布 TaskTemplateActivated 事件', () => {
      const template = TaskTemplate.create(validTaskTemplateParams);
      template.clearDomainEvents(); // 清除创建事件

      template.activate();

      const events = template.domainEvents;
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe('TaskTemplateActivated');
    });

    it('应该在暂停时发布 TaskTemplatePaused 事件', () => {
      const template = TaskTemplate.create(validTaskTemplateParams);
      template.activate();
      template.clearDomainEvents();

      template.pause();

      const events = template.domainEvents;
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe('TaskTemplatePaused');
    });

    it('应该在完成时发布 TaskTemplateCompleted 事件', () => {
      const template = TaskTemplate.create(validTaskTemplateParams);
      template.clearDomainEvents();

      template.complete();

      const events = template.domainEvents;
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe('TaskTemplateCompleted');
    });

    it('应该在归档时发布 TaskTemplateArchived 事件', () => {
      const template = TaskTemplate.create(validTaskTemplateParams);
      template.clearDomainEvents();

      template.archive();

      const events = template.domainEvents;
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe('TaskTemplateArchived');
    });
  });

  describe('边界情况', () => {
    it('应该处理最小配置', () => {
      const minimalParams = {
        accountUuid: TEST_CONSTANTS.TEST_ACCOUNT_UUID,
        title: '最小任务',
        timeConfig: {
          time: {
            timeType: 'ALL_DAY' as TaskContracts.TaskTimeType,
          },
          date: {
            startDate: new Date(TEST_CONSTANTS.TOMORROW),
          },
          schedule: {
            mode: 'ONCE' as TaskContracts.TaskScheduleMode,
          },
          timezone: 'UTC',
        },
      };

      const template = TaskTemplate.create(minimalParams);

      expect(template.title).toBe('最小任务');
      expect(template.description).toBeUndefined();
      // reminderConfig 和 properties 在构造函数中会有默认值
      expect(template.reminderConfig.enabled).toBe(false);
      expect(template.properties.tags).toEqual([]);
    });

    it('应该处理空标签数组', () => {
      const template = TaskTemplate.create({
        ...validTaskTemplateParams,
        properties: {
          ...validTaskTemplateParams.properties,
          tags: [],
        },
      });

      expect(template.properties?.tags).toEqual([]);
    });

    it('应该处理未设置结束日期', () => {
      const template = TaskTemplate.create({
        ...validTaskTemplateParams,
        timeConfig: {
          ...validTaskTemplateParams.timeConfig,
          date: {
            startDate: new Date(TEST_CONSTANTS.TOMORROW),
            // 不设置 endDate
          },
        },
      });

      expect(template.timeConfig.date.startDate).toBeInstanceOf(Date);
      expect(template.timeConfig.date.endDate).toBeUndefined();
    });
  });
});
