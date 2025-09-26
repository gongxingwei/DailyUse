/**
 * Schedule模块事件处理器
 * @description 处理Task、Goal等模块发送的调度相关事件
 * @author DailyUse Team
 * @date 2025-01-09
 */

import { eventBus } from '@dailyuse/utils';
import { AlertMethod, SchedulePriority } from '@dailyuse/contracts';
import { ScheduleApplicationService } from '../application/ScheduleApplicationService';

/**
 * Schedule模块事件处理器
 * 负责监听和处理来自其他模块的事件，实现模块间的解耦通信
 */
export class ScheduleEventHandlers {
  private scheduleService: ScheduleApplicationService;

  constructor(scheduleService: ScheduleApplicationService) {
    this.scheduleService = scheduleService;
  }

  /**
   * 注册所有事件处理器
   */
  registerHandlers(): void {
    console.log('🔄 [Schedule] 注册事件处理器...');

    // ========== Task模块事件 ==========
    this.registerTaskEventHandlers();

    // ========== Goal模块事件 ==========
    this.registerGoalEventHandlers();

    // ========== Reminder模块事件 ==========
    this.registerReminderEventHandlers();

    // ========== 系统事件 ==========
    this.registerSystemEventHandlers();

    console.log('✅ [Schedule] 事件处理器注册完成');
  }

  /**
   * 注册Task模块相关的事件处理器
   */
  private registerTaskEventHandlers(): void {
    // 任务创建时的提醒设置
    eventBus.on(
      'task:instance-created',
      async (data: {
        taskInstance: {
          uuid: string;
          title: string;
          scheduledTime: string;
          reminderConfig?: {
            enabled: boolean;
            alerts: Array<{
              uuid: string;
              alertTime: string;
              alertMethods: AlertMethod[];
              message?: string;
            }>;
          };
        };
        accountUuid: string;
      }) => {
        console.log('[Schedule] 处理任务实例创建事件:', data.taskInstance.uuid);

        const { taskInstance, accountUuid } = data;

        if (!taskInstance.reminderConfig?.enabled) {
          return; // 没有启用提醒
        }

        // 为每个提醒Alert创建调度任务
        for (const alert of taskInstance.reminderConfig.alerts) {
          const result = await this.scheduleService.createTaskReminder({
            taskId: taskInstance.uuid,
            taskTitle: taskInstance.title,
            reminderTime: new Date(alert.alertTime),
            createdBy: accountUuid,
            alertMethods: alert.alertMethods,
            priority: SchedulePriority.NORMAL,
          });

          if (result.success) {
            console.log(`✅ [Schedule] 任务提醒已创建: ${result.taskId}`);
          } else {
            console.error(`❌ [Schedule] 任务提醒创建失败: ${result.message}`);
          }
        }
      },
    );

    // 任务更新时的提醒重新调度
    eventBus.on(
      'task:instance-updated',
      async (data: {
        taskInstance: {
          uuid: string;
          title: string;
          scheduledTime: string;
          reminderConfig?: {
            enabled: boolean;
            alerts: Array<{
              uuid: string;
              alertTime: string;
              alertMethods: AlertMethod[];
              message?: string;
            }>;
          };
        };
        accountUuid: string;
        changes: string[]; // 变更的字段列表
      }) => {
        console.log('[Schedule] 处理任务实例更新事件:', data.taskInstance.uuid);

        const { taskInstance, accountUuid, changes } = data;

        // 检查是否影响提醒设置
        const affectsReminders = changes.some((change) =>
          ['scheduledTime', 'reminderConfig', 'title'].includes(change),
        );

        if (!affectsReminders) {
          return;
        }

        // 取消现有的提醒
        await this.handleTaskReminderCancellation(taskInstance.uuid);

        // 如果启用了提醒，重新创建
        if (taskInstance.reminderConfig?.enabled) {
          for (const alert of taskInstance.reminderConfig.alerts) {
            await this.scheduleService.createTaskReminder({
              taskId: taskInstance.uuid,
              taskTitle: taskInstance.title,
              reminderTime: new Date(alert.alertTime),
              createdBy: accountUuid,
              alertMethods: alert.alertMethods,
            });
          }
        }
      },
    );

    // 任务删除时取消提醒
    eventBus.on(
      'task:instance-deleted',
      async (data: { taskInstanceUuid: string; accountUuid: string }) => {
        console.log('[Schedule] 处理任务实例删除事件:', data.taskInstanceUuid);
        await this.handleTaskReminderCancellation(data.taskInstanceUuid);
      },
    );

    // 任务完成时取消提醒
    eventBus.on(
      'task:instance-completed',
      async (data: { taskInstanceUuid: string; completedAt: string; accountUuid: string }) => {
        console.log('[Schedule] 处理任务完成事件:', data.taskInstanceUuid);
        await this.handleTaskReminderCancellation(data.taskInstanceUuid);
      },
    );

    // 任务状态变更
    eventBus.on(
      'task:status-changed',
      async (data: {
        taskInstanceUuid: string;
        oldStatus: string;
        newStatus: string;
        accountUuid: string;
      }) => {
        console.log('[Schedule] 处理任务状态变更事件:', data);

        // 如果任务被暂停或取消，暂停提醒
        if (['paused', 'cancelled'].includes(data.newStatus)) {
          await this.handleTaskReminderCancellation(data.taskInstanceUuid);
        }
      },
    );
  }

