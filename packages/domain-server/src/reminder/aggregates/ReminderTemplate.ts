/**
 * ReminderTemplate 聚合根实现
 * 实现 ReminderTemplateServer 接口
 */

import { ReminderContracts, ImportanceLevel } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import {
  RecurrenceConfig,
  NotificationConfig,
  TriggerConfig,
  ActiveTimeConfig,
  ActiveHoursConfig,
  ReminderStats,
} from '../value-objects';
import { ReminderHistory } from '../entities';

type ReminderTemplateClientDTO = ReminderContracts.ReminderTemplateClientDTO;
type IReminderTemplateServer = ReminderContracts.ReminderTemplateServer;
type ReminderTemplateServerDTO = ReminderContracts.ReminderTemplateServerDTO;
type ReminderTemplatePersistenceDTO = ReminderContracts.ReminderTemplatePersistenceDTO;
type ReminderType = ReminderContracts.ReminderType;
type ReminderStatus = ReminderContracts.ReminderStatus;
type TriggerResult = ReminderContracts.TriggerResult;
type NotificationChannel = ReminderContracts.NotificationChannel;

/**
 * ReminderTemplate 聚合根
 *
 * DDD 聚合根职责：
 * - 管理聚合内的所有实体（ReminderHistory）
 * - 执行业务逻辑
 * - 确保聚合内的一致性
 * - 是事务边界
 */
export class ReminderTemplate extends AggregateRoot implements IReminderTemplateServer {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _title: string;
  private _description: string | null;
  private _type: ReminderType;
  private _trigger: TriggerConfig;
  private _recurrence: RecurrenceConfig | null;
  private _activeTime: ActiveTimeConfig;
  private _activeHours: ActiveHoursConfig | null;
  private _notificationConfig: NotificationConfig;
  private _selfEnabled: boolean;
  private _status: ReminderStatus;
  private _groupUuid: string | null;
  private _importanceLevel: ImportanceLevel;
  private _tags: string[];
  private _color: string | null;
  private _icon: string | null;
  private _nextTriggerAt: number | null;
  private _stats: ReminderStats;
  private _createdAt: number;
  private _updatedAt: number;
  private _deletedAt: number | null;

  // ===== 子实体集合 =====
  private _history: ReminderHistory[];

  // ===== 构造函数（私有，通过工厂方法创建） =====
  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    title: string;
    description?: string | null;
    type: ReminderType;
    trigger: TriggerConfig;
    recurrence?: RecurrenceConfig | null;
    activeTime: ActiveTimeConfig;
    activeHours?: ActiveHoursConfig | null;
    notificationConfig: NotificationConfig;
    selfEnabled: boolean;
    status: ReminderStatus;
    groupUuid?: string | null;
    importanceLevel: ImportanceLevel;
    tags?: string[];
    color?: string | null;
    icon?: string | null;
    nextTriggerAt?: number | null;
    stats: ReminderStats;
    createdAt: number;
    updatedAt: number;
    deletedAt?: number | null;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._title = params.title;
    this._description = params.description ?? null;
    this._type = params.type;
    this._trigger = params.trigger;
    this._recurrence = params.recurrence ?? null;
    this._activeTime = params.activeTime;
    this._activeHours = params.activeHours ?? null;
    this._notificationConfig = params.notificationConfig;
    this._selfEnabled = params.selfEnabled;
    this._status = params.status;
    this._groupUuid = params.groupUuid ?? null;
    this._importanceLevel = params.importanceLevel;
    this._tags = params.tags ? [...params.tags] : [];
    this._color = params.color ?? null;
    this._icon = params.icon ?? null;
    this._nextTriggerAt = params.nextTriggerAt ?? null;
    this._stats = params.stats;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt ?? null;
    this._history = [];
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get title(): string {
    return this._title;
  }
  public get description(): string | null {
    return this._description;
  }
  public get type(): ReminderType {
    return this._type;
  }
  public get trigger(): ReminderContracts.TriggerConfigServerDTO {
    return this._trigger.toServerDTO();
  }
  public get recurrence(): ReminderContracts.RecurrenceConfigServerDTO | null {
    return this._recurrence ? this._recurrence.toServerDTO() : null;
  }
  public get activeTime(): ReminderContracts.ActiveTimeConfigServerDTO {
    return this._activeTime.toServerDTO();
  }
  public get activeHours(): ReminderContracts.ActiveHoursConfigServerDTO | null {
    return this._activeHours ? this._activeHours.toServerDTO() : null;
  }
  public get notificationConfig(): ReminderContracts.NotificationConfigServerDTO {
    return this._notificationConfig.toServerDTO();
  }
  public get selfEnabled(): boolean {
    return this._selfEnabled;
  }
  public get status(): ReminderStatus {
    return this._status;
  }
  public get groupUuid(): string | null {
    return this._groupUuid;
  }
  public get importanceLevel(): ImportanceLevel {
    return this._importanceLevel;
  }
  public get tags(): string[] {
    return [...this._tags];
  }
  public get color(): string | null {
    return this._color;
  }
  public get icon(): string | null {
    return this._icon;
  }
  public get nextTriggerAt(): number | null {
    return this._nextTriggerAt;
  }
  public get stats(): ReminderContracts.ReminderStatsServerDTO {
    return this._stats.toServerDTO();
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }
  public get deletedAt(): number | null {
    return this._deletedAt;
  }

