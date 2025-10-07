import { describe, it, expect, beforeEach } from 'vitest';import { describe, it, expect, beforeEach } from 'vitest';

import { UpcomingReminderCalculator } from './UpcomingReminderCalculator';import { UpcomingReminderCalculator } from './UpcomingReminderCalculator';

import { ReminderTimeConfigType, ReminderPriority } from '@dailyuse/contracts';import { ReminderTimeConfigType, ReminderDurationUnit, ReminderPriority } from '@dailyuse/contracts';

import type { ReminderContracts } from '@dailyuse/contracts';import type { ReminderContracts } from '@dailyuse/contracts';



// 辅助函数：创建测试模板// 辅助函数：创建测试模板

function createTestTemplate(function createTestTemplate(

  overrides: Partial<ReminderContracts.ReminderTemplateClientDTO>,  overrides: Partial<ReminderContracts.ReminderTemplateClientDTO>,

): ReminderContracts.ReminderTemplateClientDTO {): ReminderContracts.ReminderTemplateClientDTO {

  return {  return {

    uuid: 'test-uuid',    uuid: 'test-uuid',

    name: '测试模板',    name: '测试模板',

    message: '测试消息',    message: '测试消息',

    enabled: true,    enabled: true,

    selfEnabled: true,    selfEnabled: true,

    effectiveEnabled: true,    effectiveEnabled: true, // 添加必需字段

    timeConfig: {    timeConfig: {

      type: ReminderTimeConfigType.DAILY,      type: ReminderTimeConfigType.DAILY,

      times: ['09:00'],      times: ['09:00'],

    },    },

    priority: ReminderPriority.NORMAL,    priority: ReminderPriority.NORMAL,

    category: 'test',    category: 'test',

    tags: [],    tags: [],

    displayOrder: 0,    displayOrder: 0,

    lifecycle: {    lifecycle: {

      createdAt: Date.now(),      createdAt: Date.now(),

      updatedAt: Date.now(),      updatedAt: Date.now(),

      triggerCount: 0,      triggerCount: 0,

    },    },

    analytics: {    analytics: {

      totalTriggers: 0,      totalTriggers: 0,

      acknowledgedCount: 0,      acknowledgedCount: 0,

      dismissedCount: 0,      dismissedCount: 0,

      snoozeCount: 0,      snoozeCount: 0,

    },    },

    version: 1,    version: 1,

    ...overrides,    ...overrides,

  };  };

}}



