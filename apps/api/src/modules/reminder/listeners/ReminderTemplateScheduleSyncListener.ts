import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RecurringScheduleTaskDomainService, ReminderTemplate } from '@dailyuse/domain-server';
import { ScheduleContracts } from '@dailyuse/contracts';

/**
 * ReminderTemplate 与 Schedule 模块同步监听器
 *
 * 监听提醒模板的创建、更新、删除事件，自动同步到调度系统
 *
 * 事件流:
 * 1. ReminderTemplateCreated → 创建 RecurringScheduleTask
 * 2. ReminderTemplateUpdated → 更新 RecurringScheduleTask
 * 3. ReminderTemplateStatusChanged → 启用/禁用调度任务
 * 4. ReminderTemplateTimeConfigChanged → 更新 cron 表达式
 * 5. ReminderTemplateDeleted → 删除 RecurringScheduleTask
 */
@Injectable()
export class ReminderTemplateScheduleSyncListener {
  private readonly logger = new Logger(ReminderTemplateScheduleSyncListener.name);

  constructor(private readonly scheduleTaskService: RecurringScheduleTaskDomainService) {}

  /**
   * 监听模板创建事件
   */
  @OnEvent('ReminderTemplateCreated')
  async handleTemplateCreated(event: {
    aggregateId: string;
    payload: {
      templateUuid: string;
      accountUuid: string;
      template: any;
    };
  }): Promise<void> {
    try {
      const template = ReminderTemplate.fromDTO(event.payload.template);

      // 只为启用的模板创建调度任务
      if (!template.shouldCreateScheduleTask()) {
        this.logger.debug(`[模板创建] 跳过调度任务创建 - 模板未启用: ${template.name}`);
        return;
      }

      const cronExpression = template.toCronExpression();
      if (!cronExpression) {
        this.logger.warn(
          `[模板创建] 无法生成 cron 表达式 - ${template.name}, timeConfig: ${JSON.stringify(template.timeConfig)}`,
        );
        return;
      }

      const metadata = template.getScheduleTaskMetadata();

      await this.scheduleTaskService.createTask({
        name: template.getScheduleTaskName(),
        description: template.description,
        triggerType: ScheduleContracts.TriggerType.CRON,
        cronExpression,
        enabled: true,
        sourceModule: 'reminder',
        sourceEntityId: template.uuid,
        metadata: {
          ...metadata,
          accountUuid: event.payload.accountUuid,
        },
      });

      this.logger.log(`[模板创建] 已创建调度任务 - ${template.name}, cron: ${cronExpression}`);
    } catch (error) {
      this.logger.error(
        `[模板创建] 创建调度任务失败 - ${event.payload.templateUuid}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * 监听模板状态变化事件（启用/禁用）
   */
  @OnEvent('ReminderTemplateStatusChanged')
  async handleTemplateStatusChanged(event: {
    aggregateId: string;
    payload: {
      templateUuid: string;
      oldEnabled: boolean;
      newEnabled: boolean;
      template: any;
      accountUuid?: string;
    };
  }): Promise<void> {
    try {
      const { templateUuid, oldEnabled, newEnabled } = event.payload;

      if (oldEnabled === newEnabled) {
        return; // 状态未变化
      }

      const existingTasks = await this.scheduleTaskService.findBySource('reminder', templateUuid);

      if (newEnabled) {
        // 启用模板
        if (existingTasks.length === 0) {
          // 没有调度任务，创建新的
          const template = ReminderTemplate.fromDTO(event.payload.template);
          const cronExpression = template.toCronExpression();

          if (!cronExpression) {
            this.logger.warn(`[模板启用] 无法生成 cron 表达式 - ${template.name}`);
            return;
          }

          await this.scheduleTaskService.createTask({
            name: template.getScheduleTaskName(),
            description: template.description,
            triggerType: ScheduleContracts.TriggerType.CRON,
            cronExpression,
            enabled: true,
            sourceModule: 'reminder',
            sourceEntityId: template.uuid,
            metadata: template.getScheduleTaskMetadata(),
          });

          this.logger.log(`[模板启用] 已创建调度任务 - ${template.name}`);
        } else {
          // 启用现有任务
          for (const task of existingTasks) {
            await this.scheduleTaskService.updateTask(task.uuid, {
              enabled: true,
            });
          }
          this.logger.log(`[模板启用] 已启用 ${existingTasks.length} 个调度任务`);
        }
      } else {
        // 禁用模板
        for (const task of existingTasks) {
          await this.scheduleTaskService.updateTask(task.uuid, {
            enabled: false,
          });
        }
        this.logger.log(`[模板禁用] 已禁用 ${existingTasks.length} 个调度任务`);
      }
    } catch (error) {
      this.logger.error(
        `[模板状态变化] 更新调度任务失败 - ${event.payload.templateUuid}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * 监听时间配置变化事件
   */
  @OnEvent('ReminderTemplateTimeConfigChanged')
  async handleTimeConfigChanged(event: {
    aggregateId: string;
    payload: {
      templateUuid: string;
      oldTimeConfig: any;
      newTimeConfig: any;
      template: any;
    };
  }): Promise<void> {
    try {
      const template = ReminderTemplate.fromDTO(event.payload.template);
      const newCronExpression = template.toCronExpression();

      if (!newCronExpression) {
        this.logger.warn(`[时间配置变化] 无法生成 cron 表达式 - ${template.name}`);
        // 删除现有任务（因为无法调度）
        await this.scheduleTaskService.deleteBySource('reminder', template.uuid);
        return;
      }

      const existingTasks = await this.scheduleTaskService.findBySource('reminder', template.uuid);

      if (existingTasks.length === 0) {
        // 没有现有任务，创建新的
        await this.scheduleTaskService.createTask({
          name: template.getScheduleTaskName(),
          description: template.description,
          triggerType: ScheduleContracts.TriggerType.CRON,
          cronExpression: newCronExpression,
          enabled: template.shouldCreateScheduleTask(),
          sourceModule: 'reminder',
          sourceEntityId: template.uuid,
          metadata: template.getScheduleTaskMetadata(),
        });
        this.logger.log(
          `[时间配置变化] 已创建调度任务 - ${template.name}, cron: ${newCronExpression}`,
        );
      } else {
        // 更新现有任务
        for (const task of existingTasks) {
          await this.scheduleTaskService.updateTask(task.uuid, {
            cronExpression: newCronExpression,
            metadata: template.getScheduleTaskMetadata(),
          });
        }
        this.logger.log(
          `[时间配置变化] 已更新 ${existingTasks.length} 个调度任务, 新 cron: ${newCronExpression}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `[时间配置变化] 更新调度任务失败 - ${event.payload.templateUuid}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * 监听模板删除事件
   */
  @OnEvent('ReminderTemplateDeleted')
  async handleTemplateDeleted(event: {
    aggregateId: string;
    payload: {
      templateUuid: string;
      accountUuid: string;
      template: any;
    };
  }): Promise<void> {
    try {
      const { templateUuid } = event.payload;

      await this.scheduleTaskService.deleteBySource('reminder', templateUuid);

      this.logger.log(`[模板删除] 已删除关联的调度任务 - templateUuid: ${templateUuid}`);
    } catch (error) {
      this.logger.error(
        `[模板删除] 删除调度任务失败 - ${event.payload.templateUuid}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * 监听批量更新事件
   */
  @OnEvent('ReminderTemplateBatchUpdated')
  async handleBatchUpdated(event: {
    aggregateId: string;
    payload: {
      templateUuid: string;
      batchId: string;
      accountUuid: string;
      changes: string[];
      oldState: any;
      newState: any;
      template: any;
    };
  }): Promise<void> {
    try {
      const { changes, template: templateDTO } = event.payload;

      // 如果时间配置或启用状态发生变化，需要同步
      if (changes.includes('timeConfig') || changes.includes('enabled')) {
        const template = ReminderTemplate.fromDTO(templateDTO);
        const cronExpression = template.toCronExpression();

        const existingTasks = await this.scheduleTaskService.findBySource(
          'reminder',
          template.uuid,
        );

        if (existingTasks.length === 0 && template.shouldCreateScheduleTask() && cronExpression) {
          // 创建新任务
          await this.scheduleTaskService.createTask({
            name: template.getScheduleTaskName(),
            description: template.description,
            triggerType: ScheduleContracts.TriggerType.CRON,
            cronExpression,
            enabled: true,
            sourceModule: 'reminder',
            sourceEntityId: template.uuid,
            metadata: template.getScheduleTaskMetadata(),
          });
          this.logger.log(`[批量更新] 已创建调度任务 - ${template.name}`);
        } else {
          // 更新现有任务
          for (const task of existingTasks) {
            await this.scheduleTaskService.updateTask(task.uuid, {
              cronExpression: cronExpression || task.cronExpression,
              enabled: template.shouldCreateScheduleTask(),
              metadata: template.getScheduleTaskMetadata(),
            });
          }
          this.logger.log(`[批量更新] 已更新 ${existingTasks.length} 个调度任务`);
        }
      }
    } catch (error) {
      this.logger.error(
        `[批量更新] 同步调度任务失败 - ${event.payload.templateUuid}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
