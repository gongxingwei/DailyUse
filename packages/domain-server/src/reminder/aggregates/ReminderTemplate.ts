import type { ReminderContracts } from '@dailyuse/contracts';
import { ImportanceLevel } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import { ReminderInstance } from '../entities/ReminderInstance';

/**
 * 提醒模板聚合根 - 服务端实现
 * 包含服务端特有的业务逻辑和调度管理
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

    // 服务端特有的验证
    this.validateBusinessRules();
  }

  // ===== DDD聚合根控制模式 - 服务端业务方法 =====

  /**
   * 创建并调度提醒实例（聚合根控制 + 服务端调度）
   */
  async createAndScheduleInstance(instanceData: {
    scheduledTime: Date;
    message?: string;
    priority?: ReminderContracts.ReminderPriority;
    metadata?: {
      category?: string;
      tags?: string[];
      sourceType?: 'template' | 'task' | 'goal' | 'manual';
      sourceId?: string;
    };
  }): Promise<string> {
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

    // 调度通知任务
    await this.scheduleNotificationForInstance(instance);

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'ReminderInstanceCreatedAndScheduled',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        templateUuid: this._uuid,
        instanceUuid,
        scheduledTime: instanceData.scheduledTime,
        scheduled: true,
      },
    });

    return instanceUuid;
  }

  /**
   * 批量创建重复提醒实例（服务端特有）
   */
  async createRecurringInstances(config: {
    startDate: Date;
    endDate: Date;
    recurrenceRule: ReminderContracts.RecurrenceRule;
    maxInstances?: number;
  }): Promise<ReminderInstance[]> {
    if (!this._enabled) {
      throw new Error('无法为禁用的模板创建重复提醒实例');
    }

    const instances: ReminderInstance[] = [];
    const dates = this.calculateRecurrenceDates(config);

    for (const date of dates) {
      const instance = this.createReminderInstance({
        scheduledTime: date,
      });
      await instance.scheduleNotification();
      instances.push(instance);
    }

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'RecurringInstancesCreated',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        templateUuid: this._uuid,
        instanceCount: instances.length,
        startDate: config.startDate,
        endDate: config.endDate,
      },
    });

    return instances;
  }

  /**
   * 触发提醒实例（服务端业务方法）
   */
  async triggerInstance(instanceUuid: string): Promise<void> {
    const instance = this.instances.find((inst) => inst.uuid === instanceUuid);
    if (!instance) {
      throw new Error('提醒实例不存在');
    }

    if (instance.status !== 'pending') {
      throw new Error('只能触发待处理状态的提醒实例');
    }

    // 更新实例状态
    instance.updateStatus('triggered' as ReminderContracts.ReminderStatus, new Date());

    // 更新模板分析数据
    this._analytics.totalTriggers++;
    this._lifecycle.triggerCount++;
    this._lifecycle.lastTriggered = new Date();
    this.updateVersion();

    // 发送通知
    await this.sendNotificationForInstance(instance);

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'ReminderInstanceTriggered',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        templateUuid: this._uuid,
        instanceUuid,
        message: instance.message,
        priority: instance.priority,
      },
    });
  }

  /**
   * 处理实例响应（确认/忽略/稍后提醒/删除）
   */
  async processInstanceResponse(
    instanceUuid: string,
    response: {
      operation: 'acknowledge' | 'dismiss' | 'snooze' | 'delete';
      snoozeUntil?: Date;
      reason?: string;
    },
  ): Promise<void> {
    const instance = this.instances.find((inst) => inst.uuid === instanceUuid);
    if (!instance) {
      throw new Error('提醒实例不存在');
    }

    switch (response.operation) {
      case 'acknowledge':
        if (instance.status !== 'triggered') {
          throw new Error('只能确认已触发状态的提醒实例');
        }
        instance.updateStatus('acknowledged' as ReminderContracts.ReminderStatus, new Date());
        this._analytics.acknowledgedCount++;
        break;

      case 'dismiss':
        if (instance.status !== 'triggered') {
          throw new Error('只能忽略已触发状态的提醒实例');
        }
        instance.updateStatus('dismissed' as ReminderContracts.ReminderStatus, new Date());
        this._analytics.dismissedCount++;
        break;

      case 'snooze':
        if (!response.snoozeUntil) {
          throw new Error('稍后提醒需要指定时间');
        }
        instance.snooze(response.snoozeUntil, response.reason);
        this._analytics.snoozeCount++;
        break;

      case 'delete':
        this.removeInstance(instanceUuid);
        break;
    }

    this._lifecycle.updatedAt = new Date();
    this._version++;

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'ReminderInstanceResponseProcessed',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        templateUuid: this._uuid,
        instanceUuid,
        operation: response.operation,
      },
    });
  }

  // ===== 服务端特有的调度方法 =====

  /**
   * 为实例调度通知任务
   */
  private async scheduleNotificationForInstance(instance: ReminderInstance): Promise<void> {
    // 发布调度事件，由基础设施层处理实际的任务调度
    this.addDomainEvent({
      eventType: 'NotificationScheduleRequested',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        templateUuid: this._uuid,
        instanceUuid: instance.uuid,
        scheduledTime: instance.scheduledTime,
        notificationSettings: this._notificationSettings,
      },
    });
  }

  /**
   * 发送通知
   */
  private async sendNotificationForInstance(instance: ReminderInstance): Promise<void> {
    // 发布通知事件，由基础设施层处理实际的通知发送
    this.addDomainEvent({
      eventType: 'NotificationSendRequested',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        templateUuid: this._uuid,
        instanceUuid: instance.uuid,
        title: instance.title || this._name,
        message: instance.message,
        priority: instance.priority,
        notificationSettings: this._notificationSettings,
      },
    });
  }

  /**
   * 计算重复提醒的时间点
   */
  private calculateRecurrenceDates(config: {
    startDate: Date;
    endDate: Date;
    recurrenceRule: ReminderContracts.RecurrenceRule;
    maxInstances?: number;
  }): Date[] {
    const dates: Date[] = [];
    const { startDate, endDate, recurrenceRule, maxInstances = 100 } = config;

    let currentDate = new Date(startDate);
    let count = 0;

    while (currentDate <= endDate && count < maxInstances) {
      dates.push(new Date(currentDate));

      // 根据重复规则计算下一个时间点
      switch (recurrenceRule.pattern) {
        case 'daily':
          currentDate = new Date(
            currentDate.getTime() + 24 * 60 * 60 * 1000 * (recurrenceRule.interval || 1),
          );
          break;
        case 'weekly':
          currentDate = new Date(
            currentDate.getTime() + 7 * 24 * 60 * 60 * 1000 * (recurrenceRule.interval || 1),
          );
          break;
        case 'monthly':
          currentDate = new Date(currentDate);
          currentDate.setMonth(currentDate.getMonth() + (recurrenceRule.interval || 1));
          break;
        case 'yearly':
          currentDate = new Date(currentDate);
          currentDate.setFullYear(currentDate.getFullYear() + (recurrenceRule.interval || 1));
          break;
        default:
          // 不支持的重复模式
          break;
      }

      count++;

      // 检查结束条件
      if (
        recurrenceRule.endCondition?.type === 'count' &&
        count >= (recurrenceRule.endCondition.count || 1)
      ) {
        break;
      }

      if (
        recurrenceRule.endCondition?.type === 'date' &&
        recurrenceRule.endCondition.endDate &&
        currentDate > recurrenceRule.endCondition.endDate
      ) {
        break;
      }
    }

    return dates;
  }

  // ===== 业务规则验证 =====

  private validateBusinessRules(): void {
    if (!this._name.trim()) {
      throw new Error('提醒模板名称不能为空');
    }

    if (!this._message.trim()) {
      throw new Error('提醒消息不能为空');
    }

    if (this._snoozeConfig?.enabled && this._snoozeConfig.maxCount <= 0) {
      throw new Error('稍后提醒最大次数必须大于0');
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
      lifecycle: dto.lifecycle,
      analytics: dto.analytics,
      version: dto.version,
    });
  }

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
      lifecycle: this._lifecycle,
      analytics: this._analytics,
      version: this._version,
    };
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

  // ===== Setter 方法 =====

  setName(name: string): void {
    if (!name.trim()) {
      throw new Error('提醒模板名称不能为空');
    }
    this._name = name;
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  setDescription(description?: string): void {
    this._description = description;
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  setMessage(message: string): void {
    if (!message.trim()) {
      throw new Error('提醒消息不能为空');
    }
    this._message = message;
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  setPriority(priority: ReminderContracts.ReminderPriority): void {
    this._priority = priority;
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  setCategory(category: string): void {
    this._category = category;
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  setTags(tags: string[]): void {
    this._tags = tags;
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  setEnabled(enabled: boolean): void {
    this._enabled = enabled;
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  setGroupUuid(groupUuid?: string): void {
    this._groupUuid = groupUuid;
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  updateTimeConfig(timeConfig: Partial<ReminderContracts.ReminderTimeConfig>): void {
    this._timeConfig = { ...this._timeConfig, ...timeConfig };
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  // ===== 聚合根业务方法 =====

  scheduleInstance(instanceUuid: string): Promise<void> {
    const instance = this.instances.find((i) => i.uuid === instanceUuid);
    if (!instance) {
      throw new Error('提醒实例不存在');
    }

    return instance.scheduleNotification();
  }

  async scheduleNextInstances(): Promise<void> {
    // 为模板调度下一个实例
    // 这里可以根据时间配置创建和调度实例
    const now = new Date();

    // 简单示例：创建一个基于当前时间的实例
    const nextScheduledTime = new Date(now.getTime() + 60000); // 1分钟后

    await this.createAndScheduleInstance({
      scheduledTime: nextScheduledTime,
    });
  }

  // 创建提醒实例的简化方法（不调度）
  createReminderInstance(instanceData: {
    title?: string;
    message?: string;
    scheduledTime: Date;
    priority?: ReminderContracts.ReminderPriority;
    metadata?: {
      category?: string;
      tags?: string[];
      sourceType?: 'template' | 'task' | 'goal' | 'manual';
      sourceId?: string;
    };
  }): ReminderInstance {
    const instance = new ReminderInstance({
      templateUuid: this._uuid,
      title: instanceData.title,
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
    });

    this.instances.push(instance);
    this._lifecycle.updatedAt = new Date();
    this._version++;

    return instance;
  }

  // ===== 实例管理方法 =====

  updateInstanceStatus(instanceUuid: string, status: ReminderContracts.ReminderStatus): void {
    const instance = this.instances.find((i) => i.uuid === instanceUuid);
    if (!instance) {
      throw new Error('提醒实例不存在');
    }

    instance.updateStatus(status);
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  snoozeInstance(instanceUuid: string, snoozeUntil: Date, reason?: string): void {
    const instance = this.instances.find((i) => i.uuid === instanceUuid);
    if (!instance) {
      throw new Error('提醒实例不存在');
    }

    instance.snooze(snoozeUntil, reason);
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  cancelInstanceSnooze(instanceUuid: string): void {
    const instance = this.instances.find((i) => i.uuid === instanceUuid);
    if (!instance) {
      throw new Error('提醒实例不存在');
    }

    instance.cancelSnooze();
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  removeInstance(instanceUuid: string): void {
    const index = this.instances.findIndex((i) => i.uuid === instanceUuid);
    if (index === -1) {
      throw new Error('提醒实例不存在');
    }

    this.instances.splice(index, 1);
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  toggleEnabled(): void {
    this._enabled = !this._enabled;
    this._lifecycle.updatedAt = new Date();
    this._version++;

    // 发布启用状态变更事件
    this.addDomainEvent({
      eventType: 'ReminderTemplateEnabledToggled',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        templateUuid: this._uuid,
        enabled: this._enabled,
      },
    });
  }

  async cancelAllScheduledInstances(): Promise<void> {
    for (const instance of this.instances) {
      if (instance.status === 'pending' && instance.hasScheduledJob) {
        await instance.cancelScheduledNotification();
      }
    }
  }

  // ===== 计算属性 =====

  get effectiveEnabled(): boolean {
    return this._enabled && this._selfEnabled;
  }

  get metadata(): {
    category: string;
    tags: string[];
    sourceType?: 'template' | 'task' | 'goal' | 'manual';
    sourceId?: string;
  } {
    return {
      category: this._category,
      tags: this._tags,
      sourceType: 'template',
      sourceId: this._uuid,
    };
  }
}
