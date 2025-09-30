import { describe, it, expect, beforeEach } from 'vitest';
import { ReminderTemplate } from './ReminderTemplate';
import { ReminderContracts, ImportanceLevel } from '@dailyuse/contracts';
import { TestHelpers, TEST_CONSTANTS } from '../../test/setup';

describe('ReminderTemplate 聚合根', () => {
  // 有效的提醒模板参数
  const validReminderTemplateParams = {
    uuid: TestHelpers.generateTestUuid('reminder-template'),
    name: '测试提醒模板',
    description: '这是一个测试提醒模板',
    message: '提醒消息内容',
    enabled: true,
    selfEnabled: true,
    importanceLevel: ImportanceLevel.Important,
    timeConfig: {
      type: 'daily' as ReminderContracts.ReminderTimeType,
      times: ['09:00'],
      interval: 1,
    } as ReminderContracts.ReminderTimeConfig,
    priority: ReminderContracts.ReminderPriority.NORMAL,
    category: 'work',
    tags: ['测试', '工作'],
    icon: 'bell',
    color: '#FF6B6B',
    position: { x: 100, y: 200 },
    displayOrder: 1,
    notificationSettings: {
      sound: true,
      vibration: false,
      popup: true,
      soundFile: 'default',
      customIcon: 'bell',
    },
    snoozeConfig: {
      enabled: true,
      defaultMinutes: 5,
      maxCount: 3,
      presetOptions: [
        { label: '5分钟', minutes: 5 },
        { label: '10分钟', minutes: 10 },
        { label: '15分钟', minutes: 15 },
      ],
    },
    lifecycle: {
      createdAt: new Date(TEST_CONSTANTS.TEST_DATE),
      updatedAt: new Date(TEST_CONSTANTS.TEST_DATE),
      triggerCount: 0,
    },
    analytics: {
      totalTriggers: 0,
      acknowledgedCount: 0,
      dismissedCount: 0,
      snoozeCount: 0,
    },
    version: 1,
  };

  describe('聚合根创建', () => {
    it('应该成功创建提醒模板', () => {
      const reminderTemplate = new ReminderTemplate(validReminderTemplateParams);

      expect(reminderTemplate).toBeInstanceOf(ReminderTemplate);
      expect(reminderTemplate.uuid).toBe(validReminderTemplateParams.uuid);
      expect(reminderTemplate.name).toBe('测试提醒模板');
      expect(reminderTemplate.enabled).toBe(true);
    });

    it('应该正确设置默认值', () => {
      const minimalParams = {
        name: '最小提醒模板',
        message: '最小消息',
        timeConfig: {
          type: 'daily',
          times: ['10:00'],
          timezone: 'UTC',
        } as ReminderContracts.ReminderTimeConfig,
      };

      const reminderTemplate = new ReminderTemplate(minimalParams);

      expect(reminderTemplate.enabled).toBe(true); // 默认启用
      expect(reminderTemplate.selfEnabled).toBe(true); // 默认启用
      expect(reminderTemplate.priority).toBe(ReminderContracts.ReminderPriority.NORMAL);
      expect(reminderTemplate.category).toBe('');
      expect(reminderTemplate.tags).toEqual([]);
      expect(reminderTemplate.instances).toEqual([]);
    });
  });

  describe('静态工厂方法', () => {
    it('应该从 DTO 创建提醒模板实例', () => {
      const dto: ReminderContracts.IReminderTemplate = {
        uuid: 'template-123',
        name: '从DTO创建的模板',
        description: 'DTO描述',
        message: 'DTO消息',
        enabled: true,
        selfEnabled: true,
        importanceLevel: ImportanceLevel.Important,
        timeConfig: {
          type: 'weekly',
          times: ['14:00'],
          weekdays: [1, 3, 5], // 周一、三、五
        },
        priority: ReminderContracts.ReminderPriority.HIGH,
        category: 'personal',
        tags: ['重要'],
        lifecycle: {
          createdAt: new Date(TEST_CONSTANTS.TEST_DATE),
          updatedAt: new Date(TEST_CONSTANTS.TEST_DATE),
          triggerCount: 5,
        },
        analytics: {
          totalTriggers: 10,
          acknowledgedCount: 8,
          dismissedCount: 2,
          snoozeCount: 3,
          avgResponseTime: 15.5,
        },
        version: 2,
      };

      const template = ReminderTemplate.fromDTO(dto);

      expect(template.uuid).toBe('template-123');
      expect(template.name).toBe('从DTO创建的模板');
      expect(template.analytics.totalTriggers).toBe(10);
    });
  });

  describe('时间配置管理', () => {
    it('应该正确处理每日提醒时间配置', () => {
      const dailyTemplate = new ReminderTemplate({
        ...validReminderTemplateParams,
        timeConfig: {
          type: 'daily',
          times: ['09:00', '14:00', '20:00'],
        },
      });

      expect(dailyTemplate.timeConfig.type).toBe('daily');
      expect(dailyTemplate.timeConfig.times).toEqual(['09:00', '14:00', '20:00']);
    });

    it('应该正确处理每周提醒时间配置', () => {
      const weeklyTemplate = new ReminderTemplate({
        ...validReminderTemplateParams,
        timeConfig: {
          type: 'weekly',
          times: ['10:00'],
          timezone: 'UTC',
          weekdays: [1, 3, 5], // 周一、三、五
        },
      });

      expect(weeklyTemplate.timeConfig.type).toBe('weekly');
      expect(weeklyTemplate.timeConfig.weekdays).toEqual([1, 3, 5]);
    });

    it('应该正确处理每月提醒时间配置', () => {
      const monthlyTemplate = new ReminderTemplate({
        ...validReminderTemplateParams,
        timeConfig: {
          type: 'monthly',
          times: ['12:00'],
          monthDays: [1, 15], // 每月1日和15日
        },
      });

      expect(monthlyTemplate.timeConfig.type).toBe('monthly');
      expect(monthlyTemplate.timeConfig.monthDays).toEqual([1, 15]);
    });

    it('应该正确处理绝对时间提醒配置', () => {
      const absoluteTemplate = new ReminderTemplate({
        ...validReminderTemplateParams,
        timeConfig: {
          type: 'absolute',
          times: ['2025-12-31T23:59:59.000Z'],
          timezone: 'UTC',
        },
      });

      expect(absoluteTemplate.timeConfig.type).toBe('absolute');
      expect(absoluteTemplate.timeConfig.times).toEqual(['2025-12-31T23:59:59.000Z']);
    });
  });

  describe('提醒实例管理', () => {
    let reminderTemplate: ReminderTemplate;

    beforeEach(() => {
      reminderTemplate = new ReminderTemplate(validReminderTemplateParams);
    });

    it('应该能够创建提醒实例', () => {
      const triggerTime = new Date('2025-01-15T09:00:00.000Z');
      const context = { title: '自定义标题' };

      const instanceUuid = reminderTemplate.createInstance(triggerTime, context);

      expect(instanceUuid).toBeDefined();
      expect(reminderTemplate.instances).toHaveLength(1);

      const instance = reminderTemplate.getInstance(instanceUuid);
      expect(instance).toBeDefined();
      expect(instance?.scheduledTime).toEqual(triggerTime);
    });

    it('应该能够获取指定的提醒实例', () => {
      const instanceUuid = reminderTemplate.createInstance(new Date());

      const instance = reminderTemplate.getInstance(instanceUuid);

      expect(instance).toBeDefined();
      expect(instance?.uuid).toBe(instanceUuid);
    });

    it('应该能够删除提醒实例', () => {
      const instanceUuid = reminderTemplate.createInstance(new Date());
      expect(reminderTemplate.instances).toHaveLength(1);

      reminderTemplate.removeInstance(instanceUuid);

      expect(reminderTemplate.instances).toHaveLength(0);
      expect(reminderTemplate.getInstance(instanceUuid)).toBeUndefined();
    });

    it('删除不存在的实例时应该抛出错误', () => {
      expect(() => {
        reminderTemplate.removeInstance('non-existent-uuid');
      }).toThrow('提醒实例不存在: non-existent-uuid');
    });
  });

  describe('提醒触发逻辑', () => {
    let reminderTemplate: ReminderTemplate;

    beforeEach(() => {
      reminderTemplate = new ReminderTemplate(validReminderTemplateParams);
    });

    it('应该能够触发提醒实例', () => {
      const instanceUuid = reminderTemplate.createInstance(new Date());
      const initialTriggerCount = reminderTemplate.analytics.totalTriggers;

      reminderTemplate.triggerReminder(instanceUuid);

      expect(reminderTemplate.analytics.totalTriggers).toBe(initialTriggerCount + 1);
      expect(reminderTemplate.lifecycle.lastTriggered).toBeDefined();
      expect(reminderTemplate.lifecycle.triggerCount).toBeGreaterThan(0);
    });

    it('触发不存在的实例时应该抛出错误', () => {
      expect(() => {
        reminderTemplate.triggerReminder('non-existent-uuid');
      }).toThrow('提醒实例不存在: non-existent-uuid');
    });
  });

  describe('下次触发时间计算', () => {
    it('应该正确计算每日提醒的下次触发时间', () => {
      const dailyTemplate = new ReminderTemplate({
        ...validReminderTemplateParams,
        timeConfig: {
          type: 'daily',
          times: ['09:00'],
          timezone: 'UTC',
        },
      });

      const baseTime = new Date('2025-01-15T08:00:00.000Z'); // 早上8点
      const nextTrigger = dailyTemplate.getNextTriggerTime(baseTime);

      expect(nextTrigger).toBeDefined();
      expect(nextTrigger?.getUTCHours()).toBe(9);
      expect(nextTrigger?.getUTCMinutes()).toBe(0);
    });

    it('如果当天时间已过，应该设置为次日', () => {
      const dailyTemplate = new ReminderTemplate({
        ...validReminderTemplateParams,
        timeConfig: {
          type: 'daily',
          times: ['09:00'],
          timezone: 'UTC',
        },
      });

      const baseTime = new Date('2025-01-15T10:00:00.000Z'); // 早上10点，已过9点
      const nextTrigger = dailyTemplate.getNextTriggerTime(baseTime);

      expect(nextTrigger).toBeDefined();
      expect(nextTrigger?.getUTCDate()).toBe(16); // 次日
      expect(nextTrigger?.getUTCHours()).toBe(9);
    });

    it('应该正确计算每周提醒的下次触发时间', () => {
      const weeklyTemplate = new ReminderTemplate({
        ...validReminderTemplateParams,
        timeConfig: {
          type: 'weekly',
          times: ['10:00'],
          timezone: 'UTC',
          weekdays: [1], // 周一
        },
      });

      const baseTime = new Date('2025-01-15T08:00:00.000Z'); // 周三
      const nextTrigger = weeklyTemplate.getNextTriggerTime(baseTime);

      expect(nextTrigger).toBeDefined();
      // 应该是下周的时间
      expect(nextTrigger!.getTime()).toBeGreaterThan(baseTime.getTime());
    });

    it('应该正确处理绝对时间提醒', () => {
      const absoluteTemplate = new ReminderTemplate({
        ...validReminderTemplateParams,
        timeConfig: {
          type: 'absolute',
          times: ['2025-12-31T23:59:59.000Z'],
          timezone: 'UTC',
        },
      });

      const baseTime = new Date('2025-01-15T08:00:00.000Z');
      const nextTrigger = absoluteTemplate.getNextTriggerTime(baseTime);

      expect(nextTrigger).toBeDefined();
      expect(nextTrigger?.toISOString()).toBe('2025-12-31T23:59:59.000Z');
    });

    it('绝对时间提醒触发过后应该返回null', () => {
      const absoluteTemplate = new ReminderTemplate({
        ...validReminderTemplateParams,
        timeConfig: {
          type: 'absolute',
          times: ['2025-12-31T23:59:59.000Z'],
          timezone: 'UTC',
        },
        analytics: {
          ...validReminderTemplateParams.analytics,
          totalTriggers: 1, // 已经触发过
        },
      });

      const baseTime = new Date('2025-01-15T08:00:00.000Z');
      const nextTrigger = absoluteTemplate.getNextTriggerTime(baseTime);

      expect(nextTrigger).toBeNull();
    });
  });

  describe('通知设置', () => {
    it('应该正确配置声音通知', () => {
      const template = new ReminderTemplate({
        ...validReminderTemplateParams,
        notificationSettings: {
          sound: true,
          vibration: false,
          popup: false,
          soundFile: 'alert.wav',
        },
      });

      expect(template.notificationSettings?.sound).toBe(true);
      expect(template.notificationSettings?.soundFile).toBe('alert.wav');
      expect(template.notificationSettings?.popup).toBe(false);
    });

    it('应该正确配置视觉通知', () => {
      const template = new ReminderTemplate({
        ...validReminderTemplateParams,
        notificationSettings: {
          sound: false,
          vibration: false,
          popup: true,
        },
      });

      expect(template.notificationSettings?.popup).toBe(true);
      expect(template.notificationSettings?.sound).toBe(false);
    });
  });

  describe('贪睡配置', () => {
    it('应该正确配置贪睡设置', () => {
      const template = new ReminderTemplate({
        ...validReminderTemplateParams,
        snoozeConfig: {
          enabled: true,
          defaultMinutes: 10,
          maxCount: 5,
          presetOptions: [
            { label: '5分钟', minutes: 5 },
            { label: '10分钟', minutes: 10 },
            { label: '15分钟', minutes: 15 },
            { label: '30分钟', minutes: 30 },
          ],
        },
      });

      expect(template.snoozeConfig?.enabled).toBe(true);
      expect(template.snoozeConfig?.defaultMinutes).toBe(10);
      expect(template.snoozeConfig?.maxCount).toBe(5);
      expect(template.snoozeConfig?.presetOptions).toHaveLength(4);
    });

    it('应该正确处理禁用的贪睡配置', () => {
      const template = new ReminderTemplate({
        ...validReminderTemplateParams,
        snoozeConfig: {
          enabled: false,
          defaultMinutes: 5,
          maxCount: 0,
          presetOptions: [],
        },
      });

      expect(template.snoozeConfig?.enabled).toBe(false);
      expect(template.snoozeConfig?.maxCount).toBe(0);
    });
  });

  describe('模板克隆', () => {
    it('应该能够克隆提醒模板', () => {
      const originalTemplate = new ReminderTemplate(validReminderTemplateParams);

      const clonedTemplate = originalTemplate.clone();

      expect(clonedTemplate).toBeInstanceOf(ReminderTemplate);
      expect(clonedTemplate.uuid).toBe(originalTemplate.uuid);
      expect(clonedTemplate.name).toBe(originalTemplate.name);
      expect(clonedTemplate.timeConfig).toEqual(originalTemplate.timeConfig);

      // 确保是深拷贝，修改克隆的模板不会影响原模板
      expect(clonedTemplate).not.toBe(originalTemplate);
    });
  });

  describe('边界情况', () => {
    it('应该处理空的时间配置数组', () => {
      const template = new ReminderTemplate({
        ...validReminderTemplateParams,
        timeConfig: {
          type: 'daily',
          times: [],
          timezone: 'UTC',
        },
      });

      expect(template.timeConfig.times).toEqual([]);
    });

    it('应该处理空标签数组', () => {
      const template = new ReminderTemplate({
        ...validReminderTemplateParams,
        tags: [],
      });

      expect(template.tags).toEqual([]);
    });

    it('应该处理未设置通知配置的情况', () => {
      const template = new ReminderTemplate({
        name: '简单提醒',
        message: '简单消息',
        timeConfig: {
          type: 'daily',
          times: ['09:00'],
          timezone: 'UTC',
        },
      });

      expect(template.notificationSettings).toBeUndefined();
    });

    it('应该处理未设置贪睡配置的情况', () => {
      const template = new ReminderTemplate({
        name: '简单提醒',
        message: '简单消息',
        timeConfig: {
          type: 'daily',
          times: ['09:00'],
          timezone: 'UTC',
        },
      });

      expect(template.snoozeConfig).toBeUndefined();
    });
  });

  describe('统计信息', () => {
    let reminderTemplate: ReminderTemplate;

    beforeEach(() => {
      reminderTemplate = new ReminderTemplate(validReminderTemplateParams);
    });

    it('应该正确更新触发统计', () => {
      const instanceUuid = reminderTemplate.createInstance(new Date());
      const initialTriggers = reminderTemplate.analytics.totalTriggers;

      reminderTemplate.triggerReminder(instanceUuid);

      expect(reminderTemplate.analytics.totalTriggers).toBe(initialTriggers + 1);
      expect(reminderTemplate.lifecycle.triggerCount).toBeGreaterThan(0);
    });

    it('应该正确记录最后触发时间', () => {
      const instanceUuid = reminderTemplate.createInstance(new Date());
      const beforeTrigger = new Date();

      reminderTemplate.triggerReminder(instanceUuid);

      expect(reminderTemplate.lifecycle.lastTriggered).toBeDefined();
      expect(reminderTemplate.lifecycle.lastTriggered!.getTime()).toBeGreaterThanOrEqual(
        beforeTrigger.getTime(),
      );
    });
  });
});