  public get history(): ReminderHistory[] | null {
    return this._history.length > 0 ? [...this._history] : null;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的 ReminderTemplate 聚合根
   */
  public static create(params: {
    accountUuid: string;
    title: string;
    type: ReminderType;
    trigger: ReminderContracts.TriggerConfigServerDTO;
    activeTime: ReminderContracts.ActiveTimeConfigServerDTO;
    notificationConfig: ReminderContracts.NotificationConfigServerDTO;
    description?: string;
    recurrence?: ReminderContracts.RecurrenceConfigServerDTO;
    activeHours?: ReminderContracts.ActiveHoursConfigServerDTO;
    importanceLevel?: ImportanceLevel;
    tags?: string[];
    color?: string;
    icon?: string;
    groupUuid?: string;
  }): ReminderTemplate {
    const uuid = AggregateRoot.generateUUID();
    const now = Date.now();

    // 创建值对象
    const trigger = TriggerConfig.fromServerDTO(params.trigger);
    const activeTime = ActiveTimeConfig.fromServerDTO(params.activeTime);
    const notificationConfig = NotificationConfig.fromServerDTO(params.notificationConfig);
    const recurrence = params.recurrence ? RecurrenceConfig.fromServerDTO(params.recurrence) : null;
    const activeHours = params.activeHours
      ? ActiveHoursConfig.fromServerDTO(params.activeHours)
      : null;

    // 创建空统计
    const stats = new ReminderStats({
      totalTriggers: 0,
      lastTriggeredAt: null,
    });

    const template = new ReminderTemplate({
      uuid,
      accountUuid: params.accountUuid,
      title: params.title,
      description: params.description,
      type: params.type,
      trigger,
      recurrence,
      activeTime,
      activeHours,
      notificationConfig,
      selfEnabled: true, // 默认启用
      status: ReminderContracts.ReminderStatus.ACTIVE,
      groupUuid: params.groupUuid,
      importanceLevel: params.importanceLevel || ImportanceLevel.Moderate,
      tags: params.tags,
      color: params.color,
      icon: params.icon,
      stats,
      createdAt: now,
      updatedAt: now,
    });

    // 计算下次触发时间
    template._nextTriggerAt = template.calculateNextTrigger();

    // 发布创建事件
    template.addDomainEvent({
      eventType: 'ReminderTemplateCreated',
      aggregateId: uuid,
      occurredOn: new Date(),
      accountUuid: params.accountUuid,
      payload: {
        templateUuid: uuid,
        title: params.title,
        type: params.type,
      },
    });

    return template;
  }

  /**
   * 从 Server DTO 创建实体
   */
  public static fromServerDTO(dto: ReminderTemplateServerDTO): ReminderTemplate {
    const trigger = TriggerConfig.fromServerDTO(dto.trigger);
    const activeTime = ActiveTimeConfig.fromServerDTO(dto.activeTime);
    const notificationConfig = NotificationConfig.fromServerDTO(dto.notificationConfig);
    const recurrence = dto.recurrence ? RecurrenceConfig.fromServerDTO(dto.recurrence) : null;
    const activeHours = dto.activeHours ? ActiveHoursConfig.fromServerDTO(dto.activeHours) : null;
    const stats = ReminderStats.fromServerDTO(dto.stats);

    const template = new ReminderTemplate({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      title: dto.title,
      description: dto.description,
      type: dto.type,
      trigger,
      recurrence,
      activeTime,
      activeHours,
      notificationConfig,
      selfEnabled: dto.selfEnabled,
      status: dto.status,
      groupUuid: dto.groupUuid,
      importanceLevel: dto.importanceLevel,
      tags: dto.tags,
      color: dto.color,
      icon: dto.icon,
      nextTriggerAt: dto.nextTriggerAt,
      stats,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    });

    // 加载历史记录
    if (dto.history) {
      template._history = dto.history.map((h) => ReminderHistory.fromServerDTO(h));
    }

    return template;
  }

  /**
   * 从 Persistence DTO 创建实体
   */
  public static fromPersistenceDTO(dto: ReminderTemplatePersistenceDTO): ReminderTemplate {
    const trigger = TriggerConfig.fromServerDTO(JSON.parse(dto.trigger));
    const activeTime = ActiveTimeConfig.fromServerDTO(JSON.parse(dto.active_time));
    const notificationConfig = NotificationConfig.fromServerDTO(
      JSON.parse(dto.notification_config),
    );
    const recurrence = dto.recurrence
      ? RecurrenceConfig.fromServerDTO(JSON.parse(dto.recurrence))
      : null;
    const activeHours = dto.active_hours
      ? ActiveHoursConfig.fromServerDTO(JSON.parse(dto.active_hours))
      : null;
    const stats = ReminderStats.fromServerDTO(JSON.parse(dto.stats));
    const tags = JSON.parse(dto.tags);

    return new ReminderTemplate({
      uuid: dto.uuid,
      accountUuid: dto.account_uuid,
      title: dto.title,
      description: dto.description,
      type: dto.type,
      trigger,
      recurrence,
      activeTime,
      activeHours,
      notificationConfig,
      selfEnabled: dto.self_enabled,
      status: dto.status,
      groupUuid: dto.group_uuid,
      importanceLevel: dto.importance_level,
      tags,
      color: dto.color,
      icon: dto.icon,
      nextTriggerAt: dto.next_trigger_at,
      stats,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
      deletedAt: dto.deleted_at,
    });
  }

  // ===== 子实体管理方法 =====

  /**
   * 创建子实体：ReminderHistory
   */
  public createHistory(params: {
    triggeredAt: number;
    result: TriggerResult;
    error?: string;
  }): ReminderHistory {
    const history = ReminderHistory.create({
      templateUuid: this.uuid,
      triggeredAt: params.triggeredAt,
      result: params.result,
      error: params.error,
      notificationSent: this._notificationConfig.channels.length > 0,
      notificationChannels: this._notificationConfig.channels,
    });

    this._history.push(history);
    return history;
  }

  /**
   * 添加历史记录到聚合根
   */
  public addHistory(history: ReminderHistory): void {
    this._history.push(history);
  }

  /**
   * 获取所有历史记录
   */
  public getAllHistory(): ReminderHistory[] {
    return [...this._history];
  }

  /**
   * 获取最近 N 条历史记录
   */
  public getRecentHistory(limit: number): ReminderHistory[] {
    return this._history.slice(-limit);
  }

  // ===== 业务方法 =====

  /**
   * 启用模板
   */
  public enable(): void {
    this._selfEnabled = true;
    this._status = ReminderContracts.ReminderStatus.ACTIVE;
    this._updatedAt = Date.now();

    // 发布启用事件
    this.addDomainEvent({
      eventType: 'ReminderTemplateEnabled',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        templateUuid: this.uuid,
      },
    });
  }