  /**
   * 注册Goal模块相关的事件处理器
   */
  private registerGoalEventHandlers(): void {
    // 目标创建提醒
    eventBus.on(
      'goal:created',
      async (data: {
        goal: {
          uuid: string;
          title: string;
          deadline?: string;
          reminderSettings?: {
            enabled: boolean;
            frequency: 'daily' | 'weekly' | 'monthly';
            customReminders: Array<{
              date: string;
              message: string;
            }>;
          };
        };
        accountUuid: string;
      }) => {
        console.log('[Schedule] 处理目标创建事件:', data.goal.uuid);

        const { goal, accountUuid } = data;

        if (!goal.reminderSettings?.enabled) {
          return;
        }

        // 创建自定义提醒
        if (goal.reminderSettings.customReminders) {
          for (const reminder of goal.reminderSettings.customReminders) {
            await this.scheduleService.createGoalReminder({
              goalId: goal.uuid,
              goalTitle: goal.title,
              reminderTime: new Date(reminder.date),
              createdBy: accountUuid,
              alertMethods: [AlertMethod.POPUP],
            });
          }
        }

        // 如果有截止日期，创建截止提醒
        if (goal.deadline) {
          const deadlineDate = new Date(goal.deadline);
          const oneDayBefore = new Date(deadlineDate.getTime() - 24 * 60 * 60 * 1000);
          const oneWeekBefore = new Date(deadlineDate.getTime() - 7 * 24 * 60 * 60 * 1000);

          // 一周前提醒
          if (oneWeekBefore > new Date()) {
            await this.scheduleService.createGoalReminder({
              goalId: goal.uuid,
              goalTitle: goal.title,
              reminderTime: oneWeekBefore,
              createdBy: accountUuid,
              alertMethods: [AlertMethod.POPUP],
            });
          }

          // 一天前提醒
          if (oneDayBefore > new Date()) {
            await this.scheduleService.createGoalReminder({
              goalId: goal.uuid,
              goalTitle: goal.title,
              reminderTime: oneDayBefore,
              createdBy: accountUuid,
              alertMethods: [AlertMethod.POPUP, AlertMethod.SOUND],
              priority: SchedulePriority.HIGH,
            });
          }
        }
      },
    );

    // 目标更新提醒
    eventBus.on(
      'goal:updated',
      async (data: {
        goal: {
          uuid: string;
          title: string;
          deadline?: string;
          reminderSettings?: {
            enabled: boolean;
            customReminders: Array<{
              date: string;
              message: string;
            }>;
          };
        };
        accountUuid: string;
        changes: string[];
      }) => {
        console.log('[Schedule] 处理目标更新事件:', data.goal.uuid);

        // 如果提醒设置有变化，重新创建提醒
        const affectsReminders = data.changes.some((change) =>
          ['deadline', 'reminderSettings', 'title'].includes(change),
        );

        if (affectsReminders) {
          await this.handleGoalReminderCancellation(data.goal.uuid);

          // 重新创建提醒（复用创建逻辑）
          await eventBus.emit('goal:created', data);
        }
      },
    );

    // 目标删除取消提醒
    eventBus.on('goal:deleted', async (data: { goalUuid: string; accountUuid: string }) => {
      console.log('[Schedule] 处理目标删除事件:', data.goalUuid);
      await this.handleGoalReminderCancellation(data.goalUuid);
    });

    // 目标完成取消提醒
    eventBus.on(
      'goal:completed',
      async (data: { goalUuid: string; completedAt: string; accountUuid: string }) => {
        console.log('[Schedule] 处理目标完成事件:', data.goalUuid);
        await this.handleGoalReminderCancellation(data.goalUuid);
      },
    );
  }

