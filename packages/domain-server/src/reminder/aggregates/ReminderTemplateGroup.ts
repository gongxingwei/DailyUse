import type { ReminderContracts } from '@dailyuse/contracts';
import { ImportanceLevel } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import { ReminderTemplate } from './ReminderTemplate';

/**
 * 提醒模板分组聚合根 - 服务端实现
 * 包含服务端特有的批量调度和管理逻辑
 */
export class ReminderTemplateGroup extends AggregateRoot {
  protected _uuid: string;
  protected _name: string;
  protected _description?: string;
  protected _enabled: boolean;
  protected _importanceLevel: ImportanceLevel;
  protected _tags: string[];
  protected _templates: ReminderTemplate[];
  protected _createdAt: Date;
  protected _updatedAt: Date;
  protected _version: number;

  // 服务端特有的属性
  private _batchScheduleJobId?: string;
  private _lastBatchScheduleTime?: Date;
  private _schedulingInProgress: boolean = false;

  constructor(params: {
    uuid?: string;
    name: string;
    description?: string;
    enabled?: boolean;
    importanceLevel?: ImportanceLevel;
    tags?: string[];
    templates?: ReminderTemplate[] | any[];
    createdAt?: Date;
    updatedAt?: Date;
    version?: number;
    // 服务端特有参数
    batchScheduleJobId?: string;
    lastBatchScheduleTime?: Date;
    schedulingInProgress?: boolean;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());

    this._uuid = params.uuid || AggregateRoot.generateUUID();
    this._name = params.name;
    this._description = params.description;
    this._enabled = params.enabled ?? true;
    this._importanceLevel = params.importanceLevel || ImportanceLevel.Moderate;
    this._tags = params.tags || [];
    this._createdAt = params.createdAt || new Date();
    this._updatedAt = params.updatedAt || new Date();
    this._version = params.version || 1;

    // 服务端特有属性
    this._batchScheduleJobId = params.batchScheduleJobId;
    this._lastBatchScheduleTime = params.lastBatchScheduleTime;
    this._schedulingInProgress = params.schedulingInProgress || false;

    // 处理模板参数
    this._templates = [];
    if (params.templates) {
      params.templates.forEach((template) => {
        if (template instanceof ReminderTemplate) {
          this._templates.push(template);
        } else {
          this._templates.push(ReminderTemplate.fromDTO(template));
        }
      });
    }

    this.validateBusinessRules();
  }

  // ===== 服务端特有的批量操作方法 =====

  /**
   * 批量调度分组内的所有启用模板
   */
  async batchScheduleAllTemplates(): Promise<void> {
    if (this._schedulingInProgress) {
      throw new Error('分组调度正在进行中，请稍后再试');
    }

    if (!this._enabled) {
      throw new Error('已禁用的分组无法进行批量调度');
    }

    this._schedulingInProgress = true;
    this._batchScheduleJobId = `batch_schedule_${this._uuid}_${Date.now()}`;
    this._lastBatchScheduleTime = new Date();
    this._updatedAt = new Date();
    this._version++;

    try {
      const enabledTemplates = this.getEnabledTemplates();

      if (enabledTemplates.length === 0) {
        this._schedulingInProgress = false;
        return;
      }

      // 发布批量调度开始事件
      this.addDomainEvent({
        eventType: 'BatchScheduleStarted',
        aggregateId: this._uuid,
        occurredOn: new Date(),
        payload: {
          groupUuid: this._uuid,
          groupName: this._name,
          templateCount: enabledTemplates.length,
          batchJobId: this._batchScheduleJobId,
        },
      });

      // 为每个启用的模板创建调度任务
      for (const template of enabledTemplates) {
        try {
          await template.scheduleNextInstances();
        } catch (error) {
          // 记录单个模板调度失败但继续处理其他模板
          this.addDomainEvent({
            eventType: 'TemplateScheduleFailed',
            aggregateId: this._uuid,
            occurredOn: new Date(),
            payload: {
              groupUuid: this._uuid,
              templateUuid: template.uuid,
              templateName: template.name,
              error: (error as Error).message,
            },
          });
        }
      }

      // 发布批量调度完成事件
      this.addDomainEvent({
        eventType: 'BatchScheduleCompleted',
        aggregateId: this._uuid,
        occurredOn: new Date(),
        payload: {
          groupUuid: this._uuid,
          groupName: this._name,
          templateCount: enabledTemplates.length,
          batchJobId: this._batchScheduleJobId,
        },
      });
    } finally {
      this._schedulingInProgress = false;
      this._updatedAt = new Date();
      this._version++;
    }
  }

