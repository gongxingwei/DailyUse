// src/modules/Task/utils/taskTemplateFactory.ts
import { TaskMetaTemplate } from '../aggregates/taskMetaTemplate';
import { addMinutes } from 'date-fns';
import { ImportanceLevel } from "@common/shared/types/importance";
import { UrgencyLevel } from "@common/shared/types/urgency";
import { v4 as uuidv4 } from 'uuid';

export class TaskMetaTemplateFactory {
  /**
   * 空白模板
   */
  static createEmpty(): TaskMetaTemplate {
    return new TaskMetaTemplate({
      name: '空白模板',
      category: 'general',
      description: '从零开始创建自定义任务模板',
      defaultTimeConfig: {
        type: 'timed',
        baseTime: {
          start: new Date(),
          end: addMinutes(new Date(), 60), // 默认持续时间为60分钟
          duration: 60 // 默认持续时间为60分钟
        },
        recurrence: {
          type: 'none',
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dstHandling: 'ignore'
      },
      defaultReminderConfig: {
        enabled: false,
        alerts: [],
        snooze: {
          enabled: false,
          interval: 5,
          maxCount: 1
        }
      },
      defaultMetadata: {
        category: 'general',
        tags: [],
        importance: ImportanceLevel.Moderate,
        urgency: UrgencyLevel.Medium,
        estimatedDuration: 60
      }
    });
  }

  /**
   * 习惯养成模板
   */
  static createHabit(): TaskMetaTemplate {
    return new TaskMetaTemplate({
      name: '习惯养成',
      category: 'habit',
      description: '建立日常习惯，追踪进度',
      defaultTimeConfig: {
        type: 'timed',
        baseTime: {
          start: new Date(),
          end: addMinutes(new Date(), 30), // 默认持续时间为30分钟
          duration: 30
        },
        recurrence: {
          type: 'daily',
          interval: 1,
          endCondition: {
            type: 'count',
            count: 21
          }
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dstHandling: 'ignore'
      },
      defaultReminderConfig: {
        enabled: true,
        alerts: [{
          uuid: uuidv4(),
          timing: {
            type: 'relative',
            minutesBefore: 15
          },
          type: 'notification',
          message: '是时候培养好习惯了！'
        }],
        snooze: {
          enabled: true,
          interval: 5,
          maxCount: 3
        }
      },
      defaultMetadata: {
        category: 'habit',
        tags: ['习惯', '自我提升'],
        importance: ImportanceLevel.Moderate,
        urgency: UrgencyLevel.Medium,
        estimatedDuration: 30
      }
    });
  }

  /**
   * 事件提醒模板
   */
  static createEvent(): TaskMetaTemplate {
    return new TaskMetaTemplate({
      name: '事件提醒',
      category: 'event',
      description: '重要事件和约会提醒',
      defaultTimeConfig: {
        type: 'timed',
        baseTime: {
          start: new Date(),
          duration: 60
        },
        recurrence: {
          type: 'none',
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dstHandling: 'ignore'
      },
      defaultReminderConfig: {
        enabled: true,
        alerts: [
          {
            uuid: uuidv4(),
            timing: {
              type: 'relative',
              minutesBefore: 60
            },
            type: 'notification',
            message: '1小时后有重要事件'
          },
          {
            uuid: uuidv4(),
            timing: {
              type: 'relative',
              minutesBefore: 15
            },
            type: 'notification',
            message: '15分钟后事件开始'
          }
        ],
        snooze: {
          enabled: false,
          interval: 5,
          maxCount: 1
        }
      },
      defaultMetadata: {
        category: 'event',
        tags: ['事件', '约会'],
        importance: ImportanceLevel.Important,
        urgency: UrgencyLevel.High,
        estimatedDuration: 60
      }
    });
  }

  /**
   * 截止任务模板
   */
  static createDeadline(): TaskMetaTemplate {
    return new TaskMetaTemplate({
      name: '截止任务',
      category: 'deadline',
      description: '有明确截止日期的任务',
      defaultTimeConfig: {
        type: 'timed',
        baseTime: {
          start: new Date(),
          end: addMinutes(new Date(), 120), // 默认持续时间为2小时
          duration: 120
        },
        recurrence: {
          type: 'none',
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dstHandling: 'ignore'
      },
      defaultReminderConfig: {
        enabled: true,
        alerts: [
          {
            uuid: uuidv4(),
            timing: {
              type: 'relative',
              minutesBefore: 1440 // 1天前
            },
            type: 'notification',
            message: '任务截止日期临近！'
          },
          {
            uuid: uuidv4(),
            timing: {
              type: 'relative',
              minutesBefore: 120 // 2小时前
            },
            type: 'notification',
            message: '任务即将到期，请尽快完成！'
          }
        ],
        snooze: {
          enabled: true,
          interval: 30,
          maxCount: 2
        }
      },
      defaultMetadata: {
        category: 'deadline',
        tags: ['截止', '紧急'],
        importance: ImportanceLevel.Important,
        urgency: UrgencyLevel.High,
        estimatedDuration: 180
      }
    });
  }

  /**
   * 会议安排模板
   */
  static createMeeting(): TaskMetaTemplate {
    return new TaskMetaTemplate({
      name: '会议安排',
      category: 'meeting',
      description: '定期会议和团队协作',
      defaultTimeConfig: {
        type: 'timed',
        baseTime: {
          start: new Date(),
          end: addMinutes(new Date(), 60), // 默认持续时间为60分钟
          duration: 60
        },
        recurrence: {
          type: 'weekly',
          interval: 1,
          endCondition: { type: 'never' }
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dstHandling: 'ignore'
      },
      defaultReminderConfig: {
        enabled: true,
        alerts: [
          {
            uuid: uuidv4(),
            timing: {
              type: 'relative',
              minutesBefore: 15
            },
            type: 'notification',
            message: '会议即将开始，请准备相关材料'
          },
          {
            uuid: uuidv4(),
            timing: {
              type: 'relative',
              minutesBefore: 5
            },
            type: 'notification',
            message: '会议马上开始！'
          }
        ],
        snooze: {
          enabled: false,
          interval: 5,
          maxCount: 1
        }
      },
      defaultMetadata: {
        category: 'meeting',
        tags: ['会议', '团队'],
        importance: ImportanceLevel.Moderate,
        urgency: UrgencyLevel.Medium,
        estimatedDuration: 60
      }
    });
  }
  
}