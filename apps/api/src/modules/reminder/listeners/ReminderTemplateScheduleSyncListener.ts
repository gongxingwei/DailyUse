import { createLogger, eventBus } from '@dailyuse/utils';
// TODO: Migrate to new Schedule module
// import { RecurringScheduleTaskDomainService, ReminderTemplate } from '@dailyuse/domain-server';
import type { ReminderTemplate } from '@dailyuse/domain-server';

const logger = createLogger('ReminderTemplateScheduleSyncListener');

/**
 * ReminderTemplate 与 Schedule 模块同步监听器
 * 监听提醒模板的创建、更新、删除事件，自动同步到调度系统
 *
 * TODO: Migrate to new Schedule module architecture
 */

/**
 * 注册 Reminder 模块的事件处理器
 */
export function registerReminderEventHandlers(): void {
// scheduleTaskService: RecurringScheduleTaskDomainService,
  logger.info('📝 [Reminder] 注册事件处理器... (DISABLED - TODO: Migrate to new Schedule module)');

  // TODO: Re-enable when new Schedule module is ready
  /*

  // ===================== 监听模板创建事件 =====================
  eventBus.on('ReminderTemplateCreated', async (event: any) => {
    try {
      const template = ReminderTemplate.fromDTO(event.payload.template);

      if (!template.shouldCreateScheduleTask()) {
        logger.debug(`[模板创建] 跳过调度任务创建 - 模板未启用: ${template.name}`);
        return;
      }

      const cronExpression = template.toCronExpression();
      if (!cronExpression) {
        logger.warn(`[模板创建] 无法生成 cron 表达式 - ${template.name}`);
        return;
      }

      await scheduleTaskService.createTask({
        name: template.getScheduleTaskName(),
        description: template.description,
        cronExpression,
        enabled: true,
        sourceModule: 'reminder',
        sourceEntityId: template.uuid,
        metadata: {
          ...template.getScheduleTaskMetadata(),
          accountUuid: event.payload.accountUuid,
        },
      });

      logger.info(`[模板创建] 已创建调度任务 - ${template.name}, cron: ${cronExpression}`);
    } catch (error) {
      logger.error(`[模板创建] 创建调度任务失败`, error);
    }
  });

  // ===================== 监听模板状态变化事件 =====================
  eventBus.on('ReminderTemplateStatusChanged', async (event: any) => {
    try {
      const { templateUuid, oldEnabled, newEnabled } = event.payload;

      if (oldEnabled === newEnabled) return;

      const existingTasks = await scheduleTaskService.findBySource('reminder', templateUuid);

      if (newEnabled) {
        if (existingTasks.length === 0) {
          const template = ReminderTemplate.fromDTO(event.payload.template);
          const cronExpression = template.toCronExpression();

          if (!cronExpression) {
            logger.warn(`[模板启用] 无法生成 cron 表达式 - ${template.name}`);
            return;
          }

          await scheduleTaskService.createTask({
            name: template.getScheduleTaskName(),
            description: template.description,
            cronExpression,
            enabled: true,
            sourceModule: 'reminder',
            sourceEntityId: template.uuid,
            metadata: template.getScheduleTaskMetadata(),
          });

          logger.info(`[模板启用] 已创建调度任务 - ${template.name}`);
        } else {
          for (const task of existingTasks) {
            await scheduleTaskService.updateTask(task.uuid, { enabled: true });
          }
          logger.info(`[模板启用] 已启用 ${existingTasks.length} 个调度任务`);
        }
      } else {
        for (const task of existingTasks) {
          await scheduleTaskService.updateTask(task.uuid, { enabled: false });
        }
        logger.info(`[模板禁用] 已禁用 ${existingTasks.length} 个调度任务`);
      }
    } catch (error) {
      logger.error(`[模板状态变化] 更新调度任务失败`, error);
    }
  });

  // ===================== 监听时间配置变化事件 =====================
  eventBus.on('ReminderTemplateTimeConfigChanged', async (event: any) => {
    try {
      const template = ReminderTemplate.fromDTO(event.payload.template);
      const newCronExpression = template.toCronExpression();

      if (!newCronExpression) {
        logger.warn(`[时间配置变化] 无法生成 cron 表达式 - ${template.name}`);
        await scheduleTaskService.deleteBySource('reminder', template.uuid);
        return;
      }

      const existingTasks = await scheduleTaskService.findBySource('reminder', template.uuid);

      if (existingTasks.length === 0) {
        await scheduleTaskService.createTask({
          name: template.getScheduleTaskName(),
          description: template.description,
          cronExpression: newCronExpression,
          enabled: template.shouldCreateScheduleTask(),
          sourceModule: 'reminder',
          sourceEntityId: template.uuid,
          metadata: template.getScheduleTaskMetadata(),
        });
        logger.info(`[时间配置变化] 已创建调度任务 - ${template.name}`);
      } else {
        for (const task of existingTasks) {
          await scheduleTaskService.updateTask(task.uuid, {
            cronExpression: newCronExpression,
            metadata: template.getScheduleTaskMetadata(),
          });
        }
        logger.info(`[时间配置变化] 已更新 ${existingTasks.length} 个调度任务`);
      }
    } catch (error) {
      logger.error(`[时间配置变化] 更新调度任务失败`, error);
    }
  });

  // ===================== 监听模板删除事件 =====================
  eventBus.on('ReminderTemplateDeleted', async (event: any) => {
    try {
      const { templateUuid } = event.payload;
      await scheduleTaskService.deleteBySource('reminder', templateUuid);
      logger.info(`[模板删除] 已删除关联的调度任务 - templateUuid: ${templateUuid}`);
    } catch (error) {
      logger.error(`[模板删除] 删除调度任务失败`, error);
    }
  });

  // ===================== 监听批量更新事件 =====================
  eventBus.on('ReminderTemplateBatchUpdated', async (event: any) => {
    try {
      const { changes, template: templateDTO } = event.payload;

      if (changes.includes('timeConfig') || changes.includes('enabled')) {
        const template = ReminderTemplate.fromDTO(templateDTO);
        const cronExpression = template.toCronExpression();
        const existingTasks = await scheduleTaskService.findBySource('reminder', template.uuid);

        if (existingTasks.length === 0 && template.shouldCreateScheduleTask() && cronExpression) {
          await scheduleTaskService.createTask({
            name: template.getScheduleTaskName(),
            description: template.description,
            cronExpression,
            enabled: true,
            sourceModule: 'reminder',
            sourceEntityId: template.uuid,
            metadata: template.getScheduleTaskMetadata(),
          });
          logger.info(`[批量更新] 已创建调度任务 - ${template.name}`);
        } else {
          for (const task of existingTasks) {
            await scheduleTaskService.updateTask(task.uuid, {
              cronExpression: cronExpression || task.cronExpression,
              enabled: template.shouldCreateScheduleTask(),
              metadata: template.getScheduleTaskMetadata(),
            });
          }
          logger.info(`[批量更新] 已更新 ${existingTasks.length} 个调度任务`);
        }
      }
    } catch (error) {
      logger.error(`[批量更新] 同步调度任务失败`, error);
    }
  });

  logger.info('✅ [Reminder] 事件处理器注册完成 (DISABLED - TODO)');
  */
}

/**
 * 初始化 Reminder 模块事件处理器
 * 在应用启动时调用
 *
 * TODO: Re-enable when new Schedule module is ready
 */
export function initializeReminderEventHandlers(): void {
// scheduleTaskService: RecurringScheduleTaskDomainService,
  // registerReminderEventHandlers(scheduleTaskService);
  logger.info('⏸️  [Reminder] 事件处理器初始化跳过 - 等待 Schedule 模块迁移');
}
