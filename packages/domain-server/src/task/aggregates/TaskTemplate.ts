/**
 * TaskTemplate 聚合根实现 (Server)
 * 任务模板 - 聚合根
 */

import type { TaskContracts } from '@dailyuse/contracts';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import {
  TaskTimeConfig,
  RecurrenceRule,
  TaskReminderConfig,
  TaskGoalBinding,
} from '../value-objects';
import { TaskTemplateHistory } from '../entities';
import { TaskInstance } from './TaskInstance';

type ITaskTemplate = TaskContracts.TaskTemplateServer;
type TaskTemplateServerDTO = TaskContracts.TaskTemplateServerDTO;
type TaskTemplateClientDTO = TaskContracts.TaskTemplateClientDTO;
type TaskTemplatePersistenceDTO = TaskContracts.TaskTemplatePersistenceDTO;
type TaskType = TaskContracts.TaskType;
type TaskTemplateStatus = TaskContracts.TaskTemplateStatus;

/**
 * TaskTemplate 聚合根
 *
 * DDD 聚合根职责：
 * - 管理任务模板的生命周期
 * - 管理任务实例的生成
 * - 管理历史记录
 * - 执行业务规则
 * - 是事务边界
 */
export class TaskTemplate extends AggregateRoot implements ITaskTemplate {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _title: string;
  private _description: string | null;
  private _taskType: TaskType;
  private _timeConfig: TaskTimeConfig;
  private _recurrenceRule: RecurrenceRule | null;
  private _reminderConfig: TaskReminderConfig | null;
  private _importance: ImportanceLevel;
  private _urgency: UrgencyLevel;
  private _goalBinding: TaskGoalBinding | null;
  private _folderUuid: string | null;
  private _tags: string[];
  private _color: string | null;
  private _status: TaskTemplateStatus;
  private _lastGeneratedDate: number | null;
  private _generateAheadDays: number;
  private _createdAt: number;
  private _updatedAt: number;
  private _deletedAt: number | null;

  // ===== 子实体集合 =====
  private _history: TaskTemplateHistory[];
  private _instances: TaskInstance[];