  /**
   * 注册Reminder模块相关的事件处理器
   */
  private registerReminderEventHandlers(): void {
    // 提醒模板状态变化处理
    eventBus.on(
      'ReminderTemplateStatusChanged',
      async (event: {
        payload: {
          templateUuid: string;
          oldEnabled: boolean;
          newEnabled: boolean;
          template: any;
          accountUuid: string;
        };
      }) => {
        console.log('[Schedule] 处理提醒模板状态变化事件:', event.payload.templateUuid);

        const { ReminderScheduleIntegrationService } = await import(
          '../../reminder/services/ReminderScheduleIntegrationService'
        );
        const integrationService = ReminderScheduleIntegrationService.getInstance();

        const result = await integrationService.handleTemplateStatusChange({
          templateUuid: event.payload.templateUuid,
          oldEnabled: event.payload.oldEnabled,
          newEnabled: event.payload.newEnabled,
          template: event.payload.template,
          accountUuid: event.payload.accountUuid,
        });

        if (result.success) {
          console.log(`✅ [Schedule] 提醒模板状态同步成功: ${event.payload.templateUuid}`);
        } else {
          console.error(`❌ [Schedule] 提醒模板状态同步失败: ${result.error}`);
        }
      },
    );

    // 提醒模板时间配置变化处理
    eventBus.on(
      'ReminderTemplateTimeConfigChanged',
      async (event: {
        payload: {
          templateUuid: string;
          oldTimeConfig: any;
          newTimeConfig: any;
          template: any;
          accountUuid: string;
        };
      }) => {
        console.log('[Schedule] 处理提醒模板时间配置变化事件:', event.payload.templateUuid);

        const { ReminderScheduleIntegrationService } = await import(
          '../../reminder/services/ReminderScheduleIntegrationService'
        );
        const integrationService = ReminderScheduleIntegrationService.getInstance();

        const result = await integrationService.handleTemplateTimeConfigChange({
          templateUuid: event.payload.templateUuid,
          oldTimeConfig: event.payload.oldTimeConfig,
          newTimeConfig: event.payload.newTimeConfig,
          template: event.payload.template,
          accountUuid: event.payload.accountUuid,
        });

        if (result.success) {
          console.log(`✅ [Schedule] 提醒模板时间配置同步成功: ${event.payload.templateUuid}`);
        } else {
          console.error(`❌ [Schedule] 提醒模板时间配置同步失败: ${result.error}`);
        }
      },
    );

    // 提醒模板删除处理
    eventBus.on(
      'ReminderTemplateDeleted',
      async (event: {
        payload: {
          templateUuid: string;
          accountUuid: string;
          template: any;
        };
      }) => {
        console.log('[Schedule] 处理提醒模板删除事件:', event.payload.templateUuid);

        const { ReminderScheduleIntegrationService } = await import(
          '../../reminder/services/ReminderScheduleIntegrationService'
        );
        const integrationService = ReminderScheduleIntegrationService.getInstance();

        const result = await integrationService.handleTemplateDeleted({
          templateUuid: event.payload.templateUuid,
          accountUuid: event.payload.accountUuid,
        });

        if (result.success) {
          console.log(`✅ [Schedule] 提醒模板删除同步成功: ${event.payload.templateUuid}`);
        } else {
          console.error(`❌ [Schedule] 提醒模板删除同步失败: ${result.error}`);
        }
      },
    );

    // 批量提醒模板更新处理
    eventBus.on(
      'ReminderTemplateBatchUpdated',
      async (event: {
        payload: {
          templateUuid: string;
          batchId: string;
          accountUuid: string;
          changes: string[];
          oldState: any;
          newState: any;
          template: any;
        };
      }) => {
        console.log('[Schedule] 处理批量提醒模板更新事件:', event.payload.batchId);

        // 检查是否影响调度的变更
        const scheduleAffectingChanges = ['enabled', 'timeConfig', 'priority'];
        const hasScheduleChanges = event.payload.changes.some((change) =>
          scheduleAffectingChanges.includes(change),
        );

        if (!hasScheduleChanges) {
          console.log('[Schedule] 批量更新不影响调度，跳过处理');
          return;
        }

        const { ReminderScheduleIntegrationService } = await import(
          '../../reminder/services/ReminderScheduleIntegrationService'
        );
        const integrationService = ReminderScheduleIntegrationService.getInstance();

        // 取消现有调度
        await integrationService.cancelScheduleForTemplate({
          templateUuid: event.payload.templateUuid,
          accountUuid: event.payload.accountUuid,
        });

        // 如果新状态需要调度，重新创建
        if (event.payload.newState.enabled) {
          await integrationService.createScheduleForTemplate({
            template: event.payload.template,
            accountUuid: event.payload.accountUuid,
          });
        }
      },
    );

    // 提醒同步请求处理
    eventBus.on(
      'ReminderTemplateSyncRequested',
      async (event: {
        payload: {
          templateUuid: string;
          accountUuid: string;
          operation: 'create' | 'update' | 'delete';
          reason?: string;
          template: any;
        };
      }) => {
        console.log(
          '[Schedule] 处理提醒同步请求:',
          event.payload.operation,
          event.payload.templateUuid,
        );

        const { ReminderScheduleIntegrationService } = await import(
          '../../reminder/services/ReminderScheduleIntegrationService'
        );
        const integrationService = ReminderScheduleIntegrationService.getInstance();

        try {
          switch (event.payload.operation) {
            case 'create':
              await integrationService.createScheduleForTemplate({
                template: event.payload.template,
                accountUuid: event.payload.accountUuid,
              });
              break;

            case 'update':
              // 先取消再重新创建
              await integrationService.cancelScheduleForTemplate({
                templateUuid: event.payload.templateUuid,
                accountUuid: event.payload.accountUuid,
              });

              if (event.payload.template.enabled) {
                await integrationService.createScheduleForTemplate({
                  template: event.payload.template,
                  accountUuid: event.payload.accountUuid,
                });
              }
              break;

            case 'delete':
              await integrationService.cancelScheduleForTemplate({
                templateUuid: event.payload.templateUuid,
                accountUuid: event.payload.accountUuid,
              });
              break;
          }

          console.log(`✅ [Schedule] 提醒同步操作完成: ${event.payload.operation}`);
        } catch (error) {
          console.error(`❌ [Schedule] 提醒同步操作失败:`, error);
        }
      },
    );

    // ===== 兼容性事件处理 =====

    // 提醒模板激活（兼容旧版本）
    eventBus.on(
      'reminder:template-activated',
      async (data: {
        templateId: string;
        title: string;
        content: string;
        scheduleTime: string;
        accountUuid: string;
      }) => {
        console.log('[Schedule] 处理提醒模板激活事件（兼容）:', data.templateId);

        await this.scheduleService.createQuickReminder({
          title: data.title,
          message: data.content,
          reminderTime: new Date(data.scheduleTime),
          createdBy: data.accountUuid,
        });
      },
    );

    // 一次性提醒创建（兼容旧版本）
    eventBus.on(
      'reminder:create-once',
      async (data: {
        title: string;
        message: string;
        reminderTime: string;
        priority?: SchedulePriority;
        alertMethods?: AlertMethod[];
        accountUuid: string;
      }) => {
        console.log('[Schedule] 处理一次性提醒创建事件（兼容）');

        await this.scheduleService.createQuickReminder({
          title: data.title,
          message: data.message,
          reminderTime: new Date(data.reminderTime),
          createdBy: data.accountUuid,
          priority: data.priority,
          alertMethods: data.alertMethods,
        });
      },
    );
  }

