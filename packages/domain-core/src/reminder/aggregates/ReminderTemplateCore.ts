import { AggregateRoot } from '@dailyuse/utils';
import { sharedContracts, ReminderContracts } from '@dailyuse/contracts';

// ===== 类型和枚举别名 =====
// sharedContracts 类型别名
type ImportanceLevel = sharedContracts.ImportanceLevel;
const ImportanceLevelEnum = sharedContracts.ImportanceLevel;

// ReminderContracts 类型别名
type ReminderTimeConfigType = ReminderContracts.ReminderTimeConfigType;
const ReminderTimeConfigTypeEnum = ReminderContracts.ReminderTimeConfigType;
type ReminderTimeConfig = ReminderContracts.ReminderTimeConfig;
type ReminderPriority = ReminderContracts.ReminderPriority;
const ReminderPriorityEnum = ReminderContracts.ReminderPriority;
type NotificationSettings = ReminderContracts.NotificationSettings;
type SnoozeConfig = ReminderContracts.SnoozeConfig;
type RecurrenceRule = ReminderContracts.RecurrenceRule;
type RecurrencePattern = ReminderContracts.RecurrencePattern;
const RecurrencePatternEnum = ReminderContracts.RecurrencePattern;
type IReminderTemplate = ReminderContracts.IReminderTemplate;

/**
 * ReminderTemplate核心基类 - 包含共享属性和基础计算
 * 作为聚合根管理ReminderInstance实体的生命周期
 */
export abstract class ReminderTemplateCore extends AggregateRoot {
  // 核心属性
  protected _groupUuid?: string;
  protected _name: string;
  protected _description?: string;
  protected _message: string;
  protected _enabled: boolean;
  protected _selfEnabled: boolean;
  protected _importanceLevel: ImportanceLevel;
  protected _timeConfig: ReminderTimeConfig;
  protected _priority: ReminderPriority;
  protected _category: string;
  protected _tags: string[];
  protected _icon?: string;
  protected _color?: string;
  protected _position?: { x: number; y: number };
  protected _displayOrder: number;
  protected _notificationSettings?: NotificationSettings;
  protected _snoozeConfig?: SnoozeConfig;
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

  constructor(params: {
    uuid?: string;
    groupUuid?: string;
    name: string;
    description?: string;
    message?: string;
    enabled?: boolean;
    selfEnabled?: boolean;
    importanceLevel?: ImportanceLevel;
    timeConfig?: ReminderTimeConfig;
    priority?: ReminderPriority;
    category?: string;
    tags?: string[];
    icon?: string;
    color?: string;
    position?: { x: number; y: number };
    displayOrder?: number;
    notificationSettings?: NotificationSettings;
    snoozeConfig?: SnoozeConfig;
    lifecycle?: {
      createdAt?: Date;
      updatedAt?: Date;
      lastTriggered?: Date;
      triggerCount?: number;
    };
    analytics?: {
      totalTriggers?: number;
      acknowledgedCount?: number;
      dismissedCount?: number;
      snoozeCount?: number;
      avgResponseTime?: number;
    };
    version?: number;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());

    const now = new Date();

    this._groupUuid = params.groupUuid;
    this._name = params.name || '';
    this._description = params.description;
    this._message = params.message || '';
    this._enabled = params.enabled ?? true;
    this._selfEnabled = params.selfEnabled ?? true;
    this._importanceLevel = params.importanceLevel || ImportanceLevelEnum.Moderate;
    this._timeConfig =
      params.timeConfig ||
      ({
        type: ReminderTimeConfigTypeEnum.DAILY,
        times: ['09:00'],
      } satisfies ReminderTimeConfig);
    this._priority = params.priority || ReminderPriorityEnum.NORMAL;
    this._category = params.category || '';
    this._tags = params.tags || [];
    this._icon = params.icon;
    this._color = params.color;
    this._position = params.position;
    this._displayOrder = params.displayOrder || 0;
    this._notificationSettings = params.notificationSettings;
    this._snoozeConfig = params.snoozeConfig;
    this._lifecycle = {
      createdAt: params.lifecycle?.createdAt || now,
      updatedAt: params.lifecycle?.updatedAt || now,
      lastTriggered: params.lifecycle?.lastTriggered,
      triggerCount: params.lifecycle?.triggerCount || 0,
    };
    this._analytics = {
      totalTriggers: params.analytics?.totalTriggers || 0,
      acknowledgedCount: params.analytics?.acknowledgedCount || 0,
      dismissedCount: params.analytics?.dismissedCount || 0,
      snoozeCount: params.analytics?.snoozeCount || 0,
      avgResponseTime: params.analytics?.avgResponseTime,
    };
    this._version = params.version || 0;
  }