  // ===== 构造函数（私有，通过工厂方法创建） =====
  private constructor(props: TaskTemplateProps, uuid?: string) {
    super(uuid || AggregateRoot.generateUUID());
    this._accountUuid = props.accountUuid;
    this._title = props.title;
    this._description = props.description ?? null;
    this._taskType = props.taskType;
    this._timeConfig = props.timeConfig;
    this._recurrenceRule = props.recurrenceRule ?? null;
    this._reminderConfig = props.reminderConfig ?? null;
    this._importance = props.importance;
    this._urgency = props.urgency;
    this._goalBinding = props.goalBinding ?? null;
    this._folderUuid = props.folderUuid ?? null;
    this._tags = props.tags;
    this._color = props.color ?? null;
    this._status = props.status;
    this._lastGeneratedDate = props.lastGeneratedDate ?? null;
    this._generateAheadDays = props.generateAheadDays;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._deletedAt = props.deletedAt ?? null;
    this._history = [];
    this._instances = [];
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

  public get taskType(): TaskType {
    return this._taskType;
  }

  public get timeConfig(): TaskTimeConfig {
    return this._timeConfig;
  }

  public get recurrenceRule(): RecurrenceRule | null {
    return this._recurrenceRule;
  }

  public get reminderConfig(): TaskReminderConfig | null {
    return this._reminderConfig;
  }

  public get importance(): ImportanceLevel {
    return this._importance;
  }

  public get urgency(): UrgencyLevel {
    return this._urgency;
  }

  public get goalBinding(): TaskGoalBinding | null {
    return this._goalBinding;
  }

  public get folderUuid(): string | null {
    return this._folderUuid;
  }

  public get tags(): string[] {
    return [...this._tags];
  }

  public get color(): string | null {
    return this._color;
  }

  public get status(): TaskTemplateStatus {
    return this._status;
  }

  public get lastGeneratedDate(): number | null {
    return this._lastGeneratedDate;
  }

  public get generateAheadDays(): number {
    return this._generateAheadDays;
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

  public get history(): TaskTemplateHistory[] {
    return this._history;
  }

  public get instances(): TaskInstance[] {
    return [...this._instances];
  }

  // ===== 实例生成方法 =====

  /**
   * 生成指定日期范围内的任务实例
   */
  public generateInstances(fromDate: number, toDate: number): TaskInstance[] {
    const instances: TaskInstance[] = [];

    if (this._status !== 'ACTIVE') {
      return instances;
    }

    if (this._taskType === 'ONE_TIME') {
      // 单次任务：只在指定日期生成一个实例
      if (
        this._timeConfig.startDate &&
        this._timeConfig.startDate >= fromDate &&
        this._timeConfig.startDate <= toDate
      ) {
        const instance = TaskInstance.create({
          templateUuid: this.uuid,
          accountUuid: this._accountUuid,
          instanceDate: this._timeConfig.startDate,
          timeConfig: this._timeConfig,
        });
        instances.push(instance);
        this._instances.push(instance);
      }
    } else if (this._taskType === 'RECURRING' && this._recurrenceRule) {
      // 重复任务：根据重复规则生成多个实例
      let currentDate = fromDate;
      while (currentDate <= toDate) {
        if (this.shouldGenerateInstance(currentDate)) {
          const instance = TaskInstance.create({
            templateUuid: this.uuid,
            accountUuid: this._accountUuid,
            instanceDate: currentDate,
            timeConfig: this._timeConfig,
          });
          instances.push(instance);
          this._instances.push(instance);
        }
        // 移动到下一天
        currentDate += 86400000;
      }
    }

    if (instances.length > 0) {
      this._lastGeneratedDate = toDate;
      this._updatedAt = Date.now();
    }

    return instances;
  }

  /**
   * 获取指定日期的任务实例
   */
  public getInstanceForDate(date: number): TaskInstance | null {
    return (
      this._instances.find((i) => {
        const instanceDay = new Date(i.instanceDate).setHours(0, 0, 0, 0);
        const targetDay = new Date(date).setHours(0, 0, 0, 0);
        return instanceDay === targetDay;
      }) ?? null
    );
  }

  /**
   * 判断是否应该在指定日期生成实例
   */
  public shouldGenerateInstance(date: number): boolean {
    if (this._status !== 'ACTIVE') {
      return false;
    }

    if (this._taskType === 'ONE_TIME') {
      return false; // 单次任务不在此判断
    }

    if (!this._recurrenceRule) {
      return false;
    }

    // 检查是否在重复规则的有效期内
    if (this._recurrenceRule.endDate && date > this._recurrenceRule.endDate) {
      return false;
    }

    // 检查频率
    const rule = this._recurrenceRule;
    const dateObj = new Date(date);

    switch (rule.frequency) {
      case 'DAILY':
        return true; // 每天都生成

      case 'WEEKLY':
        // 检查是否在指定的星期几
        const dayOfWeek = dateObj.getDay();
        return rule.daysOfWeek.includes(dayOfWeek as any);

      case 'MONTHLY':
        // 每月的指定日期
        // 这里简化处理，实际应该更复杂
        return true;

      case 'YEARLY':
        // 每年的指定日期
        return true;

      default:
        return false;
    }
  }

  // ===== 状态管理方法 =====

  /**
   * 激活模板
   */
  public activate(): void {
    if (this._status === 'PAUSED' || this._status === 'ARCHIVED') {
      this._status = 'ACTIVE' as TaskTemplateStatus;
      this._updatedAt = Date.now();
      this.addHistory('resumed');
    }
  }

  /**
   * 暂停模板
   */
  public pause(): void {
    if (this._status === 'ACTIVE') {
      this._status = 'PAUSED' as TaskTemplateStatus;
      this._updatedAt = Date.now();
      this.addHistory('paused');
    }
  }

  /**
   * 归档模板
   */
  public archive(): void {
    if (this._status !== 'DELETED' && this._status !== 'ARCHIVED') {
      this._status = 'ARCHIVED' as TaskTemplateStatus;
      this._updatedAt = Date.now();
      this.addHistory('archived');
    }
  }

  /**
   * 软删除模板
   */
  public softDelete(): void {
    if (this._status !== 'DELETED') {
      this._status = 'DELETED' as TaskTemplateStatus;
      this._deletedAt = Date.now();
      this._updatedAt = Date.now();
      this.addHistory('deleted');
    }
  }

  /**
   * 恢复模板
   */
  public restore(): void {
    if (this._status === 'DELETED') {
      this._status = 'ACTIVE' as TaskTemplateStatus;
      this._deletedAt = null;
      this._updatedAt = Date.now();
      this.addHistory('restored');
    }
  }

  // ===== 时间规则方法 =====

  /**
   * 判断模板在指定日期是否活跃
   */
  public isActiveOnDate(date: number): boolean {
    if (this._status !== 'ACTIVE') {
      return false;
    }

    if (this._taskType === 'ONE_TIME') {
      return this._timeConfig.startDate === date;
    }

    if (!this._recurrenceRule) {
      return false;
    }

    if (this._recurrenceRule.endDate && date > this._recurrenceRule.endDate) {
      return false;
    }

    return true;
  }

  /**
   * 获取指定日期之后的下一次发生时间
   */
  public getNextOccurrence(afterDate: number): number | null {
    if (this._status !== 'ACTIVE') {
      return null;
    }

    if (this._taskType === 'ONE_TIME') {
      if (this._timeConfig.startDate && this._timeConfig.startDate > afterDate) {
        return this._timeConfig.startDate;
      }
      return null;
    }

    if (!this._recurrenceRule) {
      return null;
    }

    // 简化实现：返回下一天（实际应该根据重复规则计算）
    return afterDate + 86400000;
  }

  // ===== 提醒方法 =====

  /**
   * 是否有提醒
   */
  public hasReminder(): boolean {
    return this._reminderConfig !== null && this._reminderConfig.enabled;
  }

  /**
   * 获取指定实例日期的提醒时间
   */
  public getReminderTime(instanceDate: number): number | null {
    if (!this.hasReminder() || !this._reminderConfig) {
      return null;
    }

    // 简化实现：返回实例日期前1小时
    // 实际应该根据提醒配置计算
    return instanceDate - 3600000;
  }

  // ===== 目标绑定方法 =====

  /**
   * 绑定到目标
   */
  public bindToGoal(goalUuid: string, keyResultUuid: string, incrementValue: number): void {
    this._goalBinding = new TaskGoalBinding({
      goalUuid,
      keyResultUuid,
      incrementValue,
    });
    this._updatedAt = Date.now();
    this.addHistory('goal_bound', { goalUuid, keyResultUuid, incrementValue });
  }

  /**
   * 解除目标绑定
   */
  public unbindFromGoal(): void {
    if (this._goalBinding) {
      this._goalBinding = null;
      this._updatedAt = Date.now();
      this.addHistory('goal_unbound');
    }
  }

  /**
   * 是否绑定到目标
   */
  public isLinkedToGoal(): boolean {
    return this._goalBinding !== null;
  }

  // ===== 历史记录方法 =====

  /**
   * 添加历史记录
   */
  public addHistory(action: string, changes?: any): void {
    const history = TaskTemplateHistory.create({
      templateUuid: this.uuid,
      action,
      changes: changes ? JSON.stringify(changes) : null,
    });
    this._history.push(history);
    this._updatedAt = Date.now();
  }

  // ===== 子实体管理方法 =====

  /**
   * 创建实例
   */
  public createInstance(params: any): string {
    const instance = TaskInstance.create({
      templateUuid: this.uuid,
      accountUuid: this._accountUuid,
      instanceDate: params.instanceDate,
      timeConfig: this._timeConfig,
    });
    this._instances.push(instance);
    this._updatedAt = Date.now();
    return instance.uuid;
  }

  /**
   * 添加实例
   */
  public addInstance(instance: TaskInstance): void {
    this._instances.push(instance);
    this._updatedAt = Date.now();
  }

  /**
   * 移除实例
   */
  public removeInstance(instanceUuid: string): TaskInstance | null {
    const index = this._instances.findIndex((i) => i.uuid === instanceUuid);
    if (index === -1) return null;
    const [removed] = this._instances.splice(index, 1);
    this._updatedAt = Date.now();
    return removed;
  }

  /**
   * 获取实例
   */
  public getInstance(instanceUuid: string): TaskInstance | null {
    return this._instances.find((i) => i.uuid === instanceUuid) ?? null;
  }

  /**
   * 获取所有实例
   */
  public getAllInstances(): TaskInstance[] {
    return [...this._instances];
  }

  // ===== DTO 转换 =====

  public toServerDTO(includeChildren: boolean = false): TaskTemplateServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      description: this._description,
      taskType: this._taskType,
      timeConfig: this._timeConfig.toServerDTO(),
      recurrenceRule: this._recurrenceRule?.toServerDTO() ?? null,
      reminderConfig: this._reminderConfig?.toServerDTO() ?? null,
      importance: this._importance,
      urgency: this._urgency,
      goalBinding: this._goalBinding?.toServerDTO() ?? null,
      folderUuid: this._folderUuid,
      tags: [...this._tags],
      color: this._color,
      status: this._status,
      lastGeneratedDate: this._lastGeneratedDate,
      generateAheadDays: this._generateAheadDays,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
      history: includeChildren ? this._history.map((h) => h.toServerDTO()) : undefined,
      instances: includeChildren ? this._instances.map((i) => i.toServerDTO()) : undefined,
    };
  }

