import type { ReminderContracts } from '@dailyuse/contracts';
import { ImportanceLevel } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import { ReminderInstance } from '../entities/ReminderInstance';

/**
 * 提醒模板聚合根 - 客户端实现
 * 作为聚合根管理ReminderInstance实体的生命周期
 */
export class ReminderTemplate extends AggregateRoot {
  // 核心属性
  protected _uuid: string;
  protected _groupUuid?: string;
  protected _name: string;
  protected _description?: string;
  protected _message: string;
  protected _enabled: boolean;
  protected _selfEnabled: boolean;
  protected _importanceLevel: ImportanceLevel;
  protected _timeConfig: ReminderContracts.ReminderTimeConfig;
  protected _priority: ReminderContracts.ReminderPriority;
  protected _category: string;
  protected _tags: string[];
  protected _notificationSettings?: ReminderContracts.NotificationSettings;
  protected _snoozeConfig?: ReminderContracts.SnoozeConfig;
  protected _lifecycle: {
    createdAt: Date;
    updatedAt: Date;
    lastTriggered?: Date;
    triggerCount: number;
  };
  protected _analytics: {
    totalTriggers: number;
    acknowledgedCount: number;
    dismissedCount: number;
    snoozeCount: number;
    avgResponseTime?: number;
  };
  protected _version: number;

  // 聚合根关联的实体
  public instances: ReminderInstance[] = [];

  constructor(params: {
    uuid?: string;
    groupUuid?: string;
    name: string;
    description?: string;
    message: string;
    enabled?: boolean;
    selfEnabled?: boolean;
    importanceLevel?: ImportanceLevel;
    timeConfig: ReminderContracts.ReminderTimeConfig;
    priority: ReminderContracts.ReminderPriority;
    category: string;
    tags?: string[];
    notificationSettings?: ReminderContracts.NotificationSettings;
    snoozeConfig?: ReminderContracts.SnoozeConfig;
    lifecycle?: {
      createdAt: Date;
      updatedAt: Date;
      lastTriggered?: Date;
      triggerCount: number;
    };
    analytics?: {
      totalTriggers: number;
      acknowledgedCount: number;
      dismissedCount: number;
      snoozeCount: number;
      avgResponseTime?: number;
    };
    version?: number;
    instances?: ReminderInstance[] | any[]; // 支持实体形式或DTO形式
  }) {
    const uuid = params.uuid || AggregateRoot.generateUUID();
    super(uuid);

    this._uuid = uuid;
    this._groupUuid = params.groupUuid;
    this._name = params.name;
    this._description = params.description;
    this._message = params.message;
    this._enabled = params.enabled ?? true;
    this._selfEnabled = params.selfEnabled ?? true;
    this._importanceLevel = params.importanceLevel || ('normal' as ImportanceLevel);
    this._timeConfig = params.timeConfig;
    this._priority = params.priority;
    this._category = params.category;
    this._tags = params.tags || [];
    this._notificationSettings = params.notificationSettings;
    this._snoozeConfig = params.snoozeConfig;
    this._lifecycle = params.lifecycle || {
      createdAt: new Date(),
      updatedAt: new Date(),
      triggerCount: 0,
    };
    this._analytics = params.analytics || {
      totalTriggers: 0,
      acknowledgedCount: 0,
      dismissedCount: 0,
      snoozeCount: 0,
    };
    this._version = params.version || 1;

    // 支持DTO形式和实体形式的ReminderInstance数组
    // 使用instanceof判断，参考Goal模块的实现
    this.instances =
      params.instances?.map((instance) => {
        if (instance instanceof ReminderInstance) {
          return instance;
        } else {
          // 不是实体则调用fromDTO方法
          return ReminderInstance.fromDTO(instance);
        }
      }) || [];
  }

  // ===== DDD聚合根控制模式 - 业务方法 =====