  // ===== 共享只读属性 =====
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

  get timeConfig(): ReminderTimeConfig {
    return this._timeConfig;
  }

  get priority(): ReminderPriority {
    return this._priority;
  }

  get category(): string {
    return this._category;
  }

  get tags(): string[] {
    return this._tags;
  }

  get icon(): string | undefined {
    return this._icon;
  }

  get color(): string | undefined {
    return this._color;
  }

  get position(): { x: number; y: number } | undefined {
    return this._position;
  }

  get displayOrder(): number {
    return this._displayOrder;
  }

  get notificationSettings(): NotificationSettings | undefined {
    return this._notificationSettings;
  }

  get snoozeConfig(): SnoozeConfig | undefined {
    return this._snoozeConfig;
  }

  get lifecycle(): {
    createdAt: Date;
    updatedAt: Date;
    lastTriggered?: Date;
    triggerCount: number;
  } {
    return this._lifecycle;
  }

  get analytics(): {
    totalTriggers: number;
    acknowledgedCount: number;
    dismissedCount: number;
    snoozeCount: number;
    avgResponseTime?: number;
  } {
    return this._analytics;
  }

  get version(): number {
    return this._version;
  }

  get createdAt(): Date {
    return this._lifecycle.createdAt;
  }

  get updatedAt(): Date {
    return this._lifecycle.updatedAt;
  }

  get lastTriggered(): Date | undefined {
    return this._lifecycle.lastTriggered;
  }

  get triggerCount(): number {
    return this._lifecycle.triggerCount;
  }

  // ===== 共享计算属性 =====

  /**
   * 检查模板是否实际启用（考虑自身和组的启用状态）
   */
  get isActuallyEnabled(): boolean {
    return this._enabled && this._selfEnabled;
  }

  /**
   * 检查是否为重复提醒
   */
  get isRecurring(): boolean {
    return (
      this._timeConfig.type !== ReminderTimeConfigTypeEnum.ABSOLUTE &&
      this._timeConfig.type !== ReminderTimeConfigTypeEnum.RELATIVE
    );
  }

  /**
   * 获取下次触发时间（如果是重复提醒）
   */
  get nextTriggerTime(): Date | null {
    if (!this.isRecurring || !this.isActuallyEnabled) {
      return null;
    }

    if (this._timeConfig.schedule) {
      // 基于重复规则计算下次触发时间
      return this.calculateNextTriggerTime(this._timeConfig.schedule);
    }

    return null;
  }

  /**
   * 获取平均响应时间
   */
  get averageResponseTime(): number | undefined {
    return this._analytics.avgResponseTime;
  }

  /**
   * 计算效果评分
   */
  get effectivenessScore(): number {
    const acknowledgmentRate =
      this._analytics.totalTriggers > 0
        ? (this._analytics.acknowledgedCount / this._analytics.totalTriggers) * 100
        : 0;

    const consistencyScore = this.calculateConsistencyScore();

    return acknowledgmentRate * 0.5 + consistencyScore * 0.5;
  }

  // ===== 共享验证方法 =====