  public toClientDTO(includeChildren: boolean = false): TaskTemplateClientDTO {
    const completedCount = this._instances.filter((i) => i.status === 'COMPLETED').length;
    const pendingCount = this._instances.filter((i) => i.status === 'PENDING').length;
    const totalCount = this._instances.length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      description: this._description,
      taskType: this._taskType,
      timeConfig: this._timeConfig.toClientDTO(),
      recurrenceRule: this._recurrenceRule?.toClientDTO() ?? null,
      reminderConfig: this._reminderConfig?.toClientDTO() ?? null,
      importance: this._importance,
      urgency: this._urgency,
      goalBinding: this._goalBinding?.toClientDTO() ?? null,
      folderUuid: this._folderUuid,
      tags: [...this._tags],
      color: this._color,
      status: this._status,
      lastGeneratedDate: this._lastGeneratedDate,
      generateAheadDays: this._generateAheadDays,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
      history: includeChildren ? this._history.map((h) => h.toClientDTO()) : undefined,
      instances: includeChildren ? this._instances.map((i) => i.toClientDTO()) : undefined,
      displayTitle: this._title,
      taskTypeText: this.getTaskTypeText(),
      timeDisplayText: this._timeConfig.toClientDTO().displayText,
      recurrenceText: this._recurrenceRule?.toClientDTO().recurrenceDisplayText ?? null,
      importanceText: this.getImportanceText(),
      urgencyText: this.getUrgencyText(),
      statusText: this.getStatusText(),
      hasReminder: this.hasReminder(),
      reminderText: this._reminderConfig?.toClientDTO().reminderSummary ?? null,
      isLinkedToGoal: this.isLinkedToGoal(),
      goalLinkText: this._goalBinding?.toClientDTO().displayText ?? null,
      instanceCount: totalCount,
      completedInstanceCount: completedCount,
      pendingInstanceCount: pendingCount,
      completionRate,
      formattedCreatedAt: new Date(this._createdAt).toLocaleString('zh-CN'),
      formattedUpdatedAt: new Date(this._updatedAt).toLocaleString('zh-CN'),
    };
  }

  public toPersistenceDTO(): TaskTemplatePersistenceDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      description: this._description,
      taskType: this._taskType,

      // Flattened time_config
      timeConfigType: this._timeConfig.timeType as 'POINT' | 'RANGE' | 'ALL_DAY',
      timeConfigStartTime: this._timeConfig.startDate,
      timeConfigEndTime: this._timeConfig.endDate,
      timeConfigDurationMinutes:
        this._timeConfig.timeRange &&
        this._timeConfig.timeRange.end &&
        this._timeConfig.timeRange.start
          ? (this._timeConfig.timeRange.end - this._timeConfig.timeRange.start) / 60000
          : undefined,

      // Flattened recurrence_rule
      recurrenceRuleType: this._recurrenceRule?.frequency,
      recurrenceRuleInterval: this._recurrenceRule?.interval,
      recurrenceRuleDaysOfWeek: this._recurrenceRule?.daysOfWeek
        ? JSON.stringify(this._recurrenceRule.daysOfWeek)
        : undefined,
      recurrenceRuleDayOfMonth: undefined, // Not implemented in VO
      recurrenceRuleMonthOfYear: undefined, // Not implemented in VO
      recurrenceRuleEndDate: this._recurrenceRule?.endDate,
      recurrenceRuleCount: this._recurrenceRule?.occurrences,

      // Flattened reminder_config
      reminderConfigEnabled: this._reminderConfig?.enabled,
      reminderConfigTimeOffsetMinutes: this._reminderConfig?.triggers[0]?.relativeValue,
      reminderConfigUnit: this._reminderConfig?.triggers[0]?.relativeUnit,
      reminderConfigChannel: this._reminderConfig ? 'PUSH' : undefined,

      importance: this._importance,
      urgency: this._urgency,

      // Flattened goal_binding
      goalBindingGoalUuid: this._goalBinding?.goalUuid,
      goalBindingKeyResultUuid: this._goalBinding?.keyResultUuid,
      goalBindingIncrementValue: this._goalBinding?.incrementValue,

      folderUuid: this._folderUuid,
      tags: JSON.stringify(this._tags),
      color: this._color,
      status: this._status,
      lastGeneratedDate: this._lastGeneratedDate,
      generateAheadDays: this._generateAheadDays,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的任务模板
   */
  public static create(params: {
    accountUuid: string;
    title: string;
    description?: string;
    taskType: TaskType;
    timeConfig: TaskTimeConfig;
    recurrenceRule?: RecurrenceRule;
    reminderConfig?: TaskReminderConfig;
    importance?: ImportanceLevel;
    urgency?: UrgencyLevel;
    folderUuid?: string;
    tags?: string[];
    color?: string;
    generateAheadDays?: number;
  }): TaskTemplate {
    const now = Date.now();
    const template = new TaskTemplate({
      accountUuid: params.accountUuid,
      title: params.title,
      description: params.description,
      taskType: params.taskType,
      timeConfig: params.timeConfig,
      recurrenceRule: params.recurrenceRule,
      reminderConfig: params.reminderConfig,
      importance: params.importance ?? ImportanceLevel.Moderate,
      urgency: params.urgency ?? UrgencyLevel.Medium,
      goalBinding: null, // Initialize as null
      folderUuid: params.folderUuid,
      tags: params.tags ?? [],
      color: params.color,
      status: 'ACTIVE' as TaskTemplateStatus,
      createdAt: now,
      updatedAt: now,
      generateAheadDays: params.generateAheadDays ?? 30, // Default value
    });

    template.addHistory('created');
    return template;
  }

  /**
   * 从 ServerDTO 恢复
   */
  public static fromServerDTO(dto: TaskTemplateServerDTO): TaskTemplate {
    const template = new TaskTemplate(
      {
        accountUuid: dto.accountUuid,
        title: dto.title,
        description: dto.description,
        taskType: dto.taskType,
        timeConfig: TaskTimeConfig.fromServerDTO(dto.timeConfig),
        recurrenceRule: dto.recurrenceRule
          ? RecurrenceRule.fromServerDTO(dto.recurrenceRule)
          : null,
        reminderConfig: dto.reminderConfig
          ? TaskReminderConfig.fromServerDTO(dto.reminderConfig)
          : null,
        importance: dto.importance,
        urgency: dto.urgency,
        goalBinding: dto.goalBinding ? TaskGoalBinding.fromServerDTO(dto.goalBinding) : null,
        folderUuid: dto.folderUuid,
        tags: dto.tags,
        color: dto.color,
        status: dto.status,
        lastGeneratedDate: dto.lastGeneratedDate,
        generateAheadDays: dto.generateAheadDays,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
        deletedAt: dto.deletedAt,
      },
      dto.uuid,
    );

    // 恢复历史记录
    if (dto.history) {
      template._history = dto.history.map((h) => TaskTemplateHistory.fromServerDTO(h));
    }

    // 恢复实例
    if (dto.instances) {
      template._instances = dto.instances.map((i) => TaskInstance.fromServerDTO(i));
    }

    return template;
  }

  /**
   * 从 PersistenceDTO 恢复
   */
  public static fromPersistenceDTO(dto: TaskTemplatePersistenceDTO): TaskTemplate {
    const timeConfig = new TaskTimeConfig({
      timeType: dto.timeConfigType as TaskContracts.TimeType,
      startDate: dto.timeConfigStartTime,
      endDate: dto.timeConfigEndTime,
    });

    let recurrenceRule = null;
    if (dto.recurrenceRuleType) {
      recurrenceRule = new RecurrenceRule({
        frequency: dto.recurrenceRuleType as TaskContracts.RecurrenceFrequency,
        interval: dto.recurrenceRuleInterval ?? 1,
        daysOfWeek: dto.recurrenceRuleDaysOfWeek ? JSON.parse(dto.recurrenceRuleDaysOfWeek) : [],
        endDate: dto.recurrenceRuleEndDate,
        occurrences: dto.recurrenceRuleCount,
      });
    }

    let reminderConfig = null;
    if (dto.reminderConfigEnabled) {
      const triggers = [
        {
          type: 'RELATIVE',
          relativeValue: dto.reminderConfigTimeOffsetMinutes,
          relativeUnit: dto.reminderConfigUnit,
        },
      ];
      reminderConfig = new TaskReminderConfig({
        enabled: dto.reminderConfigEnabled,
        triggers: triggers as any, // Cast to any to avoid type issues
      });
    }

    let goalBinding = null;
    if (dto.goalBindingGoalUuid) {
      goalBinding = new TaskGoalBinding({
        goalUuid: dto.goalBindingGoalUuid,
        keyResultUuid: dto.goalBindingKeyResultUuid ?? '',
        incrementValue: dto.goalBindingIncrementValue ?? 0,
      });
    }

    const tags = dto.tags ? JSON.parse(dto.tags) : [];

    const props: TaskTemplateProps = {
      accountUuid: dto.accountUuid,
      title: dto.title,
      description: dto.description,
      taskType: dto.taskType as TaskType,
      timeConfig,
      recurrenceRule,
      reminderConfig,
      importance: dto.importance as ImportanceLevel,
      urgency: dto.urgency as UrgencyLevel,
      goalBinding,
      folderUuid: dto.folderUuid,
      tags,
      color: dto.color,
      status: dto.status as TaskTemplateStatus,
      lastGeneratedDate: dto.lastGeneratedDate,
      generateAheadDays: dto.generateAheadDays,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    };
    return new TaskTemplate(props, dto.uuid);
  }

  // ===== 辅助方法 =====

  private getTaskTypeText(): string {
    const map: Record<TaskType, string> = {
      ONE_TIME: '单次任务',
      RECURRING: '重复任务',
    };
    return map[this._taskType];
  }

  private getImportanceText(): string {
    const map: Record<ImportanceLevel, string> = {
      [ImportanceLevel.Vital]: '极其重要',
      [ImportanceLevel.Important]: '非常重要',
      [ImportanceLevel.Moderate]: '中等重要',
      [ImportanceLevel.Minor]: '不太重要',
      [ImportanceLevel.Trivial]: '无关紧要',
    };
    return map[this._importance];
  }

  private getUrgencyText(): string {
    const map: Record<UrgencyLevel, string> = {
      [UrgencyLevel.Critical]: '非常紧急',
      [UrgencyLevel.High]: '高度紧急',
      [UrgencyLevel.Medium]: '中等紧急',
      [UrgencyLevel.Low]: '低度紧急',
      [UrgencyLevel.None]: '无期限',
    };
    return map[this._urgency];
  }

  private getStatusText(): string {
    const map: Record<TaskTemplateStatus, string> = {
      ACTIVE: '活跃',
      PAUSED: '暂停',
      ARCHIVED: '归档',
      DELETED: '已删除',
    };
    return map[this._status];
  }
}

interface TaskTemplateProps {
  accountUuid: string;
  title: string;
  description?: string | null;
  taskType: TaskType;
  timeConfig: TaskTimeConfig;
  recurrenceRule?: RecurrenceRule | null;
  reminderConfig?: TaskReminderConfig | null;
  importance: ImportanceLevel;
  urgency: UrgencyLevel;
  goalBinding?: TaskGoalBinding | null;
  folderUuid?: string | null;
  tags: string[];
  color?: string | null;
  status: TaskTemplateStatus;
  lastGeneratedDate?: number | null;
  generateAheadDays: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}