  /**
   * 注册系统相关的事件处理器
   */
  private registerSystemEventHandlers(): void {
    // 用户登出时清理提醒
    eventBus.on('auth:user-logout', async (data: { accountUuid: string }) => {
      console.log('[Schedule] 处理用户登出事件，清理提醒');
      // TODO: 清理该用户的所有调度任务
    });

    // 应用关闭时清理资源
    eventBus.on('app:before-quit', async () => {
      console.log('[Schedule] 应用关闭，清理调度服务');
      this.scheduleService.cleanup();
    });

    // 系统时间变更处理
    eventBus.on('system:time-changed', async () => {
      console.log('[Schedule] 系统时间变更，重新计算调度时间');
      // TODO: 重新计算所有调度任务的执行时间
    });
  }

  // ========== 私有辅助方法 ==========

  /**
   * 取消任务相关的所有提醒
   */
  private async handleTaskReminderCancellation(taskId: string): Promise<void> {
    const activeTasks = this.scheduleService.getAllActiveTasks();
    const taskReminders = activeTasks.filter(
      (task) => task.payload.type === 'TASK_REMINDER' && task.payload.data.sourceId === taskId,
    );

    for (const reminder of taskReminders) {
      await this.scheduleService.cancelScheduleTask(reminder.uuid);
    }

    console.log(`已取消任务 ${taskId} 的 ${taskReminders.length} 个提醒`);
  }

