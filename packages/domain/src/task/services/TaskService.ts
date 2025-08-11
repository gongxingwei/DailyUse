import { TaskTemplate } from '../aggregates/TaskTemplate';
import { TaskInstance } from '../aggregates/TaskInstance';
import { ITaskTemplateRepository, ITaskInstanceRepository } from '../repositories/ITaskRepository';
import { TaskStatus, TaskType, RecurrenceType, ImportanceLevel, UrgencyLevel } from '../types';
import { TaskTimeConfig } from '../valueObjects/TaskTimeConfig';
import { TaskReminderConfig } from '../valueObjects/TaskReminderConfig';

export class TaskService {
  constructor(
    private taskTemplateRepository: ITaskTemplateRepository,
    private taskInstanceRepository: ITaskInstanceRepository,
  ) {}

  async createTaskTemplate(params: {
    title: string;
    description?: string;
    category: string;
    tags: string[];
    importance: ImportanceLevel;
    urgency: UrgencyLevel;
    estimatedDuration?: number;
    location?: string;
    timeConfig: {
      type: TaskType;
      startTime: Date;
      endTime?: Date;
      recurrenceType: RecurrenceType;
      timezone: string;
    };
    reminderEnabled?: boolean;
  }): Promise<TaskTemplate> {
    const timeConfig = TaskTimeConfig.create({
      type: params.timeConfig.type,
      baseTime: {
        start: params.timeConfig.startTime,
        end: params.timeConfig.endTime,
        duration: params.estimatedDuration,
      },
      recurrence: {
        type: params.timeConfig.recurrenceType,
      },
      timezone: params.timeConfig.timezone,
    });

    const reminderConfig = params.reminderEnabled
      ? TaskReminderConfig.createDefault()
      : TaskReminderConfig.create({
          enabled: false,
          alerts: [],
          snooze: { enabled: false, interval: 5, maxCount: 3 },
        });

    const taskTemplate = TaskTemplate.create({
      title: params.title,
      description: params.description,
      timeConfig,
      reminderConfig,
      metadata: {
        category: params.category,
        tags: params.tags,
        estimatedDuration: params.estimatedDuration,
        importance: params.importance,
        urgency: params.urgency,
        location: params.location,
      },
    });

    await this.taskTemplateRepository.save(taskTemplate);
    return taskTemplate;
  }

  async activateTaskTemplate(templateId: string): Promise<void> {
    const template = await this.taskTemplateRepository.findById(templateId);
    if (!template) {
      throw new Error('Task template not found');
    }

    template.activate();
    await this.taskTemplateRepository.save(template);
  }

  async createTaskInstance(params: {
    templateId: string;
    title?: string;
    scheduledTime: Date;
    endTime?: Date;
  }): Promise<TaskInstance> {
    const template = await this.taskTemplateRepository.findById(params.templateId);
    if (!template) {
      throw new Error('Task template not found');
    }

    if (!template.isActive) {
      throw new Error('Cannot create instance from inactive template');
    }

    const instance = TaskInstance.create({
      templateUuid: template.uuid,
      title: params.title || template.title,
      description: template.description,
      timeConfig: {
        type: template.timeConfig.type,
        scheduledTime: params.scheduledTime,
        endTime: params.endTime,
        estimatedDuration: template.metadata.estimatedDuration,
        timezone: template.timeConfig.timezone,
        allowReschedule: template.schedulingPolicy.allowReschedule,
        maxDelayDays: template.schedulingPolicy.maxDelayDays,
      },
      reminderStatus: {
        enabled: template.reminderConfig.enabled,
        alerts: template.reminderConfig.alerts.map((alert) => ({
          uuid: alert.uuid,
          alertConfig: alert,
          status: 'pending' as const,
          scheduledTime: this.calculateReminderTime(params.scheduledTime, alert),
          snoozeHistory: [],
        })),
        globalSnoozeCount: 0,
      },
      metadata: {
        estimatedDuration: template.metadata.estimatedDuration,
        category: template.metadata.category,
        tags: template.metadata.tags,
        location: template.metadata.location,
        urgency: template.metadata.urgency,
        importance: template.metadata.importance,
      },
    });

    await this.taskInstanceRepository.save(instance);

    // Update template analytics
    template.recordInstanceCreated();
    await this.taskTemplateRepository.save(template);

    return instance;
  }

  async completeTask(instanceId: string): Promise<void> {
    const instance = await this.taskInstanceRepository.findById(instanceId);
    if (!instance) {
      throw new Error('Task instance not found');
    }

    if (!instance.isInProgress && !instance.isPending) {
      throw new Error('Only pending or in-progress tasks can be completed');
    }

    instance.complete();
    await this.taskInstanceRepository.save(instance);

    // Update template analytics
    const template = await this.taskTemplateRepository.findById(instance.templateUuid);
    if (template) {
      template.recordInstanceCompleted(instance.actualDuration);
      await this.taskTemplateRepository.save(template);
    }
  }

  async startTask(instanceId: string): Promise<void> {
    const instance = await this.taskInstanceRepository.findById(instanceId);
    if (!instance) {
      throw new Error('Task instance not found');
    }

    instance.start();
    await this.taskInstanceRepository.save(instance);
  }

  async cancelTask(instanceId: string): Promise<void> {
    const instance = await this.taskInstanceRepository.findById(instanceId);
    if (!instance) {
      throw new Error('Task instance not found');
    }

    instance.cancel();
    await this.taskInstanceRepository.save(instance);
  }

  async rescheduleTask(instanceId: string, newScheduledTime: Date, reason?: string): Promise<void> {
    const instance = await this.taskInstanceRepository.findById(instanceId);
    if (!instance) {
      throw new Error('Task instance not found');
    }

    instance.reschedule(newScheduledTime, reason);
    await this.taskInstanceRepository.save(instance);
  }

  async getOverdueTasks(): Promise<TaskInstance[]> {
    return this.taskInstanceRepository.findOverdueTasks();
  }

  async getUpcomingTasks(hours: number = 24): Promise<TaskInstance[]> {
    const now = new Date();
    const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

    return this.taskInstanceRepository.findByDateRange(now, endTime);
  }

  async getTasksByStatus(status: TaskStatus): Promise<TaskInstance[]> {
    return this.taskInstanceRepository.findByStatus(status);
  }

  async dismissReminder(instanceId: string, alertId: string): Promise<void> {
    const instance = await this.taskInstanceRepository.findById(instanceId);
    if (!instance) {
      throw new Error('Task instance not found');
    }

    instance.dismissReminder(alertId);
    await this.taskInstanceRepository.save(instance);
  }

  async snoozeReminder(
    instanceId: string,
    alertId: string,
    minutes: number,
    reason?: string,
  ): Promise<void> {
    const instance = await this.taskInstanceRepository.findById(instanceId);
    if (!instance) {
      throw new Error('Task instance not found');
    }

    const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000);
    instance.snoozeReminder(alertId, snoozeUntil, reason);
    await this.taskInstanceRepository.save(instance);
  }

  private calculateReminderTime(scheduledTime: Date, alert: any): Date {
    if (alert.timing.type === 'absolute' && alert.timing.absoluteTime) {
      return alert.timing.absoluteTime;
    } else if (alert.timing.type === 'relative' && alert.timing.minutesBefore) {
      return new Date(scheduledTime.getTime() - alert.timing.minutesBefore * 60 * 1000);
    }
    return scheduledTime;
  }
}