describe('UpcomingReminderCalculator', () => {describe('UpcomingReminderCalculator', () => {

  let calculator: UpcomingReminderCalculator;  let calculator: UpcomingReminderCalculator;



  beforeEach(() => {  beforeEach(() => {

    calculator = new UpcomingReminderCalculator();    calculator = new UpcomingReminderCalculator();

  });  });



  describe('calculateDailyNextTrigger', () => {  describe('calculateDailyNextTrigger', () => {

    it('应该计算今天未来的时间点', () => {    it('应该计算今天未来的时间点', () => {

      const template = createTestTemplate({      const template = createTestTemplate({

        uuid: 'test-1',        uuid: 'test-1',

        name: '每日提醒',        name: '每日提醒',

        timeConfig: {        timeConfig: {

          type: ReminderTimeConfigType.DAILY,          type: ReminderTimeConfigType.DAILY,

          times: ['09:00', '14:00', '18:00'],          times: ['09:00', '14:00', '18:00'],

        },        },

      });      });



      const nextTrigger = calculator.getNextTriggerTime(template);      const nextTrigger = calculator.getNextTriggerTime(template);

      expect(nextTrigger).not.toBeNull();      expect(nextTrigger).not.toBeNull();

      console.log('✅ Daily trigger calculated:', nextTrigger);      console.log('✅ Daily trigger calculated:', nextTrigger);

    });    });



    it('应该计算明天的第一个时间点（今天所有时间都已过）', () => {    it('应该计算明天的第一个时间点（今天所有时间都已过）', () => {

      const template = createTestTemplate({      const template = createTestTemplate({

        uuid: 'test-2',        uuid: 'test-2',

        name: '每日提醒',        name: '每日提醒',

        timeConfig: {        timeConfig: {

          type: ReminderTimeConfigType.DAILY,          type: ReminderTimeConfigType.DAILY,

          times: ['09:00', '14:00', '18:00'],          times: ['09:00', '14:00', '18:00'],

        },        },

      });      });



      const nextTrigger = calculator.getNextTriggerTime(template);      const nextTrigger = calculator.getNextTriggerTime(template);

      expect(nextTrigger).not.toBeNull();      expect(nextTrigger).not.toBeNull();

      console.log('✅ Daily trigger (tomorrow) calculated:', nextTrigger);      console.log('✅ Daily trigger (tomorrow) calculated:', nextTrigger);

    });    });

  });  });



  describe('calculateWeeklyNextTrigger', () => {  describe('calculateWeeklyNextTrigger', () => {

    it('应该计算本周未来的时间点', () => {    it('应该计算本周未来的时间点', () => {

      const template = createTestTemplate({      const template = createTestTemplate({

        uuid: 'test-3',        uuid: 'test-3',

        name: '每周提醒',        name: '每周提醒',

        timeConfig: {        timeConfig: {

          type: ReminderTimeConfigType.WEEKLY,          type: ReminderTimeConfigType.WEEKLY,

          times: ['14:00'],          times: ['14:00'],

          weekdays: [2, 4], // 周二、周四          weekdays: [2, 4], // 周二、周四

        },        },

      });      });



      const nextTrigger = calculator.getNextTriggerTime(template);      const nextTrigger = calculator.getNextTriggerTime(template);

      expect(nextTrigger).not.toBeNull();      expect(nextTrigger).not.toBeNull();

      console.log('✅ Weekly trigger calculated:', nextTrigger);      console.log('✅ Weekly trigger calculated:', nextTrigger);

    });    });

  });  });



  describe('calculateMonthlyNextTrigger', () => {  describe('calculateMonthlyNextTrigger', () => {

    it('应该计算本月未来的时间点', () => {    it('应该计算本月未来的时间点', () => {

      const template = createTestTemplate({      const template = createTestTemplate({

        uuid: 'test-5',        uuid: 'test-5',

        name: '每月提醒',        name: '每月提醒',

        timeConfig: {        timeConfig: {

          type: ReminderTimeConfigType.MONTHLY,          type: ReminderTimeConfigType.MONTHLY,

          times: ['14:00'],          times: ['14:00'],

          monthDays: [7, 15, 25],          monthDays: [7, 15, 25],

        },        },

      });      });



      const nextTrigger = calculator.getNextTriggerTime(template);      const nextTrigger = calculator.getNextTriggerTime(template);

      expect(nextTrigger).not.toBeNull();      expect(nextTrigger).not.toBeNull();

      console.log('✅ Monthly trigger calculated:', nextTrigger);      console.log('✅ Monthly trigger calculated:', nextTrigger);

    });    });

  });  });



  describe('calculateUpcomingReminders', () => {  describe('calculateUpcomingReminders', () => {

    it('应该返回启用模板的即将到来的提醒', () => {    it('应该返回启用模板的即将到来的提醒', () => {

      const templates = [      const templates = [

        createTestTemplate({        createTestTemplate({

          uuid: 'template-1',          uuid: 'template-1',

          name: '早会提醒',          name: '早会提醒',

          message: '准备早会',          message: '准备早会',

          timeConfig: {          timeConfig: {

            type: ReminderTimeConfigType.DAILY,            type: ReminderTimeConfigType.DAILY,

            times: ['09:00'],            times: ['09:00'],

          },          },

          priority: ReminderPriority.HIGH,          priority: ReminderPriority.HIGH,

          category: 'work',          category: 'work',

          tags: ['meeting'],          tags: ['meeting'],

        }),        }),

        createTestTemplate({        createTestTemplate({

          uuid: 'template-2',          uuid: 'template-2',

          name: '午餐提醒',          name: '午餐提醒',

          message: '该吃午饭了',          message: '该吃午饭了',

          timeConfig: {          timeConfig: {

            type: ReminderTimeConfigType.DAILY,            type: ReminderTimeConfigType.DAILY,

            times: ['12:00'],            times: ['12:00'],

          },          },

          priority: ReminderPriority.NORMAL,          priority: ReminderPriority.NORMAL,

          category: 'life',          category: 'life',

          tags: ['meal'],          tags: ['meal'],

        }),        }),

        createTestTemplate({        createTestTemplate({

          uuid: 'template-3',          uuid: 'template-3',

          name: '已禁用提醒',          name: '已禁用提醒',

          message: '不应该出现',          message: '不应该出现',

          enabled: false,          enabled: false,

          selfEnabled: false,          selfEnabled: false,

          effectiveEnabled: false,          effectiveEnabled: false,

          timeConfig: {          timeConfig: {

            type: ReminderTimeConfigType.DAILY,            type: ReminderTimeConfigType.DAILY,

            times: ['15:00'],            times: ['15:00'],

          },          },

          priority: ReminderPriority.LOW,          priority: ReminderPriority.LOW,

        }),        }),

      ];      ];



      const upcoming = calculator.calculateUpcomingReminders(templates, 10, 24);      const upcoming = calculator.calculateUpcomingReminders(templates, 10, 24);



      // 应该只有2个（禁用的不包含）      // 应该只有2个（禁用的不包含）

      expect(upcoming.length).toBe(2);      expect(upcoming.length).toBe(2);

      console.log('✅ Upcoming reminders:', upcoming);      console.log('✅ Upcoming reminders:', upcoming);

            

      // 验证字段完整性      // 验证字段完整性

      expect(upcoming[0]).toHaveProperty('templateUuid');      expect(upcoming[0]).toHaveProperty('templateUuid');

      expect(upcoming[0]).toHaveProperty('nextTriggerTime');      expect(upcoming[0]).toHaveProperty('nextTriggerTime');

      expect(upcoming[0]).toHaveProperty('priority');      expect(upcoming[0]).toHaveProperty('priority');

      expect(upcoming[0]).toHaveProperty('category');      expect(upcoming[0]).toHaveProperty('category');

      expect(upcoming[0]).toHaveProperty('tags');      expect(upcoming[0]).toHaveProperty('tags');

    });    });



    it('应该限制返回数量', () => {    it('应该限制返回数量', () => {

      const templates = Array.from({ length: 20 }, (_, i) =>      const templates = Array.from({ length: 20 }, (_, i) =>

        createTestTemplate({        createTestTemplate({

          uuid: `template-${i}`,          uuid: `template-${i}`,

          name: `提醒${i}`,          name: `提醒${i}`,

          message: `消息${i}`,          message: `消息${i}`,

          timeConfig: {          timeConfig: {

            type: ReminderTimeConfigType.DAILY,            type: ReminderTimeConfigType.DAILY,

            times: [`${(9 + i) % 24}:00`],            times: [`${9 + i}:00`],

          },          },

        }),        }),

      );      );



      const upcoming = calculator.calculateUpcomingReminders(templates, 5, 24);      const upcoming = calculator.calculateUpcomingReminders(templates, 5, 24);



      // 应该只返回5个      // 应该只返回5个

      expect(upcoming.length).toBeLessThanOrEqual(5);      expect(upcoming.length).toBeLessThanOrEqual(5);

      console.log(`✅ Limited to 5 reminders, got: ${upcoming.length}`);      console.log(`✅ Limited to 5 reminders, got: ${upcoming.length}`);

    });    });

  });  });



  describe('disabled templates', () => {  describe('disabled templates', () => {

    it('禁用的模板应该返回null', () => {    it('禁用的模板应该返回null', () => {

      const template = createTestTemplate({      const template = createTestTemplate({

        uuid: 'disabled-template',        uuid: 'disabled-template',

        name: '禁用提醒',        name: '禁用提醒',

        enabled: false,        enabled: false,

        selfEnabled: false,        selfEnabled: false,

        effectiveEnabled: false,        effectiveEnabled: false,

        timeConfig: {        timeConfig: {

          type: ReminderTimeConfigType.DAILY,          type: ReminderTimeConfigType.DAILY,

          times: ['09:00'],          times: ['09:00'],

        },        },

      });      });



      const nextTrigger = calculator.getNextTriggerTime(template);      const nextTrigger = calculator.getNextTriggerTime(template);

      expect(nextTrigger).toBeNull();      expect(nextTrigger).toBeNull();

      console.log('✅ Disabled template correctly returns null');      console.log('✅ Disabled template correctly returns null');

    });    });

  });  });

});});



  describe('calculateWeeklyNextTrigger', () => {
    it('应该计算本周未来的时间点', () => {
      // 2025-10-07 是星期二 (weekday = 2)
      const now = new Date('2025-10-07T10:00:00');
      const template: ReminderContracts.ReminderTemplateClientDTO = {
        uuid: 'test-3',
        name: '每周提醒',
        message: '测试消息',
        enabled: true,
        selfEnabled: true,
        timeConfig: {
          type: ReminderTimeConfigType.WEEKLY,
          times: ['14:00'],
          weekdays: [2, 4], // 周二、周四
        },
        priority: ReminderPriority.NORMAL,
        category: 'test',
        tags: [],
        displayOrder: 0,
        lifecycle: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
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

      const nextTrigger = calculator.getNextTriggerTime(template);

      expect(nextTrigger).not.toBeNull();
      if (nextTrigger) {
        // 应该返回今天14:00（周二）
        expect(nextTrigger.getHours()).toBe(14);
        expect(nextTrigger.getDate()).toBe(7); // 今天
        expect(nextTrigger.getDay()).toBe(2); // 周二
      }
    });

    it('应该计算下周的时间点（本周已过）', () => {
      // 2025-10-07 是星期二，15:00
      const now = new Date('2025-10-07T15:00:00');
      const template: ReminderContracts.ReminderTemplateClientDTO = {
        uuid: 'test-4',
        name: '每周提醒',
        message: '测试消息',
        enabled: true,
        selfEnabled: true,
        timeConfig: {
          type: ReminderTimeConfigType.WEEKLY,
          times: ['14:00'],
          weekdays: [2], // 仅周二
        },
        priority: ReminderPriority.NORMAL,
        category: 'test',
        tags: [],
        displayOrder: 0,
        lifecycle: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
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

      const nextTrigger = calculator.getNextTriggerTime(template);

      expect(nextTrigger).not.toBeNull();
      if (nextTrigger) {
        // 应该返回下周二14:00
        expect(nextTrigger.getHours()).toBe(14);
        expect(nextTrigger.getDate()).toBe(14); // 下周二
        expect(nextTrigger.getDay()).toBe(2); // 周二
      }
    });
  });

  describe('calculateMonthlyNextTrigger', () => {
    it('应该计算本月未来的时间点', () => {
      const now = new Date('2025-10-07T10:00:00');
      const template: ReminderContracts.ReminderTemplateClientDTO = {
        uuid: 'test-5',
        name: '每月提醒',
        message: '测试消息',
        enabled: true,
        selfEnabled: true,
        timeConfig: {
          type: ReminderTimeConfigType.MONTHLY,
          times: ['14:00'],
          monthDays: [7, 15, 25], // 每月7、15、25号
        },
        priority: ReminderPriority.NORMAL,
        category: 'test',
        tags: [],
        displayOrder: 0,
        lifecycle: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
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

      const nextTrigger = calculator.getNextTriggerTime(template);

      expect(nextTrigger).not.toBeNull();
      if (nextTrigger) {
        // 应该返回今天14:00（7号）
        expect(nextTrigger.getHours()).toBe(14);
        expect(nextTrigger.getDate()).toBe(7);
      }
    });

    it('应该计算下个月的时间点（本月已过）', () => {
      const now = new Date('2025-10-26T10:00:00');
      const template: ReminderContracts.ReminderTemplateClientDTO = {
        uuid: 'test-6',
        name: '每月提醒',
        message: '测试消息',
        enabled: true,
        selfEnabled: true,
        timeConfig: {
          type: ReminderTimeConfigType.MONTHLY,
          times: ['14:00'],
          monthDays: [7, 15, 25], // 全部已过
        },
        priority: ReminderPriority.NORMAL,
        category: 'test',
        tags: [],
        displayOrder: 0,
        lifecycle: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
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

      const nextTrigger = calculator.getNextTriggerTime(template);

      expect(nextTrigger).not.toBeNull();
      if (nextTrigger) {
        // 应该返回下个月7号14:00
        expect(nextTrigger.getHours()).toBe(14);
        expect(nextTrigger.getDate()).toBe(7);
        expect(nextTrigger.getMonth()).toBe(10); // 11月（0-based）
      }
    });
  });

  describe('calculateUpcomingReminders', () => {
    it('应该返回启用模板的即将到来的提醒', () => {
      const templates: ReminderContracts.ReminderTemplateClientDTO[] = [
        {
          uuid: 'template-1',
          name: '早会提醒',
          message: '准备早会',
          enabled: true,
          selfEnabled: true,
          timeConfig: {
            type: ReminderTimeConfigType.DAILY,
            times: ['09:00'],
          },
          priority: ReminderPriority.HIGH,
          category: 'work',
          tags: ['meeting'],
          displayOrder: 0,
          lifecycle: {
            createdAt: Date.now(),
            updatedAt: Date.now(),
            triggerCount: 0,
          },
          analytics: {
            totalTriggers: 0,
            acknowledgedCount: 0,
            dismissedCount: 0,
            snoozeCount: 0,
          },
          version: 1,
        },
        {
          uuid: 'template-2',
          name: '午餐提醒',
          message: '该吃午饭了',
          enabled: true,
          selfEnabled: true,
          timeConfig: {
            type: ReminderTimeConfigType.DAILY,
            times: ['12:00'],
          },
          priority: ReminderPriority.NORMAL,
          category: 'life',
          tags: ['meal'],
          displayOrder: 1,
          lifecycle: {
            createdAt: Date.now(),
            updatedAt: Date.now(),
            triggerCount: 0,
          },
          analytics: {
            totalTriggers: 0,
            acknowledgedCount: 0,
            dismissedCount: 0,
            snoozeCount: 0,
          },
          version: 1,
        },
        {
          uuid: 'template-3',
          name: '已禁用提醒',
          message: '不应该出现',
          enabled: false,
          selfEnabled: false,
          timeConfig: {
            type: ReminderTimeConfigType.DAILY,
            times: ['15:00'],
          },
          priority: ReminderPriority.LOW,
          category: 'test',
          tags: [],
          displayOrder: 2,
          lifecycle: {
            createdAt: Date.now(),
            updatedAt: Date.now(),
            triggerCount: 0,
          },
          analytics: {
            totalTriggers: 0,
            acknowledgedCount: 0,
            dismissedCount: 0,
            snoozeCount: 0,
          },
          version: 1,
        },
      ];

      const upcoming = calculator.calculateUpcomingReminders(templates, 10, 24);

      // 应该只有2个（禁用的不包含）
      expect(upcoming.length).toBe(2);
      
      // 应该按时间排序
      expect(upcoming[0].templateName).toBe('早会提醒');
      expect(upcoming[1].templateName).toBe('午餐提醒');
      
      // 验证字段完整性
      expect(upcoming[0]).toHaveProperty('templateUuid');
      expect(upcoming[0]).toHaveProperty('nextTriggerTime');
      expect(upcoming[0]).toHaveProperty('priority');
      expect(upcoming[0]).toHaveProperty('category');
      expect(upcoming[0]).toHaveProperty('tags');
    });

    it('应该限制返回数量', () => {
      const templates: ReminderContracts.ReminderTemplateClientDTO[] = Array.from(
        { length: 20 },
        (_, i) => ({
          uuid: `template-${i}`,
          name: `提醒${i}`,
          message: `消息${i}`,
          enabled: true,
          selfEnabled: true,
          timeConfig: {
            type: ReminderTimeConfigType.DAILY,
            times: [`${9 + i}:00`],
          },
          priority: ReminderPriority.NORMAL,
          category: 'test',
          tags: [],
          displayOrder: i,
          lifecycle: {
            createdAt: Date.now(),
            updatedAt: Date.now(),
            triggerCount: 0,
          },
          analytics: {
            totalTriggers: 0,
            acknowledgedCount: 0,
            dismissedCount: 0,
            snoozeCount: 0,
          },
          version: 1,
        }),
      );

      const upcoming = calculator.calculateUpcomingReminders(templates, 5, 24);

      // 应该只返回5个
      expect(upcoming.length).toBe(5);
    });

    it('应该根据时间窗口过滤', () => {
      const now = new Date('2025-10-07T10:00:00');
      const templates: ReminderContracts.ReminderTemplateClientDTO[] = [
        {
          uuid: 'near-template',
          name: '近期提醒',
          message: '1小时后',
          enabled: true,
          selfEnabled: true,
          timeConfig: {
            type: ReminderTimeConfigType.DAILY,
            times: ['11:00'], // 1小时后
          },
          priority: ReminderPriority.NORMAL,
          category: 'test',
          tags: [],
          displayOrder: 0,
          lifecycle: {
            createdAt: Date.now(),
            updatedAt: Date.now(),
            triggerCount: 0,
          },
          analytics: {
            totalTriggers: 0,
            acknowledgedCount: 0,
            dismissedCount: 0,
            snoozeCount: 0,
          },
          version: 1,
        },
      ];

      // 时间窗口2小时，应该包含
      const upcoming2h = calculator.calculateUpcomingReminders(templates, 10, 2);
      expect(upcoming2h.length).toBe(1);

      // 时间窗口0.5小时，应该不包含（1小时后的提醒）
      const upcoming30min = calculator.calculateUpcomingReminders(templates, 10, 0.5);
      expect(upcoming30min.length).toBe(0);
    });
  });

  describe('disabled templates', () => {
    it('禁用的模板应该返回null', () => {
      const template: ReminderContracts.ReminderTemplateClientDTO = {
        uuid: 'disabled-template',
        name: '禁用提醒',
        message: '不应该触发',
        enabled: false,
        selfEnabled: false,
        timeConfig: {
          type: ReminderTimeConfigType.DAILY,
          times: ['09:00'],
        },
        priority: ReminderPriority.NORMAL,
        category: 'test',
        tags: [],
        displayOrder: 0,
        lifecycle: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
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

      const nextTrigger = calculator.getNextTriggerTime(template);
      expect(nextTrigger).toBeNull();
    });
  });
});