  protected validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('提醒模板名称不能为空');
    }
    if (name.length > 100) {
      throw new Error('提醒模板名称不能超过100个字符');
    }
  }

  protected validateMessage(message: string): void {
    if (!message || message.trim().length === 0) {
      throw new Error('提醒消息不能为空');
    }
    if (message.length > 500) {
      throw new Error('提醒消息不能超过500个字符');
    }
  }

  protected validateTimeConfig(timeConfig: ReminderTimeConfig): void {
    if (!timeConfig) {
      throw new Error('时间配置不能为空');
    }

    if (timeConfig.type === ReminderTimeConfigTypeEnum.ABSOLUTE && !timeConfig.schedule) {
      throw new Error('绝对时间提醒必须指定时间规则');
    }

    if (timeConfig.type === ReminderTimeConfigTypeEnum.CUSTOM && !timeConfig.customPattern) {
      throw new Error('自定义提醒必须指定自定义规则');
    }
  }

  protected validateDisplayOrder(displayOrder: number): void {
    if (displayOrder < 0) {
      throw new Error('显示顺序不能为负数');
    }
  }

  // ===== 共享计算方法 =====

  /**
   * 计算下次触发时间
   */
  protected calculateNextTriggerTime(rule: RecurrenceRule): Date {
    const now = new Date();
    const baseTime = this._lifecycle.lastTriggered || this._lifecycle.createdAt;

    switch (rule.pattern) {
      case RecurrencePatternEnum.DAILY:
        return this.calculateDailyNext(baseTime, rule, now);
      case RecurrencePatternEnum.WEEKLY:
        return this.calculateWeeklyNext(baseTime, rule, now);
      case RecurrencePatternEnum.MONTHLY:
        return this.calculateMonthlyNext(baseTime, rule, now);
      case RecurrencePatternEnum.YEARLY:
        return this.calculateYearlyNext(baseTime, rule, now);
      default:
        throw new Error(`不支持的重复类型: ${rule.pattern}`);
    }
  }

  private calculateDailyNext(baseTime: Date, rule: RecurrenceRule, now: Date): Date {
    const next = new Date(baseTime);
    const interval = rule.interval || 1;

    do {
      next.setDate(next.getDate() + interval);
    } while (next <= now);

    return next;
  }

  private calculateWeeklyNext(baseTime: Date, rule: RecurrenceRule, now: Date): Date {
    const next = new Date(baseTime);
    const interval = rule.interval || 1;

    do {
      next.setDate(next.getDate() + 7 * interval);
    } while (next <= now);

    return next;
  }

  private calculateMonthlyNext(baseTime: Date, rule: RecurrenceRule, now: Date): Date {
    const next = new Date(baseTime);
    const interval = rule.interval || 1;

    do {
      next.setMonth(next.getMonth() + interval);
    } while (next <= now);

    return next;
  }

  private calculateYearlyNext(baseTime: Date, rule: RecurrenceRule, now: Date): Date {
    const next = new Date(baseTime);
    const interval = rule.interval || 1;

    do {
      next.setFullYear(next.getFullYear() + interval);
    } while (next <= now);

    return next;
  }

  /**
   * 计算一致性评分
   * 基于确认率和忽略率计算
   */
  protected calculateConsistencyScore(): number {
    if (this._analytics.totalTriggers < 3) return 100; // 数据不足时返回满分

    const acknowledgedRate =
      (this._analytics.acknowledgedCount / this._analytics.totalTriggers) * 100;
    const dismissedRate = (this._analytics.dismissedCount / this._analytics.totalTriggers) * 100;

    // 确认率高、忽略率低 = 高一致性
    return Math.max(0, Math.min(100, acknowledgedRate - dismissedRate * 0.5));
  }

  // ===== 共享业务方法 =====

  /**
   * 更新模板基本信息
   */
  updateBasicInfo(params: {
    name?: string;
    description?: string;
    message?: string;
    category?: string;
    tags?: string[];
    icon?: string;
    color?: string;
    position?: { x: number; y: number };
    displayOrder?: number;
  }): void {
    if (params.name !== undefined) {
      this.validateName(params.name);
      this._name = params.name;
    }

    if (params.description !== undefined) {
      this._description = params.description;
    }

    if (params.message !== undefined) {
      this.validateMessage(params.message);
      this._message = params.message;
    }

    if (params.category !== undefined) {
      this._category = params.category;
    }

    if (params.tags !== undefined) {
      this._tags = params.tags;
    }

    if (params.icon !== undefined) {
      this._icon = params.icon;
    }

    if (params.color !== undefined) {
      this._color = params.color;
    }

    if (params.position !== undefined) {
      this._position = params.position;
    }

    if (params.displayOrder !== undefined) {
      this.validateDisplayOrder(params.displayOrder);
      this._displayOrder = params.displayOrder;
    }

    this.updateVersion();
  }

  /**
   * 更新时间配置
   */
  updateTimeConfig(timeConfig: ReminderTimeConfig): void {
    const oldTimeConfig = { ...this._timeConfig };
    this.validateTimeConfig(timeConfig);
    this._timeConfig = timeConfig;
    this.updateVersion();

    // 发布时间配置变化事件，供 Schedule 模块监听
    this.addDomainEvent({
      eventType: 'ReminderTemplateTimeConfigChanged',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        templateUuid: this.uuid,
        oldTimeConfig,
        newTimeConfig: timeConfig,
        template: this.toDTO(),
      },
    });
  }

  /**
   * 更新通知设置
   */
  updateNotificationSettings(settings: NotificationSettings): void {
    this._notificationSettings = settings;
    this.updateVersion();
  }

  /**
   * 更新延迟配置
   */
  updateSnoozeConfig(config: SnoozeConfig): void {
    this._snoozeConfig = config;
    this.updateVersion();
  }

  /**
   * 切换启用状态
   */
  toggleEnabled(enabled: boolean, context?: { accountUuid: string }): void {
    const oldEnabled = this._enabled;
    this._enabled = enabled;
    this.updateVersion();

    // 发布状态变化领域事件，供 Schedule 模块监听
    this.addDomainEvent({
      eventType: 'ReminderTemplateStatusChanged',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        templateUuid: this.uuid,
        oldEnabled,
        newEnabled: enabled,
        template: this.toDTO(),
        accountUuid: context?.accountUuid,
      },
    });
  }

  /**
   * 切换自身启用状态
   */
  toggleSelfEnabled(selfEnabled: boolean, context?: { accountUuid: string }): void {
    const oldSelfEnabled = this._selfEnabled;
    this._selfEnabled = selfEnabled;
    this.updateVersion();

    // 自身启用状态变化也影响整体启用状态
    const oldActualEnabled = oldSelfEnabled && this._enabled;
    const newActualEnabled = selfEnabled && this._enabled;

    if (oldActualEnabled !== newActualEnabled) {
      this.addDomainEvent({
        eventType: 'ReminderTemplateStatusChanged',
        aggregateId: this.uuid,
        occurredOn: new Date(),
        payload: {
          templateUuid: this.uuid,
          oldEnabled: oldActualEnabled,
          newEnabled: newActualEnabled,
          template: this.toDTO(),
          accountUuid: context?.accountUuid,
        },
      });
    }
  }

  /**
   * 记录触发事件
   */
  recordTrigger(): void {
    this._lifecycle.lastTriggered = new Date();
    this._lifecycle.triggerCount++;
    this._analytics.totalTriggers++;
    this.updateVersion();
  }

  /**
   * 记录确认事件
   */
  recordAcknowledgment(responseTime?: number): void {
    this._analytics.acknowledgedCount++;

    if (responseTime !== undefined) {
      // 更新平均响应时间
      const currentAvg = this._analytics.avgResponseTime || 0;
      const count = this._analytics.acknowledgedCount;
      this._analytics.avgResponseTime = (currentAvg * (count - 1) + responseTime) / count;
    }

    this.updateVersion();
  }

  /**
   * 记录忽略事件
   */
  recordDismissal(): void {
    this._analytics.dismissedCount++;
    this.updateVersion();
  }

  /**
   * 记录延迟事件
   */
  recordSnooze(): void {
    this._analytics.snoozeCount++;
    this.updateVersion();
  }

  // ===== Schedule 集成相关业务方法 =====

  /**
   * 删除模板（触发 Schedule 清理）
   */
  markForDeletion(context: { accountUuid: string }): void {
    // 发布模板删除事件，供 Schedule 模块监听
    this.addDomainEvent({
      eventType: 'ReminderTemplateDeleted',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        templateUuid: this.uuid,
        accountUuid: context.accountUuid,
        template: this.toDTO(),
      },
    });
  }

  /**
   * 同步到调度系统
   */
  requestScheduleSync(context: {
    accountUuid: string;
    operation: 'create' | 'update' | 'delete';
    reason?: string;
  }): void {
    this.addDomainEvent({
      eventType: 'ReminderTemplateSyncRequested',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        templateUuid: this.uuid,
        accountUuid: context.accountUuid,
        operation: context.operation,
        reason: context.reason,
        template: this.toDTO(),
      },
    });
  }

  /**
   * 处理来自 Schedule 的触发请求
   * 不再创建实例，直接发布通知事件
   */
  handleScheduleTrigger(params: {
    scheduledTime: Date;
    scheduleTaskId: string;
    metadata?: Record<string, any>;
  }): void {
    // 记录触发统计
    this.recordTrigger();

    // 直接发布提醒触发事件给 Notification 模块
    this.addDomainEvent({
      eventType: 'ReminderTriggeredBySchedule',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        templateUuid: this.uuid,
        scheduleTaskId: params.scheduleTaskId,
        scheduledTime: params.scheduledTime,
        template: this.toDTO(),
        metadata: params.metadata,
      },
    });
  }

  /**
   * 批量处理状态变化
   */
  batchUpdateStatus(params: {
    enabled?: boolean;
    timeConfig?: ReminderTimeConfig;
    priority?: ReminderPriority;
    notificationSettings?: NotificationSettings;
    context: { accountUuid: string; batchId: string };
  }): void {
    const changes: string[] = [];
    const oldState = {
      enabled: this._enabled,
      timeConfig: { ...this._timeConfig },
      priority: this._priority,
    };

    if (params.enabled !== undefined && params.enabled !== this._enabled) {
      this._enabled = params.enabled;
      changes.push('enabled');
    }

    if (
      params.timeConfig &&
      JSON.stringify(params.timeConfig) !== JSON.stringify(this._timeConfig)
    ) {
      this.validateTimeConfig(params.timeConfig);
      this._timeConfig = params.timeConfig;
      changes.push('timeConfig');
    }

    if (params.priority && params.priority !== this._priority) {
      this._priority = params.priority;
      changes.push('priority');
    }

    if (params.notificationSettings) {
      this._notificationSettings = params.notificationSettings;
      changes.push('notificationSettings');
    }

    if (changes.length > 0) {
      this.updateVersion();

      // 发布批量更新事件
      this.addDomainEvent({
        eventType: 'ReminderTemplateBatchUpdated',
        aggregateId: this.uuid,
        occurredOn: new Date(),
        payload: {
          templateUuid: this.uuid,
          batchId: params.context.batchId,
          accountUuid: params.context.accountUuid,
          changes,
          oldState,
          newState: {
            enabled: this._enabled,
            timeConfig: { ...this._timeConfig },
            priority: this._priority,
          },
          template: this.toDTO(),
        },
      });
    }
  }

  /**
   * 检查是否需要同步到 Schedule 系统
   */
  needsScheduleSync(): boolean {
    // 如果模板启用且有有效的时间配置，则需要同步
    return this.isActuallyEnabled && this.isValidTimeConfig();
  }

  /**
   * 验证时间配置是否有效
   */
  private isValidTimeConfig(): boolean {
    if (!this._timeConfig) return false;

    switch (this._timeConfig.type) {
      case ReminderTimeConfigTypeEnum.DAILY:
      case ReminderTimeConfigTypeEnum.WEEKLY:
      case ReminderTimeConfigTypeEnum.MONTHLY:
        return true;
      case ReminderTimeConfigTypeEnum.ABSOLUTE:
        return !!this._timeConfig.schedule;
      case ReminderTimeConfigTypeEnum.CUSTOM:
        return !!this._timeConfig.customPattern;
      case ReminderTimeConfigTypeEnum.RELATIVE:
        return !!this._timeConfig.duration;
      default:
        return false;
    }
  }

  /**
   * 获取调度同步状态
   */
  getScheduleSyncStatus(): {
    needsSync: boolean;
    reason?: string;
    lastSyncAt?: Date;
    syncErrors?: string[];
  } {
    const needsSync = this.needsScheduleSync();

    return {
      needsSync,
      reason: needsSync
        ? '模板已启用且时间配置有效'
        : this.isActuallyEnabled
          ? '时间配置无效'
          : '模板未启用',
      // TODO: 从元数据或外部状态获取实际的同步时间和错误信息
    };
  }

  // ===== 抽象方法（由子类实现）=====

  /**
   * 克隆模板（抽象方法）
   */
  abstract clone(): ReminderTemplateCore;

  // ===== 共享辅助方法 =====

  protected updateVersion(): void {
    this._version++;
    this._lifecycle.updatedAt = new Date();
  }

  // ===== 序列化方法 =====

  toDTO(): IReminderTemplate {
    return {
      uuid: this.uuid,
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
      icon: this._icon,
      color: this._color,
      position: this._position,
      displayOrder: this._displayOrder,
      notificationSettings: this._notificationSettings,
      snoozeConfig: this._snoozeConfig,
      lifecycle: this._lifecycle,
      analytics: this._analytics,
      version: this._version,
    };
  }

  static fromDTO(dto: IReminderTemplate): ReminderTemplateCore {
    throw new Error('Method not implemented. Use subclass implementations.');
  }
}
