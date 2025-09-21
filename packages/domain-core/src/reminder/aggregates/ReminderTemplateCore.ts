import { AggregateRoot } from '@dailyuse/utils';
import { ImportanceLevel, ReminderContracts } from '@dailyuse/contracts';
import type { ReminderInstanceCore } from '../entities/ReminderInstanceCore';

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
  protected _timeConfig: ReminderContracts.ReminderTimeConfig;
  protected _priority: ReminderContracts.ReminderPriority;
  protected _category: string;
  protected _tags: string[];
  protected _icon?: string;
  protected _color?: string;
  protected _position?: { x: number; y: number };
  protected _displayOrder: number;
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

  // 聚合根关联的实体 - 由子类实现具体类型
  abstract instances: ReminderInstanceCore[];

  constructor(params: {
    uuid?: string;
    groupUuid?: string;
    name: string;
    description?: string;
    message?: string;
    enabled?: boolean;
    selfEnabled?: boolean;
    importanceLevel?: ImportanceLevel;
    timeConfig?: ReminderContracts.ReminderTimeConfig;
    priority?: ReminderContracts.ReminderPriority;
    category?: string;
    tags?: string[];
    icon?: string;
    color?: string;
    position?: { x: number; y: number };
    displayOrder?: number;
    notificationSettings?: ReminderContracts.NotificationSettings;
    snoozeConfig?: ReminderContracts.SnoozeConfig;
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
    this._importanceLevel = params.importanceLevel || ImportanceLevel.Moderate;
    this._timeConfig = params.timeConfig || {
      type: 'daily',
      times: ['09:00'],
    };
    this._priority = params.priority || ReminderContracts.ReminderPriority.NORMAL;
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

  get notificationSettings(): ReminderContracts.NotificationSettings | undefined {
    return this._notificationSettings;
  }

  get snoozeConfig(): ReminderContracts.SnoozeConfig | undefined {
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
    return this._timeConfig.type !== 'absolute' && this._timeConfig.type !== 'relative';
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
   * 获取活跃实例数量
   */
  get activeInstanceCount(): number {
    return this.instances.filter((instance) => instance.isActive).length;
  }

  /**
   * 获取今日实例数量
   */
  get todayInstanceCount(): number {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999,
    );

    return this.instances.filter((instance) => {
      const triggerTime = instance.triggerTime;
      return triggerTime >= todayStart && triggerTime <= todayEnd;
    }).length;
  }

  /**
   * 获取完成率
   */
  get completionRate(): number {
    if (this.instances.length === 0) return 0;
    const completedCount = this.instances.filter((instance) => instance.isCompleted).length;
    return (completedCount / this.instances.length) * 100;
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

    const completionRate = this.completionRate;
    const consistencyScore = this.calculateConsistencyScore();

    return acknowledgmentRate * 0.4 + completionRate * 0.4 + consistencyScore * 0.2;
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

  protected validateTimeConfig(timeConfig: ReminderContracts.ReminderTimeConfig): void {
    if (!timeConfig) {
      throw new Error('时间配置不能为空');
    }

    if (timeConfig.type === 'absolute' && !timeConfig.schedule) {
      throw new Error('绝对时间提醒必须指定时间规则');
    }

    if (timeConfig.type === 'custom' && !timeConfig.customPattern) {
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
  protected calculateNextTriggerTime(rule: ReminderContracts.RecurrenceRule): Date {
    const now = new Date();
    const baseTime = this._lifecycle.lastTriggered || this._lifecycle.createdAt;

    switch (rule.pattern) {
      case ReminderContracts.RecurrencePattern.DAILY:
        return this.calculateDailyNext(baseTime, rule, now);
      case ReminderContracts.RecurrencePattern.WEEKLY:
        return this.calculateWeeklyNext(baseTime, rule, now);
      case ReminderContracts.RecurrencePattern.MONTHLY:
        return this.calculateMonthlyNext(baseTime, rule, now);
      case ReminderContracts.RecurrencePattern.YEARLY:
        return this.calculateYearlyNext(baseTime, rule, now);
      default:
        throw new Error(`不支持的重复类型: ${rule.pattern}`);
    }
  }

  private calculateDailyNext(
    baseTime: Date,
    rule: ReminderContracts.RecurrenceRule,
    now: Date,
  ): Date {
    const next = new Date(baseTime);
    const interval = rule.interval || 1;

    do {
      next.setDate(next.getDate() + interval);
    } while (next <= now);

    return next;
  }

  private calculateWeeklyNext(
    baseTime: Date,
    rule: ReminderContracts.RecurrenceRule,
    now: Date,
  ): Date {
    const next = new Date(baseTime);
    const interval = rule.interval || 1;

    do {
      next.setDate(next.getDate() + 7 * interval);
    } while (next <= now);

    return next;
  }

  private calculateMonthlyNext(
    baseTime: Date,
    rule: ReminderContracts.RecurrenceRule,
    now: Date,
  ): Date {
    const next = new Date(baseTime);
    const interval = rule.interval || 1;

    do {
      next.setMonth(next.getMonth() + interval);
    } while (next <= now);

    return next;
  }

  private calculateYearlyNext(
    baseTime: Date,
    rule: ReminderContracts.RecurrenceRule,
    now: Date,
  ): Date {
    const next = new Date(baseTime);
    const interval = rule.interval || 1;

    do {
      next.setFullYear(next.getFullYear() + interval);
    } while (next <= now);

    return next;
  }

  /**
   * 计算一致性评分
   */
  protected calculateConsistencyScore(): number {
    if (this.instances.length < 3) return 100; // 数据不足时返回满分

    const recentInstances = this.instances
      .filter((instance) => {
        const daysDiff =
          (new Date().getTime() - instance.triggerTime.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30; // 最近30天
      })
      .sort((a, b) => b.triggerTime.getTime() - a.triggerTime.getTime())
      .slice(0, 10); // 最近10次

    if (recentInstances.length < 3) return 100;

    const acknowledgedCount = recentInstances.filter((instance) => instance.isAcknowledged).length;
    const consistencyRate = (acknowledgedCount / recentInstances.length) * 100;

    return Math.max(0, Math.min(100, consistencyRate));
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
  updateTimeConfig(timeConfig: ReminderContracts.ReminderTimeConfig): void {
    this.validateTimeConfig(timeConfig);
    this._timeConfig = timeConfig;
    this.updateVersion();
  }

  /**
   * 更新通知设置
   */
  updateNotificationSettings(settings: ReminderContracts.NotificationSettings): void {
    this._notificationSettings = settings;
    this.updateVersion();
  }

  /**
   * 更新延迟配置
   */
  updateSnoozeConfig(config: ReminderContracts.SnoozeConfig): void {
    this._snoozeConfig = config;
    this.updateVersion();
  }

  /**
   * 切换启用状态
   */
  toggleEnabled(enabled: boolean): void {
    this._enabled = enabled;
    this.updateVersion();
  }

  /**
   * 切换自身启用状态
   */
  toggleSelfEnabled(selfEnabled: boolean): void {
    this._selfEnabled = selfEnabled;
    this.updateVersion();
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

  // ===== 抽象方法（由子类实现）=====

  /**
   * 创建提醒实例（抽象方法）
   */
  abstract createInstance(triggerTime: Date, context?: any): string;

  /**
   * 获取指定实例（抽象方法）
   */
  abstract getInstance(instanceUuid: string): ReminderInstanceCore | undefined;

  /**
   * 删除实例（抽象方法）
   */
  abstract removeInstance(instanceUuid: string): void;

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

  toDTO(): ReminderContracts.IReminderTemplate {
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

  static fromDTO(dto: ReminderContracts.IReminderTemplate): ReminderTemplateCore {
    throw new Error('Method not implemented. Use subclass implementations.');
  }
}