  /**
   * 取消目标相关的所有提醒
   */
  private async handleGoalReminderCancellation(goalId: string): Promise<void> {
    const activeTasks = this.scheduleService.getAllActiveTasks();
    const goalReminders = activeTasks.filter(
      (task) => task.payload.type === 'GOAL_REMINDER' && task.payload.data.sourceId === goalId,
    );

    for (const reminder of goalReminders) {
      await this.scheduleService.cancelScheduleTask(reminder.uuid);
    }

    console.log(`已取消目标 ${goalId} 的 ${goalReminders.length} 个提醒`);
  }

  /**
   * 注销所有事件处理器
   */
  unregisterHandlers(): void {
    console.log('🧹 [Schedule] 注销事件处理器...');

    // 注销Task事件
    eventBus.off('task:instance-created');
    eventBus.off('task:instance-updated');
    eventBus.off('task:instance-deleted');
    eventBus.off('task:instance-completed');
    eventBus.off('task:status-changed');

    // 注销Goal事件
    eventBus.off('goal:created');
    eventBus.off('goal:updated');
    eventBus.off('goal:deleted');
    eventBus.off('goal:completed');

    // 注销Reminder事件
    eventBus.off('ReminderTemplateStatusChanged');
    eventBus.off('ReminderTemplateTimeConfigChanged');
    eventBus.off('ReminderTemplateDeleted');
    eventBus.off('ReminderTemplateBatchUpdated');
    eventBus.off('ReminderTemplateSyncRequested');
    eventBus.off('reminder:template-activated');
    eventBus.off('reminder:create-once');

    // 注销系统事件
    eventBus.off('auth:user-logout');
    eventBus.off('app:before-quit');
    eventBus.off('system:time-changed');

    console.log('✅ [Schedule] 事件处理器注销完成');
  }
}