  /**
   * 暂停模板
   */
  public pause(): void {
    this._selfEnabled = false;
    this._status = ReminderContracts.ReminderStatus.PAUSED;
    this._updatedAt = Date.now();

    // 发布暂停事件
    this.addDomainEvent({
      eventType: 'ReminderTemplatePaused',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        templateUuid: this.uuid,
      },
    });
  }

  /**
   * 切换状态
   */
  public toggle(): void {
    if (this._selfEnabled) {
      this.pause();
    } else {
      this.enable();
    }
  }

  /**
   * 计算实际启用状态（需要考虑分组）
   */
  public async getEffectiveEnabled(): Promise<boolean> {
    // 注意：这个方法需要在应用层实现，因为需要查询 Group
    // 这里只返回 selfEnabled 状态
    return this._selfEnabled;
  }

  /**
   * 是否实际启用
   */
  public async isEffectivelyEnabled(): Promise<boolean> {
    return this.getEffectiveEnabled();
  }

  /**
   * 计算下次触发时间
   */
  public calculateNextTrigger(): number | null {
    // 这是一个简化版本，实际实现需要根据 trigger 和 recurrence 配置计算
    // 建议在领域服务中实现复杂的计算逻辑
    const now = Date.now();

    // 检查是否在生效期内
    if (now < this._activeTime.startDate) {
      return this._activeTime.startDate;
    }
    if (this._activeTime.endDate && now > this._activeTime.endDate) {
      return null;
    }

    // 简化版本：返回1小时后
    return now + 3600000;
  }

  /**
   * 是否应该现在触发
   */
  public shouldTriggerNow(): boolean {
    const now = Date.now();
    return this._nextTriggerAt !== null && now >= this._nextTriggerAt;
  }

  /**
   * 在指定时间是否应该触发
   */
  public shouldTriggerAt(timestamp: number): boolean {
    return this._nextTriggerAt !== null && timestamp >= this._nextTriggerAt;
  }

  /**
   * 在指定时间是否活跃
   */
  public isActiveAtTime(timestamp: number): boolean {
    // 检查生效时间
    if (timestamp < this._activeTime.startDate) {
      return false;
    }
    if (this._activeTime.endDate && timestamp > this._activeTime.endDate) {
      return false;
    }

    // 检查活跃时间段
    if (this._activeHours && this._activeHours.enabled) {
      const date = new Date(timestamp);
      const hour = date.getHours();
      if (hour < this._activeHours.startHour || hour > this._activeHours.endHour) {
        return false;
      }
    }

    return true;
  }

  /**
   * 记录触发
   */
  public recordTrigger(): void {
    const now = Date.now();

    // 创建历史记录
    this.createHistory({
      triggeredAt: now,
      result: ReminderContracts.TriggerResult.SUCCESS,
    });

    // 更新统计
    this._stats = this._stats.with({
      totalTriggers: this._stats.totalTriggers + 1,
      lastTriggeredAt: now,
    });

    // 计算下次触发时间
    this._nextTriggerAt = this.calculateNextTrigger();
    this._updatedAt = now;

    // 发布触发事件
    this.addDomainEvent({
      eventType: 'ReminderTemplateTriggered',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        templateUuid: this.uuid,
        triggeredAt: now,
        nextTriggerAt: this._nextTriggerAt,
      },
    });
  }

  /**
   * 查询方法
   */
  public isActive(): boolean {
    return this._status === 'ACTIVE';
  }

  public isPaused(): boolean {
    return this._status === 'PAUSED';
  }

  public isOneTime(): boolean {
    return this._type === 'ONE_TIME';
  }

  public isRecurring(): boolean {
    return this._type === 'RECURRING';
  }

  public getNextTriggerTime(): number | null {
    return this._nextTriggerAt;
  }

  public async getGroup(): Promise<any | null> {
    // 需要在应用层实现
    return null;
  }

  /**
   * 软删除
   */
  public softDelete(): void {
    this._deletedAt = Date.now();
    this._updatedAt = Date.now();

    // 发布删除事件
    this.addDomainEvent({
      eventType: 'ReminderTemplateDeleted',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        templateUuid: this.uuid,
        templateTitle: this._title,
      },
    });
  }

  /**
   * 恢复
   */
  public restore(): void {
    this._deletedAt = null;
    this._updatedAt = Date.now();
  }

  /**
   * 标签管理
   */
  public addTag(tag: string): void {
    if (!this._tags.includes(tag)) {
      this._tags.push(tag);
      this._updatedAt = Date.now();
    }
  }

  public removeTag(tag: string): void {
    const index = this._tags.indexOf(tag);
    if (index > -1) {
      this._tags.splice(index, 1);
      this._updatedAt = Date.now();
    }
  }

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(includeChildren = false): ReminderTemplateServerDTO {
    const dto: ReminderTemplateServerDTO = {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      title: this.title,
      description: this.description,
      type: this.type,
      trigger: this.trigger,
      recurrence: this.recurrence,
      activeTime: this.activeTime,
      activeHours: this.activeHours,
      notificationConfig: this.notificationConfig,
      selfEnabled: this.selfEnabled,
      status: this.status,
      groupUuid: this.groupUuid,
      importanceLevel: this.importanceLevel,
      tags: this.tags,
      color: this.color,
      icon: this.icon,
      nextTriggerAt: this.nextTriggerAt,
      stats: this.stats,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };

    if (includeChildren && this._history.length > 0) {
      dto.history = this._history.map((h) => h.toServerDTO());
    }

    return dto;
  }

  public toClientDTO(includeChildren = false): ReminderTemplateClientDTO {
    // Note: effectiveEnabled and controlledByGroup should ideally be passed in
    // from an application service that has the context of the group.
    // Here we default to the template's own state.
    const effectiveEnabled = this.selfEnabled;
    const controlledByGroup = !!this.groupUuid;

    const typeText = this.type === 'ONE_TIME' ? '一次性' : '循环';
    const statusText = this.status === 'ACTIVE' ? '活跃' : '暂停';
    const importanceMap: Record<ImportanceLevel, string> = {
      [ImportanceLevel.Vital]: '关键',
      [ImportanceLevel.Important]: '重要',
      [ImportanceLevel.Moderate]: '中等',
      [ImportanceLevel.Minor]: '次要',
      [ImportanceLevel.Trivial]: '琐碎',
    };
    const importanceText = importanceMap[this.importanceLevel];

    // 简单的相对时间文本
    const formatRelativeTime = (timestamp: number | null): string | undefined => {
      if (!timestamp) return undefined;
      const diff = timestamp - Date.now();
      if (diff < 0) return `${Math.round(-diff / 3600000)} 小时前`;
      return `${Math.round(diff / 3600000)} 小时后`;
    };

    const clientDTO: ReminderTemplateClientDTO = {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      title: this.title,
      description: this.description,
      type: this.type,
      trigger: this._trigger.toClientDTO(),
      recurrence: this._recurrence ? this._recurrence.toClientDTO() : null,
      activeTime: this._activeTime.toClientDTO(),
      activeHours: this._activeHours ? this._activeHours.toClientDTO() : null,
      notificationConfig: this._notificationConfig.toClientDTO(),
      selfEnabled: this.selfEnabled,
      status: this.status,
      effectiveEnabled: effectiveEnabled,
      groupUuid: this.groupUuid,
      importanceLevel: this.importanceLevel,
      tags: this.tags,
      color: this.color,
      icon: this.icon,
      nextTriggerAt: this.nextTriggerAt,
      stats: this._stats.toClientDTO(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,

      // UI 扩展
      displayTitle: this.title,
      typeText,
      triggerText: this._trigger.toClientDTO().displayText,
      recurrenceText: this._recurrence?.toClientDTO().displayText,
      statusText,
      importanceText,
      nextTriggerText: formatRelativeTime(this.nextTriggerAt),
      isActive: this.status === 'ACTIVE',
      isPaused: this.status === 'PAUSED',
      lastTriggeredText: formatRelativeTime(this.stats.lastTriggeredAt ?? null),
      controlledByGroup: controlledByGroup,
    };

    if (includeChildren && this.history) {
      clientDTO.history = this.history.map((h) => h.toClientDTO());
    }

    return clientDTO;
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): ReminderTemplatePersistenceDTO {
    return {
      uuid: this.uuid,
      account_uuid: this.accountUuid,
      title: this.title,
      description: this.description,
      type: this.type,
      trigger: JSON.stringify(this._trigger.toServerDTO()),
      recurrence: this._recurrence ? JSON.stringify(this._recurrence.toServerDTO()) : null,
      active_time: JSON.stringify(this._activeTime.toServerDTO()),
      active_hours: this._activeHours ? JSON.stringify(this._activeHours.toServerDTO()) : null,
      notification_config: JSON.stringify(this._notificationConfig.toServerDTO()),
      self_enabled: this.selfEnabled,
      status: this.status,
      group_uuid: this.groupUuid,
      importance_level: this.importanceLevel,
      tags: JSON.stringify(this.tags),
      color: this.color,
      icon: this.icon,
      next_trigger_at: this.nextTriggerAt,
      stats: JSON.stringify(this._stats.toServerDTO()),
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      deleted_at: this.deletedAt,
    };
  }
}
