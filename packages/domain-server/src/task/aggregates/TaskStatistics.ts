/**
 * TaskStatistics 聚合根实现 (Server)
 */

import { AggregateRoot } from '@dailyuse/utils';
import { TaskContracts } from '@dailyuse/contracts';

type ITaskStatisticsServer = TaskContracts.TaskStatisticsServer;
type TaskStatisticsServerDTO = TaskContracts.TaskStatisticsServerDTO;
type TaskStatisticsPersistenceDTO = TaskContracts.TaskStatisticsPersistenceDTO;
type TemplateStatsInfo = TaskContracts.TemplateStatsInfo;
type InstanceStatsInfo = TaskContracts.InstanceStatsInfo;
type CompletionStatsInfo = TaskContracts.CompletionStatsInfo;
type TimeStatsInfo = TaskContracts.TimeStatsInfo;
type DistributionStatsInfo = TaskContracts.DistributionStatsInfo;

/**
 * TaskStatistics 聚合根 (Server)
 */
export class TaskStatistics extends AggregateRoot implements ITaskStatisticsServer {
  private _accountUuid: string;
  private _templateStats: TemplateStatsInfo;
  private _instanceStats: InstanceStatsInfo;
  private _completionStats: CompletionStatsInfo;
  private _timeStats: TimeStatsInfo;
  private _distributionStats: DistributionStatsInfo;
  private _calculatedAt: number;

  private constructor(
    uuid: string,
    accountUuid: string,
    templateStats: TemplateStatsInfo,
    instanceStats: InstanceStatsInfo,
    completionStats: CompletionStatsInfo,
    timeStats: TimeStatsInfo,
    distributionStats: DistributionStatsInfo,
    calculatedAt: number,
  ) {
    super(uuid);
    this._accountUuid = accountUuid;
    this._templateStats = templateStats;
    this._instanceStats = instanceStats;
    this._completionStats = completionStats;
    this._timeStats = timeStats;
    this._distributionStats = distributionStats;
    this._calculatedAt = calculatedAt;
  }

  // ========== Getters ==========

  get accountUuid(): string {
    return this._accountUuid;
  }

  get templateStats(): TemplateStatsInfo {
    return { ...this._templateStats };
  }

  get instanceStats(): InstanceStatsInfo {
    return { ...this._instanceStats };
  }

  get completionStats(): CompletionStatsInfo {
    return { ...this._completionStats };
  }

  get timeStats(): TimeStatsInfo {
    return { ...this._timeStats };
  }

  get distributionStats(): DistributionStatsInfo {
    return {
      tasksByImportance: { ...this._distributionStats.tasksByImportance },
      tasksByUrgency: { ...this._distributionStats.tasksByUrgency },
      tasksByFolder: { ...this._distributionStats.tasksByFolder },
      tasksByTag: { ...this._distributionStats.tasksByTag },
    };
  }

  get calculatedAt(): number {
    return this._calculatedAt;
  }

  // ========== 业务方法 ==========

  /**
   * 重新计算统计信息
   */
  recalculate(templates: any[], instances: any[]): void {
    // 计算模板统计
    this._templateStats = this.calculateTemplateStats(templates);

    // 计算实例统计
    this._instanceStats = this.calculateInstanceStats(instances);

    // 计算完成统计
    this._completionStats = this.calculateCompletionStats(instances);

    // 计算时间统计
    this._timeStats = this.calculateTimeStats(templates, instances);

    // 计算分布统计
    this._distributionStats = this.calculateDistributionStats(templates);

    this._calculatedAt = Date.now();
  }

  /**
   * 更新模板统计
   */
  updateTemplateStats(templateStats: Partial<TemplateStatsInfo>): void {
    this._templateStats = { ...this._templateStats, ...templateStats };
    this._calculatedAt = Date.now();
  }

  /**
   * 更新实例统计
   */
  updateInstanceStats(instanceStats: Partial<InstanceStatsInfo>): void {
    this._instanceStats = { ...this._instanceStats, ...instanceStats };
    this._calculatedAt = Date.now();
  }

  /**
   * 更新完成统计
   */
  updateCompletionStats(completionStats: Partial<CompletionStatsInfo>): void {
    this._completionStats = { ...this._completionStats, ...completionStats };
    this._calculatedAt = Date.now();
  }

  /**
   * 获取今日完成率
   */
  getTodayCompletionRate(): number {
    const today = this._instanceStats.todayInstances;
    const completed = this._completionStats.todayCompleted;
    if (today === 0) return 0;
    return Math.round((completed / today) * 100);
  }

  /**
   * 获取本周完成率
   */
  getWeekCompletionRate(): number {
    const week = this._instanceStats.weekInstances;
    const completed = this._completionStats.weekCompleted;
    if (week === 0) return 0;
    return Math.round((completed / week) * 100);
  }

