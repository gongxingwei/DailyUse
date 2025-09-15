import { TaskContracts, ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';
import { TaskTemplate } from '../aggregates/TaskTemplate';
import { TaskInstance } from '../entities/TaskInstance';
import { TaskMetaTemplate } from '../entities/TaskMetaTemplate';

/**
 * Task模块应用层服务 - 客户端实现
 * 负责协调聚合根操作和业务流程
 */
export class TaskApplicationService {
  private taskTemplates = new Map<string, TaskTemplate>();
  private taskMetaTemplates = new Map<string, TaskMetaTemplate>();

  // ===== TaskTemplate聚合根操作 =====

  /**
   * 创建任务模板
   */
  async createTaskTemplate(
    request: TaskContracts.CreateTaskTemplateRequest,
    accountUuid: string,
  ): Promise<TaskTemplate> {
    // 创建聚合根
    const template = new TaskTemplate({
      accountUuid,
      title: request.title,
      description: request.description,
      timeConfig: {
        time: request.timeConfig.time,
        date: {
          startDate: new Date(request.timeConfig.date.startDate),
          endDate: request.timeConfig.date.endDate
            ? new Date(request.timeConfig.date.endDate)
            : undefined,
        },
        schedule: request.timeConfig.schedule,
        timezone: request.timeConfig.timezone,
      },
      reminderConfig: request.reminderConfig,
      properties: request.properties,
      goalLinks: request.goalLinks,
      lifecycle: {
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      stats: {
        totalInstances: 0,
        completedInstances: 0,
        completionRate: 0,
      },
    });

    // 缓存到内存（实际应用中这里会调用Repository）
    this.taskTemplates.set(template.uuid, template);

    // 发布领域事件
    this.publishEvent('TaskTemplateCreated', {
      templateUuid: template.uuid,
      accountUuid,
      template: template.toDTO(),
    });

    return template;
  }

  /**
   * 通过聚合根创建任务实例
   */
  async createTaskInstance(
    request: TaskContracts.CreateTaskInstanceRequest,
    accountUuid: string,
  ): Promise<string> {
    const template = this.taskTemplates.get(request.templateUuid);
    if (!template) {
      throw new Error(`任务模板不存在: ${request.templateUuid}`);
    }

    // 通过聚合根创建实例
    const instanceUuid = template.createInstance({
      accountUuid,
      title: request.title,
      scheduledDate: new Date(request.timeConfig.scheduledDate),
      timeType: request.timeConfig.timeType,
      startTime: request.timeConfig.startTime,
      endTime: request.timeConfig.endTime,
      estimatedDuration: request.timeConfig.estimatedDuration,
      properties: request.properties,
    });

    // 发布领域事件
    this.publishEvent('TaskInstanceCreated', {
      templateUuid: request.templateUuid,
      instanceUuid,
      accountUuid,
    });

    return instanceUuid;
  }

  /**
   * 通过聚合根完成任务实例
   */
  async completeTaskInstance(
    request: TaskContracts.CompleteTaskRequest,
    templateUuid: string,
    instanceUuid: string,
  ): Promise<void> {
    const template = this.taskTemplates.get(templateUuid);
    if (!template) {
      throw new Error(`任务模板不存在: ${templateUuid}`);
    }

    // 通过聚合根完成实例
    template.completeInstance(instanceUuid, {
      notes: request.notes,
      actualDuration: request.actualDuration,
    });

    // 发布领域事件
    this.publishEvent('TaskInstanceCompleted', {
      templateUuid,
      instanceUuid,
      completedAt: new Date(),
    });
  }

  /**
   * 获取任务模板聚合（包含所有实例）
   */
  async getTaskTemplateAggregate(templateUuid: string): Promise<TaskTemplate | null> {
    return this.taskTemplates.get(templateUuid) || null;
  }

  /**
   * 获取任务模板列表
   */
  async getTaskTemplates(
    options: {
      accountUuid?: string;
      status?: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<TaskTemplate[]> {
    const templates = Array.from(this.taskTemplates.values());

    let filtered = templates;

    if (options.accountUuid) {
      filtered = filtered.filter((t) => t.accountUuid === options.accountUuid);
    }

    if (options.status) {
      filtered = filtered.filter((t) => t.lifecycle?.status === options.status);
    }

    // 分页
    if (options.offset !== undefined) {
      filtered = filtered.slice(options.offset);
    }

    if (options.limit !== undefined) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  // ===== 任务实例查询操作 =====

  /**
   * 跨聚合根查询任务实例
   */
  async queryTaskInstances(query: {
    accountUuid?: string;
    templateUuid?: string;
    status?: ('pending' | 'inProgress' | 'completed' | 'cancelled' | 'overdue')[];
    importance?: ImportanceLevel[];
    urgency?: UrgencyLevel[];
    dateRange?: {
      start: Date;
      end: Date;
    };
    limit?: number;
    offset?: number;
  }): Promise<TaskInstance[]> {
    const allInstances: TaskInstance[] = [];

    // 从所有模板聚合根收集实例
    for (const template of Array.from(this.taskTemplates.values())) {
      if (query.accountUuid && template.accountUuid !== query.accountUuid) {
        continue;
      }

      if (query.templateUuid && template.uuid !== query.templateUuid) {
        continue;
      }

      // 获取模板的所有实例
      const templateInstances = (Object.values(template.instances) as TaskInstance[]).filter(
        (instance: TaskInstance) => {
          if (query.status && !query.status.includes(instance.execution.status)) {
            return false;
          }

          if (query.importance && !query.importance.includes(instance.properties.importance)) {
            return false;
          }

          if (query.urgency && !query.urgency.includes(instance.properties.urgency)) {
            return false;
          }

          if (query.dateRange) {
            const scheduledDate = new Date(instance.timeConfig.scheduledDate);
            if (scheduledDate < query.dateRange.start || scheduledDate > query.dateRange.end) {
              return false;
            }
          }

          return true;
        },
      );

      allInstances.push(...templateInstances);
    }

    // 排序和分页
    allInstances.sort(
      (a, b) =>
        new Date(b.lifecycle.createdAt).getTime() - new Date(a.lifecycle.createdAt).getTime(),
    );

    let result = allInstances;
    if (query.offset !== undefined) {
      result = result.slice(query.offset);
    }
    if (query.limit !== undefined) {
      result = result.slice(0, query.limit);
    }

    return result;
  }

  // ===== TaskMetaTemplate管理 =====

  /**
   * 创建任务元模板
   */
  async createTaskMetaTemplate(
    request: TaskContracts.CreateTaskMetaTemplateRequest,
    accountUuid: string,
  ): Promise<TaskMetaTemplate> {
    const metaTemplate = new TaskMetaTemplate({
      accountUuid,
      name: request.name,
      description: request.description,
      appearance: request.appearance,
      defaultTimeConfig: request.defaultTimeConfig,
      defaultReminderConfig: request.defaultReminderConfig,
      defaultProperties: request.defaultProperties,
    });

    this.taskMetaTemplates.set(metaTemplate.uuid, metaTemplate);

    return metaTemplate;
  }

  /**
   * 使用元模板创建任务模板
   */
  async createTaskTemplateFromMeta(
    metaTemplateUuid: string,
    customization: {
      title: string;
      description?: string;
      accountUuid: string;
      timeConfig?: Partial<TaskContracts.CreateTaskTemplateRequest['timeConfig']>;
    },
  ): Promise<TaskTemplate> {
    const metaTemplate = this.taskMetaTemplates.get(metaTemplateUuid);
    if (!metaTemplate) {
      throw new Error(`任务元模板不存在: ${metaTemplateUuid}`);
    }

    // 基于元模板创建任务模板
    const template = new TaskTemplate({
      accountUuid: customization.accountUuid,
      title: customization.title,
      description: customization.description || metaTemplate.description,
      timeConfig: {
        time: {
          timeType: metaTemplate.defaultTimeConfig.timeType,
          startTime: metaTemplate.defaultTimeConfig.commonTimeSettings?.startTime,
          endTime: metaTemplate.defaultTimeConfig.commonTimeSettings?.endTime,
        },
        date: {
          startDate: new Date(),
          endDate: undefined,
        },
        schedule: {
          mode: metaTemplate.defaultTimeConfig.scheduleMode,
        },
        timezone: metaTemplate.defaultTimeConfig.timezone,
      },
      reminderConfig: metaTemplate.defaultReminderConfig || {
        enabled: false,
        minutesBefore: 15,
        methods: ['notification'],
      },
      properties: metaTemplate.defaultProperties || {
        importance: ImportanceLevel.Moderate,
        urgency: UrgencyLevel.Medium,
        tags: [],
      },
      lifecycle: {
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      stats: {
        totalInstances: 0,
        completedInstances: 0,
        completionRate: 0,
      },
    });

    // 记录元模板使用
    metaTemplate.recordUsage();

    this.taskTemplates.set(template.uuid, template);

    return template;
  }

  // ===== 私有辅助方法 =====

  /**
   * 发布领域事件
   */
  private publishEvent(eventType: string, eventData: any): void {
    // 实际实现中这里会连接到事件总线
    console.log(`领域事件: ${eventType}`, eventData);
  }

  /**
   * 清理缓存（用于测试）
   */
  clearCache(): void {
    this.taskTemplates.clear();
    this.taskMetaTemplates.clear();
  }
}
