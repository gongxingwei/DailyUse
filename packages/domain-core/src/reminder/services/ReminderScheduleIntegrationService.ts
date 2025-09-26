import type { ReminderContracts } from '@dailyuse/contracts';
import {
  ScheduleTaskType,
  SchedulePriority,
  AlertMethod,
  RecurrenceType,
} from '@dailyuse/contracts';
import { eventBus } from '@dailyuse/utils';

/**
 * Reminder-Schedule 集成服务
 *
 * 职责：
 * 1. 处理 ReminderTemplate 状态变化对 Schedule 系统的影响
 * 2. 优雅地同步 reminderTemplate 到服务器调度系统
 * 3. 提供错误恢复和状态同步机制
 */
export class ReminderScheduleIntegrationService {
  private static instance: ReminderScheduleIntegrationService;

  private constructor() {}

  static getInstance(): ReminderScheduleIntegrationService {
    if (!ReminderScheduleIntegrationService.instance) {
      ReminderScheduleIntegrationService.instance = new ReminderScheduleIntegrationService();
    }
    return ReminderScheduleIntegrationService.instance;
  }

  // ===== ReminderTemplate 状态变化处理 =====

  /**
   * 处理 ReminderTemplate 启用/禁用状态变化
   */
  async handleTemplateStatusChange(params: {
    templateUuid: string;
    oldEnabled: boolean;
    newEnabled: boolean;
    template?: ReminderContracts.IReminderTemplate;
    accountUuid: string;
  }): Promise<{
    success: boolean;
    scheduleTaskId?: string;
    error?: string;
  }> {
    try {
      const { templateUuid, oldEnabled, newEnabled, template, accountUuid } = params;

      if (oldEnabled === newEnabled) {
        return { success: true };
      }

      if (newEnabled) {
        // 启用模板 - 创建调度任务
        return await this.createScheduleForTemplate({
          template: template!,
          accountUuid,
        });
      } else {
        // 禁用模板 - 取消调度任务
        return await this.cancelScheduleForTemplate({
          templateUuid,
          accountUuid,
        });
      }
    } catch (error) {
      console.error('处理 ReminderTemplate 状态变化失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  /**
   * 处理 ReminderTemplate 时间配置变化
   */
  async handleTemplateTimeConfigChange(params: {
    templateUuid: string;
    oldTimeConfig?: ReminderContracts.ReminderTimeConfig;
    newTimeConfig: ReminderContracts.ReminderTimeConfig;
    template: ReminderContracts.IReminderTemplate;
    accountUuid: string;
  }): Promise<{
    success: boolean;
    scheduleTaskId?: string;
    error?: string;
  }> {
    try {
      const { templateUuid, newTimeConfig, template, accountUuid } = params;

      // 如果模板未启用，不需要处理调度
      if (!template.enabled) {
        return { success: true };
      }

      // 取消现有调度
      await this.cancelScheduleForTemplate({
        templateUuid,
        accountUuid,
      });

      // 使用新的时间配置创建调度
      return await this.createScheduleForTemplate({
        template,
        accountUuid,
      });
    } catch (error) {
      console.error('处理 ReminderTemplate 时间配置变化失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  /**
   * 处理 ReminderTemplate 删除
   */
  async handleTemplateDeleted(params: { templateUuid: string; accountUuid: string }): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      return await this.cancelScheduleForTemplate(params);
    } catch (error) {
      console.error('处理 ReminderTemplate 删除失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  // ===== Schedule 系统交互 =====

  /**
   * 为 ReminderTemplate 创建调度任务
   */
  async createScheduleForTemplate(params: {
    template: ReminderContracts.IReminderTemplate;
    accountUuid: string;
  }): Promise<{
    success: boolean;
    scheduleTaskId?: string;
    error?: string;
  }> {
    try {
      const { template, accountUuid } = params;

      // 计算下一次触发时间
      const nextTriggerTime = this.calculateNextTriggerTime(template.timeConfig);
      if (!nextTriggerTime) {
        return {
          success: false,
          error: '无法计算下一次触发时间',
        };
      }

      // 创建调度任务
      const scheduleRequest = {
        type: ScheduleTaskType.GENERAL_REMINDER,
        taskId: template.uuid,
        title: template.name,
        description: template.description || `提醒模板: ${template.name}`,
        triggerTime: nextTriggerTime,
        priority: this.mapReminderPriorityToSchedule(template.priority),
        metadata: {
          templateUuid: template.uuid,
          templateName: template.name,
          message: template.message,
          category: template.category,
          tags: template.tags,
          sourceModule: 'reminder',
        },
        alertConfig: {
          methods: this.mapNotificationToAlertMethods(template.notificationSettings),
          allowSnooze: true,
          snoozeOptions: [5, 15, 30, 60],
          customActions: [
            {
              action: 'acknowledge',
              label: '确认',
              style: 'primary' as const,
            },
            {
              action: 'snooze',
              label: '稍后提醒',
              style: 'secondary' as const,
            },
            {
              action: 'dismiss',
              label: '忽略',
              style: 'danger' as const,
            },
          ],
        },
        recurrence: this.mapTimeConfigToRepeatConfig(template.timeConfig),
        createdBy: accountUuid,
      };

      // 通过事件系统请求创建调度任务
      const result = await eventBus.invoke('schedule:createTask', scheduleRequest);

      if (result.success) {
        // 发布 ReminderTemplate 调度创建事件
        eventBus.emit('reminder:schedule-created', {
          templateUuid: template.uuid,
          scheduleTaskId: result.taskId,
          nextTriggerTime,
          accountUuid,
        });

        return {
          success: true,
          scheduleTaskId: result.taskId,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      console.error('为 ReminderTemplate 创建调度任务失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  /**
   * 取消 ReminderTemplate 的调度任务
   */
  async cancelScheduleForTemplate(params: { templateUuid: string; accountUuid: string }): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { templateUuid, accountUuid } = params;

      // 通过事件系统请求取消调度任务
      const result = await eventBus.invoke('schedule:cancelTaskByTaskId', {
        taskId: templateUuid,
        reason: 'ReminderTemplate状态变化',
        canceledBy: accountUuid,
      });

      if (result.success) {
        // 发布 ReminderTemplate 调度取消事件
        eventBus.emit('reminder:schedule-cancelled', {
          templateUuid,
          accountUuid,
        });

        return { success: true };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      console.error('取消 ReminderTemplate 调度任务失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  // ===== 批量操作 =====

  /**
   * 批量同步 ReminderTemplate 到调度系统
   */
  async batchSyncTemplates(params: {
    templates: ReminderContracts.IReminderTemplate[];
    accountUuid: string;
  }): Promise<{
    success: boolean;
    successCount: number;
    failedCount: number;
    errors: Array<{ templateUuid: string; error: string }>;
  }> {
    const { templates, accountUuid } = params;
    let successCount = 0;
    let failedCount = 0;
    const errors: Array<{ templateUuid: string; error: string }> = [];

    for (const template of templates) {
      if (!template.enabled) {
        continue; // 跳过未启用的模板
      }

      const result = await this.createScheduleForTemplate({
        template,
        accountUuid,
      });

      if (result.success) {
        successCount++;
      } else {
        failedCount++;
        errors.push({
          templateUuid: template.uuid,
          error: result.error || '未知错误',
        });
      }
    }

    return {
      success: failedCount === 0,
      successCount,
      failedCount,
      errors,
    };
  }

  /**
   * 批量取消 ReminderTemplate 调度
   */
  async batchCancelTemplates(params: { templateUuids: string[]; accountUuid: string }): Promise<{
    success: boolean;
    successCount: number;
    failedCount: number;
    errors: Array<{ templateUuid: string; error: string }>;
  }> {
    const { templateUuids, accountUuid } = params;
    let successCount = 0;
    let failedCount = 0;
    const errors: Array<{ templateUuid: string; error: string }> = [];

    for (const templateUuid of templateUuids) {
      const result = await this.cancelScheduleForTemplate({
        templateUuid,
        accountUuid,
      });

      if (result.success) {
        successCount++;
      } else {
        failedCount++;
        errors.push({
          templateUuid,
          error: result.error || '未知错误',
        });
      }
    }

    return {
      success: failedCount === 0,
      successCount,
      failedCount,
      errors,
    };
  }

  // ===== 工具方法 =====

  /**
   * 计算下一次触发时间
   */
  private calculateNextTriggerTime(timeConfig: ReminderContracts.ReminderTimeConfig): Date | null {
    const now = new Date();

    switch (timeConfig.type) {
      case 'daily':
        return this.calculateDailyTrigger(timeConfig, now);
      case 'weekly':
        return this.calculateWeeklyTrigger(timeConfig, now);
      case 'monthly':
        return this.calculateMonthlyTrigger(timeConfig, now);
      case 'absolute':
        return this.calculateAbsoluteTrigger(timeConfig, now);
      case 'custom':
        return this.calculateCustomTrigger(timeConfig, now);
      case 'relative':
        return this.calculateRelativeTrigger(timeConfig, now);
      default:
        return null;
    }
  }

  /**
   * 计算每日触发时间
   */
  private calculateDailyTrigger(
    timeConfig: ReminderContracts.ReminderTimeConfig,
    baseTime: Date,
  ): Date {
    const triggerTime = new Date(baseTime);
    const times = timeConfig.times || ['09:00'];
    const [hours, minutes] = times[0].split(':').map(Number);

    triggerTime.setHours(hours, minutes, 0, 0);

    // 如果今天的时间已过，设置为明天
    if (triggerTime <= baseTime) {
      triggerTime.setDate(triggerTime.getDate() + 1);
    }

    return triggerTime;
  }

  /**
   * 计算每周触发时间
   */
  private calculateWeeklyTrigger(
    timeConfig: ReminderContracts.ReminderTimeConfig,
    baseTime: Date,
  ): Date {
    const triggerTime = new Date(baseTime);
    const weekdays = timeConfig.weekdays || [1]; // 默认周一
    const times = timeConfig.times || ['09:00'];
    const [hours, minutes] = times[0].split(':').map(Number);

    // 找到下一个指定的星期几
    const targetWeekday = weekdays[0];
    const currentWeekday = triggerTime.getDay();
    let daysUntilTarget = targetWeekday - currentWeekday;

    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7; // 下周
    }

    triggerTime.setDate(triggerTime.getDate() + daysUntilTarget);
    triggerTime.setHours(hours, minutes, 0, 0);

    return triggerTime;
  }

  /**
   * 计算每月触发时间
   */
  private calculateMonthlyTrigger(
    timeConfig: ReminderContracts.ReminderTimeConfig,
    baseTime: Date,
  ): Date {
    const triggerTime = new Date(baseTime);
    const monthDays = timeConfig.monthDays || [1]; // 默认每月1号
    const times = timeConfig.times || ['09:00'];
    const [hours, minutes] = times[0].split(':').map(Number);

    triggerTime.setDate(monthDays[0]);
    triggerTime.setHours(hours, minutes, 0, 0);

    // 如果这个月的日期已过，设置为下个月
    if (triggerTime <= baseTime) {
      triggerTime.setMonth(triggerTime.getMonth() + 1);
    }

    return triggerTime;
  }

  /**
   * 计算绝对时间触发
   */
  private calculateAbsoluteTrigger(
    timeConfig: ReminderContracts.ReminderTimeConfig,
    baseTime: Date,
  ): Date | null {
    if (timeConfig.times && timeConfig.times.length > 0) {
      const absoluteTime = new Date(timeConfig.times[0]);
      return absoluteTime > baseTime ? absoluteTime : null;
    }
    return null;
  }

  /**
   * 计算自定义时间触发
   */
  private calculateCustomTrigger(
    timeConfig: ReminderContracts.ReminderTimeConfig,
    baseTime: Date,
  ): Date {
    if (timeConfig.customPattern) {
      const { interval, unit } = timeConfig.customPattern;
      const triggerTime = new Date(baseTime);

      switch (unit) {
        case 'minutes':
          triggerTime.setMinutes(triggerTime.getMinutes() + interval);
          break;
        case 'hours':
          triggerTime.setHours(triggerTime.getHours() + interval);
          break;
        case 'days':
          triggerTime.setDate(triggerTime.getDate() + interval);
          break;
      }

      return triggerTime;
    }

    // 默认1小时后
    const triggerTime = new Date(baseTime);
    triggerTime.setHours(triggerTime.getHours() + 1);
    return triggerTime;
  }

  /**
   * 计算相对时间触发
   */
  private calculateRelativeTrigger(
    timeConfig: ReminderContracts.ReminderTimeConfig,
    baseTime: Date,
  ): Date {
    const triggerTime = new Date(baseTime);

    if (typeof timeConfig.duration === 'number') {
      // duration 是秒数
      triggerTime.setSeconds(triggerTime.getSeconds() + timeConfig.duration);
    } else if (timeConfig.duration && typeof timeConfig.duration === 'object') {
      // duration 是时间范围，使用最小值
      triggerTime.setSeconds(triggerTime.getSeconds() + timeConfig.duration.min);
    } else {
      // 默认30分钟后
      triggerTime.setMinutes(triggerTime.getMinutes() + 30);
    }

    return triggerTime;
  }

  /**
   * 映射 Reminder 优先级到 Schedule 优先级
   */
  private mapReminderPriorityToSchedule(
    priority: ReminderContracts.ReminderPriority,
  ): SchedulePriority {
    switch (priority) {
      case 'low':
        return SchedulePriority.LOW;
      case 'normal':
        return SchedulePriority.NORMAL;
      case 'high':
        return SchedulePriority.HIGH;
      case 'urgent':
        return SchedulePriority.URGENT;
      default:
        return SchedulePriority.NORMAL;
    }
  }

  /**
   * 映射通知设置到提醒方法
   */
  private mapNotificationToAlertMethods(
    notificationSettings?: ReminderContracts.NotificationSettings,
  ): AlertMethod[] {
    const methods: AlertMethod[] = [];

    if (!notificationSettings) {
      return [AlertMethod.POPUP];
    }

    if (notificationSettings.popup) {
      methods.push(AlertMethod.POPUP);
    }

    if (notificationSettings.sound) {
      methods.push(AlertMethod.SOUND);
    }

    if (notificationSettings.vibration) {
      methods.push(AlertMethod.SYSTEM_NOTIFICATION);
    }

    return methods.length > 0 ? methods : [AlertMethod.POPUP];
  }

  /**
   * 映射时间配置到重复配置
   */
  private mapTimeConfigToRepeatConfig(timeConfig: ReminderContracts.ReminderTimeConfig): any {
    switch (timeConfig.type) {
      case 'daily':
        return {
          type: RecurrenceType.DAILY,
          interval: 1,
        };
      case 'weekly':
        return {
          type: RecurrenceType.WEEKLY,
          interval: 1,
          daysOfWeek: timeConfig.weekdays || [1],
        };
      case 'monthly':
        return {
          type: RecurrenceType.MONTHLY,
          interval: 1,
          dayOfMonth: timeConfig.monthDays?.[0] || 1,
        };
      case 'custom':
        if (timeConfig.customPattern) {
          const { interval, unit } = timeConfig.customPattern;
          return {
            type: RecurrenceType.CUSTOM,
            interval,
          };
        }
        break;
      default:
        return undefined;
    }
  }
}

// 导出单例实例
export const reminderScheduleIntegration = ReminderScheduleIntegrationService.getInstance();