  /**
   * 获取效率趋势
   */
  getEfficiencyTrend(): 'UP' | 'DOWN' | 'STABLE' {
    const todayRate = this.getTodayCompletionRate();
    const weekRate = this.getWeekCompletionRate();

    if (todayRate > weekRate + 10) {
      return 'UP';
    } else if (todayRate < weekRate - 10) {
      return 'DOWN';
    }
    return 'STABLE';
  }

  // ========== DTO 转换 ==========

  toServerDTO(): TaskStatisticsServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      templateStats: this._templateStats,
      instanceStats: this._instanceStats,
      completionStats: this._completionStats,
      timeStats: this._timeStats,
      distributionStats: this._distributionStats,
      calculatedAt: this._calculatedAt,
    };
  }

  toPersistenceDTO(): TaskStatisticsPersistenceDTO {
    return {
      uuid: this.uuid,
      account_uuid: this._accountUuid,
      template_stats: JSON.stringify(this._templateStats),
      instance_stats: JSON.stringify(this._instanceStats),
      completion_stats: JSON.stringify(this._completionStats),
      time_stats: JSON.stringify(this._timeStats),
      distribution_stats: JSON.stringify(this._distributionStats),
      calculated_at: this._calculatedAt,
    };
  }

  // ========== 静态工厂方法 ==========

  /**
   * 创建默认统计实例
   */
  static createDefault(accountUuid: string): TaskStatistics {
    return new TaskStatistics(
      AggregateRoot.generateUUID(),
      accountUuid,
      {
        totalTemplates: 0,
        activeTemplates: 0,
        pausedTemplates: 0,
        archivedTemplates: 0,
        oneTimeTemplates: 0,
        recurringTemplates: 0,
      },
      {
        totalInstances: 0,
        todayInstances: 0,
        weekInstances: 0,
        monthInstances: 0,
        pendingInstances: 0,
        inProgressInstances: 0,
        completedInstances: 0,
        skippedInstances: 0,
        expiredInstances: 0,
      },
      {
        todayCompleted: 0,
        weekCompleted: 0,
        monthCompleted: 0,
        totalCompleted: 0,
        averageCompletionTime: null,
        completionRate: 0,
      },
      {
        allDayTasks: 0,
        timePointTasks: 0,
        timeRangeTasks: 0,
        overdueInstances: 0,
        upcomingInstances: 0,
      },
      {
        tasksByImportance: {},
        tasksByUrgency: {},
        tasksByFolder: {},
        tasksByTag: {},
      },
      Date.now(),
    );
  }

  /**
   * 从 Server DTO 创建实体
   */
  static fromServerDTO(dto: TaskStatisticsServerDTO): TaskStatistics {
    return new TaskStatistics(
      dto.uuid,
      dto.accountUuid,
      dto.templateStats,
      dto.instanceStats,
      dto.completionStats,
      dto.timeStats,
      dto.distributionStats,
      dto.calculatedAt,
    );
  }

  /**
   * 从 Persistence DTO 创建实体
   */
  static fromPersistenceDTO(dto: TaskStatisticsPersistenceDTO): TaskStatistics {
    return new TaskStatistics(
      dto.uuid,
      dto.account_uuid,
      JSON.parse(dto.template_stats),
      JSON.parse(dto.instance_stats),
      JSON.parse(dto.completion_stats),
      JSON.parse(dto.time_stats),
      JSON.parse(dto.distribution_stats),
      dto.calculated_at,
    );
  }

  // ========== 私有辅助方法 ==========

  private calculateTemplateStats(templates: any[]): TemplateStatsInfo {
    // 这里应该根据实际的 templates 数组计算统计信息
    // 作为示例，返回默认值
    return {
      totalTemplates: templates.length,
      activeTemplates: 0,
      pausedTemplates: 0,
      archivedTemplates: 0,
      oneTimeTemplates: 0,
      recurringTemplates: 0,
    };
  }

  private calculateInstanceStats(instances: any[]): InstanceStatsInfo {
    return {
      totalInstances: instances.length,
      todayInstances: 0,
      weekInstances: 0,
      monthInstances: 0,
      pendingInstances: 0,
      inProgressInstances: 0,
      completedInstances: 0,
      skippedInstances: 0,
      expiredInstances: 0,
    };
  }

  private calculateCompletionStats(instances: any[]): CompletionStatsInfo {
    return {
      todayCompleted: 0,
      weekCompleted: 0,
      monthCompleted: 0,
      totalCompleted: 0,
      averageCompletionTime: null,
      completionRate: 0,
    };
  }

  private calculateTimeStats(templates: any[], instances: any[]): TimeStatsInfo {
    return {
      allDayTasks: 0,
      timePointTasks: 0,
      timeRangeTasks: 0,
      overdueInstances: 0,
      upcomingInstances: 0,
    };
  }

  private calculateDistributionStats(templates: any[]): DistributionStatsInfo {
    return {
      tasksByImportance: {},
      tasksByUrgency: {},
      tasksByFolder: {},
      tasksByTag: {},
    };
  }
}