  /**
   * 创建并添加提醒实例（聚合根控制）
   */
  createReminderInstance(instanceData: {
    scheduledTime: Date;
    message?: string;
    priority?: ReminderContracts.ReminderPriority;
    metadata?: {
      category?: string;
      tags?: string[];
      sourceType?: 'template' | 'task' | 'goal' | 'manual';
      sourceId?: string;
    };
  }): string {
    // 业务规则验证
    if (!this._enabled) {
      throw new Error('无法为禁用的模板创建提醒实例');
    }

    if (instanceData.scheduledTime <= new Date()) {
      throw new Error('计划时间必须是未来时间');
    }

    // 创建新的提醒实例
    const instanceUuid = AggregateRoot.generateUUID();
    const instance = new ReminderInstance({
      uuid: instanceUuid,
      templateUuid: this._uuid,
      title: this._name,
      message: instanceData.message || this._message,
      scheduledTime: instanceData.scheduledTime,
      status: 'pending' as ReminderContracts.ReminderStatus,
      priority: instanceData.priority || this._priority,
      metadata: {
        category: instanceData.metadata?.category || this._category,
        tags: instanceData.metadata?.tags || this._tags,
        sourceType: instanceData.metadata?.sourceType || 'template',
        sourceId: instanceData.metadata?.sourceId,
      },
      snoozeHistory: [],
      currentSnoozeCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    });

    this.instances.push(instance);
    this.updateVersion();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'ReminderInstanceCreated',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        templateUuid: this._uuid,
        instanceUuid,
        scheduledTime: instanceData.scheduledTime,
      },
    });

    return instanceUuid;
  }

  /**
   * 更新提醒实例状态（聚合根控制）
   */
  updateInstanceStatus(
    instanceUuid: string,
    status: ReminderContracts.ReminderStatus,
    timestamp?: Date,
  ): void {
    const instance = this.instances.find((inst) => inst.uuid === instanceUuid);
    if (!instance) {
      throw new Error('提醒实例不存在');
    }

    const now = timestamp || new Date();
    instance.updateStatus(status, now);
    this.updateAnalytics(status);
    this.updateVersion();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'ReminderInstanceStatusUpdated',
      aggregateId: this._uuid,
      occurredOn: now,
      payload: {
        templateUuid: this._uuid,
        instanceUuid,
        oldStatus: instance.status,
        newStatus: status,
      },
    });
  }

  /**
   * 稍后提醒实例（聚合根控制）
   */
  snoozeInstance(instanceUuid: string, snoozeUntil: Date, reason?: string): void {
    const instance = this.instances.find((inst) => inst.uuid === instanceUuid);
    if (!instance) {
      throw new Error('提醒实例不存在');
    }

    // 检查稍后提醒配置
    if (this._snoozeConfig && !this._snoozeConfig.enabled) {
      throw new Error('该模板未启用稍后提醒功能');
    }

    const maxCount = this._snoozeConfig?.maxCount || 3;
    if ((instance.currentSnoozeCount || 0) >= maxCount) {
      throw new Error(`稍后提醒次数已达上限 (${maxCount}次)`);
    }

    instance.snooze(snoozeUntil, reason);
    this._analytics.snoozeCount++;
    this.updateVersion();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'ReminderInstanceSnoozed',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        templateUuid: this._uuid,
        instanceUuid,
        snoozeUntil,
        reason,
      },
    });
  }

  /**
   * 删除提醒实例（聚合根控制）
   */
  removeInstance(instanceUuid: string): void {
    const instanceIndex = this.instances.findIndex((inst) => inst.uuid === instanceUuid);
    if (instanceIndex === -1) {
      throw new Error('提醒实例不存在');
    }

    const instance = this.instances[instanceIndex];
    this.instances.splice(instanceIndex, 1);
    this.updateVersion();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'ReminderInstanceRemoved',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        templateUuid: this._uuid,
        instanceUuid,
        removedStatus: instance.status,
      },
    });
  }

  // ===== 业务规则和计算 =====

  /**
   * 启用/禁用模板
   */
  toggleEnabled(enabled: boolean): void {
    if (this._enabled === enabled) {
      return;
    }

    this._enabled = enabled;
    this.updateVersion();

    // 如果禁用模板，取消所有待处理的实例
    if (!enabled) {
      this.instances
        .filter((instance) => instance.status === 'pending')
        .forEach((instance) => {
          instance.updateStatus('cancelled' as ReminderContracts.ReminderStatus, new Date());
        });
    }

    // 发布领域事件
    this.addDomainEvent({
      eventType: enabled ? 'ReminderTemplateEnabled' : 'ReminderTemplateDisabled',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        templateUuid: this._uuid,
        affectedInstancesCount: this.instances.filter((i) => i.status === 'pending').length,
      },
    });
  }

  /**
   * 更新分析数据
   */
  private updateAnalytics(status: ReminderContracts.ReminderStatus): void {
    switch (status) {
      case 'triggered':
        this._analytics.totalTriggers++;
        this._lifecycle.triggerCount++;
        this._lifecycle.lastTriggered = new Date();
        break;
      case 'acknowledged':
        this._analytics.acknowledgedCount++;
        break;
      case 'dismissed':
        this._analytics.dismissedCount++;
        break;
    }
  }

  /**
   * 更新版本号
   */
  private updateVersion(): void {
    this._version++;
    this._lifecycle.updatedAt = new Date();
  }

  // ===== 序列化方法 =====

  toDTO(): ReminderContracts.IReminderTemplate {
    return {
      uuid: this._uuid,
      groupUuid: this._groupUuid,
      name: this._name,
      description: this._description,
      message: this._message,
      enabled: this._enabled,
      selfEnabled: this._selfEnabled,
      importanceLevel: this._importanceLevel,
      timeConfig: this._timeConfig,
      priority: this._priority,
      category: this._category,
      tags: this._tags,
      notificationSettings: this._notificationSettings,
      snoozeConfig: this._snoozeConfig,
      lifecycle: {
        createdAt: this._lifecycle.createdAt,
        updatedAt: this._lifecycle.updatedAt,
        lastTriggered: this._lifecycle.lastTriggered,
        triggerCount: this._lifecycle.triggerCount,
      },
      analytics: this._analytics,
      version: this._version,
    };
  }

  static fromDTO(dto: ReminderContracts.IReminderTemplate): ReminderTemplate {
    return new ReminderTemplate({
      uuid: dto.uuid,
      groupUuid: dto.groupUuid,
      name: dto.name,
      description: dto.description,
      message: dto.message,
      enabled: dto.enabled,
      selfEnabled: dto.selfEnabled,
      importanceLevel: dto.importanceLevel,
      timeConfig: dto.timeConfig,
      priority: dto.priority,
      category: dto.category,
      tags: dto.tags,
      notificationSettings: dto.notificationSettings,
      snoozeConfig: dto.snoozeConfig,
      lifecycle: {
        createdAt: dto.lifecycle.createdAt,
        updatedAt: dto.lifecycle.updatedAt,
        lastTriggered: dto.lifecycle.lastTriggered,
        triggerCount: dto.lifecycle.triggerCount,
      },
      analytics: dto.analytics,
      version: dto.version,
    });
  }

  /**
   * 克隆当前对象（深拷贝）
   */
  clone(): ReminderTemplate {
    return ReminderTemplate.fromDTO(this.toDTO());
  }

  // ===== Getters =====

  get uuid(): string {
    return this._uuid;
  }

  get groupUuid(): string | undefined {
    return this._groupUuid;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | undefined {
    return this._description;
  }

  get message(): string {
    return this._message;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get selfEnabled(): boolean {
    return this._selfEnabled;
  }

  get importanceLevel(): ImportanceLevel {
    return this._importanceLevel;
  }

  get timeConfig(): ReminderContracts.ReminderTimeConfig {
    return this._timeConfig;
  }

  get priority(): ReminderContracts.ReminderPriority {
    return this._priority;
  }

  get category(): string {
    return this._category;
  }

  get tags(): string[] {
    return this._tags;
  }

  get notificationSettings(): ReminderContracts.NotificationSettings | undefined {
    return this._notificationSettings;
  }

  get snoozeConfig(): ReminderContracts.SnoozeConfig | undefined {
    return this._snoozeConfig;
  }

  get lifecycle(): typeof this._lifecycle {
    return this._lifecycle;
  }

  get analytics(): typeof this._analytics {
    return this._analytics;
  }

  get version(): number {
    return this._version;
  }

  get activeInstancesCount(): number {
    return this.instances.filter((instance) => instance.status === 'pending').length;
  }

  get completedInstancesCount(): number {
    return this.instances.filter(
      (instance) => instance.status === 'acknowledged' || instance.status === 'dismissed',
    ).length;
  }
}