  /**
   * 取消分组内所有模板的调度任务
   */
  async cancelAllScheduledTasks(): Promise<void> {
    const enabledTemplates = this.getEnabledTemplates();

    for (const template of enabledTemplates) {
      await template.cancelAllScheduledInstances();
    }

    // 取消批量调度任务
    if (this._batchScheduleJobId) {
      const jobId = this._batchScheduleJobId;
      this._batchScheduleJobId = undefined;

      this.addDomainEvent({
        eventType: 'BatchScheduleCancelled',
        aggregateId: this._uuid,
        occurredOn: new Date(),
        payload: {
          groupUuid: this._uuid,
          groupName: this._name,
          cancelledJobId: jobId,
        },
      });
    }

    this._updatedAt = new Date();
    this._version++;
  }

  /**
   * 批量更新分组内模板的配置
   */
  async batchUpdateTemplates(updates: {
    enabled?: boolean;
    priority?: ReminderContracts.ReminderPriority;
    importanceLevel?: ImportanceLevel;
    timeConfig?: Partial<ReminderContracts.ReminderTimeConfig>;
  }): Promise<void> {
    const updatedTemplates: string[] = [];

    for (const template of this._templates) {
      try {
        if (updates.enabled !== undefined) {
          template.setEnabled(updates.enabled);
        }
        if (updates.priority !== undefined) {
          template.setPriority(updates.priority);
        }
        if (updates.importanceLevel !== undefined) {
          template.setImportanceLevel(updates.importanceLevel);
        }
        if (updates.timeConfig) {
          template.updateTimeConfig(updates.timeConfig);
        }

        updatedTemplates.push(template.uuid);
      } catch (error) {
        // 记录单个模板更新失败
        this.addDomainEvent({
          eventType: 'TemplateUpdateFailed',
          aggregateId: this._uuid,
          occurredOn: new Date(),
          payload: {
            groupUuid: this._uuid,
            templateUuid: template.uuid,
            templateName: template.name,
            error: (error as Error).message,
          },
        });
      }
    }

    this._updatedAt = new Date();
    this._version++;

    // 发布批量更新事件
    this.addDomainEvent({
      eventType: 'TemplatesBatchUpdated',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        groupUuid: this._uuid,
        groupName: this._name,
        updatedTemplateUuids: updatedTemplates,
        updates,
      },
    });
  }

  // ===== 继承的业务方法增强 =====

  /**
   * 添加模板（服务端增强版本）
   */
  addTemplate(template: ReminderTemplate): void {
    if (this._templates.some((t) => t.uuid === template.uuid)) {
      throw new Error('模板已存在于此分组中');
    }

    // 设置模板的分组关联
    template.setGroupUuid(this._uuid);

    this._templates.push(template);
    this._updatedAt = new Date();
    this._version++;

    // 如果分组已启用且模板也启用，自动调度模板
    if (this._enabled && template.enabled) {
      template.scheduleNextInstances().catch((error) => {
        this.addDomainEvent({
          eventType: 'AutoScheduleFailed',
          aggregateId: this._uuid,
          occurredOn: new Date(),
          payload: {
            groupUuid: this._uuid,
            templateUuid: template.uuid,
            templateName: template.name,
            error: (error as Error).message,
          },
        });
      });
    }

    this.addDomainEvent({
      eventType: 'TemplateAddedToGroup',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        groupUuid: this._uuid,
        groupName: this._name,
        templateUuid: template.uuid,
        templateName: template.name,
      },
    });
  }

  /**
   * 移除模板（服务端增强版本）
   */
  removeTemplate(templateUuid: string): void {
    const template = this._templates.find((t) => t.uuid === templateUuid);
    if (!template) {
      throw new Error('模板不存在于此分组中');
    }

    // 取消模板的所有调度任务
    template.cancelAllScheduledInstances().catch((error) => {
      this.addDomainEvent({
        eventType: 'TemplateCancelScheduleFailed',
        aggregateId: this._uuid,
        occurredOn: new Date(),
        payload: {
          groupUuid: this._uuid,
          templateUuid: template.uuid,
          templateName: template.name,
          error: (error as Error).message,
        },
      });
    });

    // 清除模板的分组关联
    template.setGroupUuid(undefined);

    this._templates = this._templates.filter((t) => t.uuid !== templateUuid);
    this._updatedAt = new Date();
    this._version++;

    this.addDomainEvent({
      eventType: 'TemplateRemovedFromGroup',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        groupUuid: this._uuid,
        groupName: this._name,
        templateUuid: template.uuid,
        templateName: template.name,
      },
    });
  }

  /**
   * 切换分组启用状态（服务端增强版本）
   */
  toggleEnabled(): void {
    this._enabled = !this._enabled;
    this._updatedAt = new Date();
    this._version++;

    if (this._enabled) {
      // 启用分组时，自动调度所有启用的模板
      this.batchScheduleAllTemplates().catch((error) => {
        this.addDomainEvent({
          eventType: 'GroupAutoScheduleFailed',
          aggregateId: this._uuid,
          occurredOn: new Date(),
          payload: {
            groupUuid: this._uuid,
            groupName: this._name,
            error: (error as Error).message,
          },
        });
      });
    } else {
      // 禁用分组时，取消所有调度任务
      this.cancelAllScheduledTasks().catch((error) => {
        this.addDomainEvent({
          eventType: 'GroupCancelScheduleFailed',
          aggregateId: this._uuid,
          occurredOn: new Date(),
          payload: {
            groupUuid: this._uuid,
            groupName: this._name,
            error: (error as Error).message,
          },
        });
      });
    }

    this.addDomainEvent({
      eventType: 'GroupEnabledToggled',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        groupUuid: this._uuid,
        groupName: this._name,
        enabled: this._enabled,
      },
    });
  }

  // ===== 查询方法（服务端增强） =====

  getEnabledTemplates(): ReminderTemplate[] {
    return this._templates.filter((template) => template.effectiveEnabled);
  }

  getTemplatesByTag(tag: string): ReminderTemplate[] {
    return this._templates.filter((template) => template.metadata.tags.includes(tag));
  }

  getTemplatesByPriority(priority: ReminderContracts.ReminderPriority): ReminderTemplate[] {
    return this._templates.filter((template) => template.priority === priority);
  }

  getSchedulingStatus(): {
    inProgress: boolean;
    lastScheduleTime?: Date;
    jobId?: string;
    enabledTemplateCount: number;
    totalTemplateCount: number;
  } {
    return {
      inProgress: this._schedulingInProgress,
      lastScheduleTime: this._lastBatchScheduleTime,
      jobId: this._batchScheduleJobId,
      enabledTemplateCount: this.getEnabledTemplates().length,
      totalTemplateCount: this._templates.length,
    };
  }

  // ===== 计算属性 =====

  get effectiveEnabled(): boolean {
    return this._enabled && this.getEnabledTemplates().length > 0;
  }

  get hasSchedulingInProgress(): boolean {
    return this._schedulingInProgress;
  }

  get templateCount(): number {
    return this._templates.length;
  }

  get enabledTemplateCount(): number {
    return this.getEnabledTemplates().length;
  }

  // ===== 业务规则验证 =====

  private validateBusinessRules(): void {
    if (!this._name.trim()) {
      throw new Error('分组名称不能为空');
    }

    if (this._name.length > 100) {
      throw new Error('分组名称长度不能超过100个字符');
    }

    if (this._description && this._description.length > 500) {
      throw new Error('分组描述长度不能超过500个字符');
    }
  }

  // ===== 序列化方法 =====

  toDTO(): ReminderContracts.IReminderTemplateGroup {
    return {
      uuid: this._uuid,
      name: this._name,
      description: this._description,
      enabled: this._enabled,
      enableMode: 'manual' as ReminderContracts.ReminderTemplateEnableMode, // 默认手动模式
      templates: this._templates.map((template) => template.toDTO()),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  static fromDTO(dto: ReminderContracts.IReminderTemplateGroup): ReminderTemplateGroup {
    return new ReminderTemplateGroup({
      uuid: dto.uuid,
      name: dto.name,
      description: dto.description,
      enabled: dto.enabled,
      templates: dto.templates,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  // ===== Getters =====

  get uuid(): string {
    return this._uuid;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | undefined {
    return this._description;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get importanceLevel(): ImportanceLevel {
    return this._importanceLevel;
  }

  get tags(): string[] {
    return this._tags;
  }

  get templates(): ReminderTemplate[] {
    return this._templates;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get version(): number {
    return this._version;
  }

  // 服务端特有的getters
  get batchScheduleJobId(): string | undefined {
    return this._batchScheduleJobId;
  }

  get lastBatchScheduleTime(): Date | undefined {
    return this._lastBatchScheduleTime;
  }

  get schedulingInProgress(): boolean {
    return this._schedulingInProgress;
  }

  // ===== Setters =====

  setName(name: string): void {
    if (!name.trim()) {
      throw new Error('分组名称不能为空');
    }
    this._name = name;
    this._updatedAt = new Date();
    this._version++;
  }

  setDescription(description?: string): void {
    this._description = description;
    this._updatedAt = new Date();
    this._version++;
  }

  setEnabled(enabled: boolean): void {
    if (this._enabled !== enabled) {
      this.toggleEnabled();
    }
  }

  setImportanceLevel(importanceLevel: ImportanceLevel): void {
    this._importanceLevel = importanceLevel;
    this._updatedAt = new Date();
    this._version++;
  }

  setTags(tags: string[]): void {
    this._tags = tags;
    this._updatedAt = new Date();
    this._version++;
  }
}
