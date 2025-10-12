import { AggregateRoot } from '@dailyuse/utils';
import { ScheduleContracts, SourceModule, ExecutionStatus } from '@dailyuse/contracts';

type ScheduleStatisticsServerDTO = ScheduleContracts.ScheduleStatisticsServerDTO;
type ScheduleStatisticsPersistenceDTO = ScheduleContracts.ScheduleStatisticsPersistenceDTO;

/**
 * ScheduleStatistics 聚合根
 *
 * 职责:
 * - 账户级别的调度统计管理
 * - 任务统计 (总数/活跃/暂停/完成/失败)
 * - 执行统计 (总数/成功/失败/超时/跳过)
 * - 模块级别统计 (reminder/task/goal/notification)
 * - 响应调度事件，实时更新统计
 *
 * @domain-server/schedule
 */
export class ScheduleStatistics extends AggregateRoot {
  // ============ 私有字段 ============
  private _accountUuid: string;

  // 任务统计
  private _totalTasks: number;
  private _activeTasks: number;
  private _pausedTasks: number;
  private _completedTasks: number;
  private _failedTasks: number;

  // 执行统计
  private _totalExecutions: number;
  private _successfulExecutions: number;
  private _failedExecutions: number;
  private _timeoutExecutions: number;
  private _skippedExecutions: number;

  // 模块级别统计 - Reminder
  private _reminderTotalTasks: number;
  private _reminderActiveTasks: number;
  private _reminderExecutions: number;
  private _reminderSuccessfulExecutions: number;
  private _reminderFailedExecutions: number;

  // 模块级别统计 - Task
  private _taskTotalTasks: number;
  private _taskActiveTasks: number;
  private _taskExecutions: number;
  private _taskSuccessfulExecutions: number;
  private _taskFailedExecutions: number;

  // 模块级别统计 - Goal
  private _goalTotalTasks: number;
  private _goalActiveTasks: number;
  private _goalExecutions: number;
  private _goalSuccessfulExecutions: number;
  private _goalFailedExecutions: number;

  // 模块级别统计 - Notification
  private _notificationTotalTasks: number;
  private _notificationActiveTasks: number;
  private _notificationExecutions: number;
  private _notificationSuccessfulExecutions: number;
  private _notificationFailedExecutions: number;

  // 时间戳
  private _lastUpdatedAt: number;
  private _createdAt: number;

  // ============ 私有构造函数 ============
  private constructor(params: {
    accountUuid: string;
    totalTasks: number;
    activeTasks: number;
    pausedTasks: number;
    completedTasks: number;
    failedTasks: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    timeoutExecutions: number;
    skippedExecutions: number;
    reminderTotalTasks: number;
    reminderActiveTasks: number;
    reminderExecutions: number;
    reminderSuccessfulExecutions: number;
    reminderFailedExecutions: number;
    taskTotalTasks: number;
    taskActiveTasks: number;
    taskExecutions: number;
    taskSuccessfulExecutions: number;
    taskFailedExecutions: number;
    goalTotalTasks: number;
    goalActiveTasks: number;
    goalExecutions: number;
    goalSuccessfulExecutions: number;
    goalFailedExecutions: number;
    notificationTotalTasks: number;
    notificationActiveTasks: number;
    notificationExecutions: number;
    notificationSuccessfulExecutions: number;
    notificationFailedExecutions: number;
    lastUpdatedAt: number;
    createdAt: number;
  }) {
    // ScheduleStatistics 使用 accountUuid 作为唯一标识
    super(params.accountUuid);

    this._accountUuid = params.accountUuid;
    this._totalTasks = params.totalTasks;
    this._activeTasks = params.activeTasks;
    this._pausedTasks = params.pausedTasks;
    this._completedTasks = params.completedTasks;
    this._failedTasks = params.failedTasks;
    this._totalExecutions = params.totalExecutions;
    this._successfulExecutions = params.successfulExecutions;
    this._failedExecutions = params.failedExecutions;
    this._timeoutExecutions = params.timeoutExecutions;
    this._skippedExecutions = params.skippedExecutions;

    this._reminderTotalTasks = params.reminderTotalTasks;
    this._reminderActiveTasks = params.reminderActiveTasks;
    this._reminderExecutions = params.reminderExecutions;
    this._reminderSuccessfulExecutions = params.reminderSuccessfulExecutions;
    this._reminderFailedExecutions = params.reminderFailedExecutions;

    this._taskTotalTasks = params.taskTotalTasks;
    this._taskActiveTasks = params.taskActiveTasks;
    this._taskExecutions = params.taskExecutions;
    this._taskSuccessfulExecutions = params.taskSuccessfulExecutions;
    this._taskFailedExecutions = params.taskFailedExecutions;

    this._goalTotalTasks = params.goalTotalTasks;
    this._goalActiveTasks = params.goalActiveTasks;
    this._goalExecutions = params.goalExecutions;
    this._goalSuccessfulExecutions = params.goalSuccessfulExecutions;
    this._goalFailedExecutions = params.goalFailedExecutions;

    this._notificationTotalTasks = params.notificationTotalTasks;
    this._notificationActiveTasks = params.notificationActiveTasks;
    this._notificationExecutions = params.notificationExecutions;
    this._notificationSuccessfulExecutions = params.notificationSuccessfulExecutions;
    this._notificationFailedExecutions = params.notificationFailedExecutions;

    this._lastUpdatedAt = params.lastUpdatedAt;
    this._createdAt = params.createdAt;
  }

  // ============ 公共 Getters ============
  public get accountUuid(): string {
    return this._accountUuid;
  }

  public get totalTasks(): number {
    return this._totalTasks;
  }

  public get activeTasks(): number {
    return this._activeTasks;
  }

  public get pausedTasks(): number {
    return this._pausedTasks;
  }

  public get completedTasks(): number {
    return this._completedTasks;
  }

  public get failedTasks(): number {
    return this._failedTasks;
  }

  public get totalExecutions(): number {
    return this._totalExecutions;
  }

  public get successfulExecutions(): number {
    return this._successfulExecutions;
  }

  public get failedExecutions(): number {
    return this._failedExecutions;
  }

  public get timeoutExecutions(): number {
    return this._timeoutExecutions;
  }

  public get skippedExecutions(): number {
    return this._skippedExecutions;
  }

  public get lastUpdatedAt(): number {
    return this._lastUpdatedAt;
  }

  public get createdAt(): number {
    return this._createdAt;
  }

  public get successRate(): number {
    if (this._totalExecutions === 0) return 0;
    return (this._successfulExecutions / this._totalExecutions) * 100;
  }

  public get failureRate(): number {
    if (this._totalExecutions === 0) return 0;
    return (this._failedExecutions / this._totalExecutions) * 100;
  }

  // ============ 任务统计方法 ============

  /**
   * 增加任务数 (新建任务时)
   */
  public incrementTaskCount(module: SourceModule): void {
    this._totalTasks++;
    this._activeTasks++;
    this._incrementModuleTaskCount(module);
    this._lastUpdatedAt = Date.now();

    // 发布事件
    this.addDomainEvent({
      eventType: 'ScheduleStatisticsTaskCountIncremented',
      aggregateId: this._accountUuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        module,
        totalTasks: this._totalTasks,
        activeTasks: this._activeTasks,
      },
    });
  }

  /**
   * 减少任务数 (删除任务时)
   */
  public decrementTaskCount(module: SourceModule, wasActive: boolean): void {
    this._totalTasks = Math.max(0, this._totalTasks - 1);
    if (wasActive) {
      this._activeTasks = Math.max(0, this._activeTasks - 1);
    }
    this._decrementModuleTaskCount(module, wasActive);
    this._lastUpdatedAt = Date.now();

    // 发布事件
    this.addDomainEvent({
      eventType: 'ScheduleStatisticsTaskCountDecremented',
      aggregateId: this._accountUuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        module,
        totalTasks: this._totalTasks,
        activeTasks: this._activeTasks,
      },
    });
  }

  /**
   * 暂停任务时更新统计
   */
  public incrementPausedTasks(module: SourceModule): void {
    this._activeTasks = Math.max(0, this._activeTasks - 1);
    this._pausedTasks++;
    this._decrementModuleActiveTaskCount(module);
    this._lastUpdatedAt = Date.now();
  }

  /**
   * 恢复任务时更新统计
   */
  public decrementPausedTasks(module: SourceModule): void {
    this._pausedTasks = Math.max(0, this._pausedTasks - 1);
    this._activeTasks++;
    this._incrementModuleActiveTaskCount(module);
    this._lastUpdatedAt = Date.now();
  }

  /**
   * 完成任务时更新统计
   */
  public incrementCompletedTasks(module: SourceModule, wasActive: boolean): void {
    if (wasActive) {
      this._activeTasks = Math.max(0, this._activeTasks - 1);
      this._decrementModuleActiveTaskCount(module);
    }
    this._completedTasks++;
    this._lastUpdatedAt = Date.now();
  }

  /**
   * 任务失败时更新统计
   */
  public incrementFailedTasks(module: SourceModule, wasActive: boolean): void {
    if (wasActive) {
      this._activeTasks = Math.max(0, this._activeTasks - 1);
      this._decrementModuleActiveTaskCount(module);
    }
    this._failedTasks++;
    this._lastUpdatedAt = Date.now();
  }

  // ============ 执行统计方法 ============

  /**
   * 记录执行结果
   */
  public recordExecution(module: SourceModule, status: ExecutionStatus): void {
    this._totalExecutions++;

    switch (status) {
      case 'success':
        this._successfulExecutions++;
        break;
      case 'failed':
        this._failedExecutions++;
        break;
      case 'timeout':
        this._timeoutExecutions++;
        break;
      case 'skipped':
        this._skippedExecutions++;
        break;
    }

    this._recordModuleExecution(module, status);
    this._lastUpdatedAt = Date.now();

    // 发布事件
    this.addDomainEvent({
      eventType: 'ScheduleStatisticsExecutionRecorded',
      aggregateId: this._accountUuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        module,
        status,
        totalExecutions: this._totalExecutions,
        successfulExecutions: this._successfulExecutions,
        failedExecutions: this._failedExecutions,
      },
    });
  }

  /**
   * 重置所有统计
   */
  public resetAllStats(): void {
    this._totalTasks = 0;
    this._activeTasks = 0;
    this._pausedTasks = 0;
    this._completedTasks = 0;
    this._failedTasks = 0;
    this._totalExecutions = 0;
    this._successfulExecutions = 0;
    this._failedExecutions = 0;
    this._timeoutExecutions = 0;
    this._skippedExecutions = 0;

    this._reminderTotalTasks = 0;
    this._reminderActiveTasks = 0;
    this._reminderExecutions = 0;
    this._reminderSuccessfulExecutions = 0;
    this._reminderFailedExecutions = 0;

    this._taskTotalTasks = 0;
    this._taskActiveTasks = 0;
    this._taskExecutions = 0;
    this._taskSuccessfulExecutions = 0;
    this._taskFailedExecutions = 0;

    this._goalTotalTasks = 0;
    this._goalActiveTasks = 0;
    this._goalExecutions = 0;
    this._goalSuccessfulExecutions = 0;
    this._goalFailedExecutions = 0;

    this._notificationTotalTasks = 0;
    this._notificationActiveTasks = 0;
    this._notificationExecutions = 0;
    this._notificationSuccessfulExecutions = 0;
    this._notificationFailedExecutions = 0;

    this._lastUpdatedAt = Date.now();

    // 发布事件
    this.addDomainEvent({
      eventType: 'ScheduleStatisticsReset',
      aggregateId: this._accountUuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {},
    });
  }

  // ============ 模块级别统计查询 ============

  /**
   * 获取模块统计
   */
  public getModuleStats(module: SourceModule): {
    totalTasks: number;
    activeTasks: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
  } {
    let totalTasks = 0;
    let activeTasks = 0;
    let totalExecutions = 0;
    let successfulExecutions = 0;
    let failedExecutions = 0;

    switch (module) {
      case 'reminder':
        totalTasks = this._reminderTotalTasks;
        activeTasks = this._reminderActiveTasks;
        totalExecutions = this._reminderExecutions;
        successfulExecutions = this._reminderSuccessfulExecutions;
        failedExecutions = this._reminderFailedExecutions;
        break;
      case 'task':
        totalTasks = this._taskTotalTasks;
        activeTasks = this._taskActiveTasks;
        totalExecutions = this._taskExecutions;
        successfulExecutions = this._taskSuccessfulExecutions;
        failedExecutions = this._taskFailedExecutions;
        break;
      case 'goal':
        totalTasks = this._goalTotalTasks;
        activeTasks = this._goalActiveTasks;
        totalExecutions = this._goalExecutions;
        successfulExecutions = this._goalSuccessfulExecutions;
        failedExecutions = this._goalFailedExecutions;
        break;
      case 'notification':
        totalTasks = this._notificationTotalTasks;
        activeTasks = this._notificationActiveTasks;
        totalExecutions = this._notificationExecutions;
        successfulExecutions = this._notificationSuccessfulExecutions;
        failedExecutions = this._notificationFailedExecutions;
        break;
    }

    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

    return {
      totalTasks,
      activeTasks,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      successRate,
    };
  }

  // ============ 私有辅助方法 ============

  private _incrementModuleTaskCount(module: SourceModule): void {
    switch (module) {
      case 'reminder':
        this._reminderTotalTasks++;
        this._reminderActiveTasks++;
        break;
      case 'task':
        this._taskTotalTasks++;
        this._taskActiveTasks++;
        break;
      case 'goal':
        this._goalTotalTasks++;
        this._goalActiveTasks++;
        break;
      case 'notification':
        this._notificationTotalTasks++;
        this._notificationActiveTasks++;
        break;
    }
  }

  private _decrementModuleTaskCount(module: SourceModule, wasActive: boolean): void {
    switch (module) {
      case 'reminder':
        this._reminderTotalTasks = Math.max(0, this._reminderTotalTasks - 1);
        if (wasActive) {
          this._reminderActiveTasks = Math.max(0, this._reminderActiveTasks - 1);
        }
        break;
      case 'task':
        this._taskTotalTasks = Math.max(0, this._taskTotalTasks - 1);
        if (wasActive) {
          this._taskActiveTasks = Math.max(0, this._taskActiveTasks - 1);
        }
        break;
      case 'goal':
        this._goalTotalTasks = Math.max(0, this._goalTotalTasks - 1);
        if (wasActive) {
          this._goalActiveTasks = Math.max(0, this._goalActiveTasks - 1);
        }
        break;
      case 'notification':
        this._notificationTotalTasks = Math.max(0, this._notificationTotalTasks - 1);
        if (wasActive) {
          this._notificationActiveTasks = Math.max(0, this._notificationActiveTasks - 1);
        }
        break;
    }
  }

  private _incrementModuleActiveTaskCount(module: SourceModule): void {
    switch (module) {
      case 'reminder':
        this._reminderActiveTasks++;
        break;
      case 'task':
        this._taskActiveTasks++;
        break;
      case 'goal':
        this._goalActiveTasks++;
        break;
      case 'notification':
        this._notificationActiveTasks++;
        break;
    }
  }

  private _decrementModuleActiveTaskCount(module: SourceModule): void {
    switch (module) {
      case 'reminder':
        this._reminderActiveTasks = Math.max(0, this._reminderActiveTasks - 1);
        break;
      case 'task':
        this._taskActiveTasks = Math.max(0, this._taskActiveTasks - 1);
        break;
      case 'goal':
        this._goalActiveTasks = Math.max(0, this._goalActiveTasks - 1);
        break;
      case 'notification':
        this._notificationActiveTasks = Math.max(0, this._notificationActiveTasks - 1);
        break;
    }
  }

  private _recordModuleExecution(module: SourceModule, status: ExecutionStatus): void {
    switch (module) {
      case 'reminder':
        this._reminderExecutions++;
        if (status === 'success') this._reminderSuccessfulExecutions++;
        if (status === 'failed') this._reminderFailedExecutions++;
        break;
      case 'task':
        this._taskExecutions++;
        if (status === 'success') this._taskSuccessfulExecutions++;
        if (status === 'failed') this._taskFailedExecutions++;
        break;
      case 'goal':
        this._goalExecutions++;
        if (status === 'success') this._goalSuccessfulExecutions++;
        if (status === 'failed') this._goalFailedExecutions++;
        break;
      case 'notification':
        this._notificationExecutions++;
        if (status === 'success') this._notificationSuccessfulExecutions++;
        if (status === 'failed') this._notificationFailedExecutions++;
        break;
    }
  }

  // ============ DTO 转换 ============

  /**
   * 转换为 DTO (用于跨层传输)
   */
  public toDTO(): ScheduleStatisticsServerDTO {
    // TODO: 完善实现 - 添加性能统计字段的实际计算逻辑
    return {
      accountUuid: this._accountUuid,
      totalTasks: this._totalTasks,
      activeTasks: this._activeTasks,
      pausedTasks: this._pausedTasks,
      completedTasks: this._completedTasks,
      cancelledTasks: 0, // TODO: 添加 cancelledTasks 字段到私有属性
      failedTasks: this._failedTasks,
      totalExecutions: this._totalExecutions,
      successfulExecutions: this._successfulExecutions,
      failedExecutions: this._failedExecutions,
      skippedExecutions: this._skippedExecutions,
      timeoutExecutions: this._timeoutExecutions,
      avgExecutionDuration: 0, // TODO: 添加执行时长追踪
      minExecutionDuration: 0, // TODO: 添加执行时长追踪
      maxExecutionDuration: 0, // TODO: 添加执行时长追踪
      moduleStatistics: {
        reminder: {
          moduleName: 'reminder',
          totalTasks: this._reminderTotalTasks,
          activeTasks: this._reminderActiveTasks,
          totalExecutions: this._reminderExecutions,
          successfulExecutions: this._reminderSuccessfulExecutions,
          failedExecutions: this._reminderFailedExecutions,
          avgDuration: 0, // TODO: 添加模块级别的执行时长追踪
        },
        task: {
          moduleName: 'task',
          totalTasks: this._taskTotalTasks,
          activeTasks: this._taskActiveTasks,
          totalExecutions: this._taskExecutions,
          successfulExecutions: this._taskSuccessfulExecutions,
          failedExecutions: this._taskFailedExecutions,
          avgDuration: 0,
        },
        goal: {
          moduleName: 'goal',
          totalTasks: this._goalTotalTasks,
          activeTasks: this._goalActiveTasks,
          totalExecutions: this._goalExecutions,
          successfulExecutions: this._goalSuccessfulExecutions,
          failedExecutions: this._goalFailedExecutions,
          avgDuration: 0,
        },
        notification: {
          moduleName: 'notification',
          totalTasks: this._notificationTotalTasks,
          activeTasks: this._notificationActiveTasks,
          totalExecutions: this._notificationExecutions,
          successfulExecutions: this._notificationSuccessfulExecutions,
          failedExecutions: this._notificationFailedExecutions,
          avgDuration: 0,
        },
      },
      lastUpdatedAt: this._lastUpdatedAt,
      createdAt: this._createdAt,
    };
  }

  /**
   * 转换为 Server DTO (用于 API 响应)
   */
  public toServerDTO(): ScheduleStatisticsServerDTO {
    // ServerDTO 和 DTO 结构相同
    return this.toDTO();
  }

  /**
   * 转换为持久化 DTO (用于数据库存储)
   */
  public toPersistenceDTO(): ScheduleStatisticsPersistenceDTO {
    // 将模块统计转换为 JSON string
    const moduleStatsObject = {
      reminder: {
        module_name: 'reminder',
        total_tasks: this._reminderTotalTasks,
        active_tasks: this._reminderActiveTasks,
        total_executions: this._reminderExecutions,
        successful_executions: this._reminderSuccessfulExecutions,
        failed_executions: this._reminderFailedExecutions,
        avg_duration: 0,
      },
      task: {
        module_name: 'task',
        total_tasks: this._taskTotalTasks,
        active_tasks: this._taskActiveTasks,
        total_executions: this._taskExecutions,
        successful_executions: this._taskSuccessfulExecutions,
        failed_executions: this._taskFailedExecutions,
        avg_duration: 0,
      },
      goal: {
        module_name: 'goal',
        total_tasks: this._goalTotalTasks,
        active_tasks: this._goalActiveTasks,
        total_executions: this._goalExecutions,
        successful_executions: this._goalSuccessfulExecutions,
        failed_executions: this._goalFailedExecutions,
        avg_duration: 0,
      },
      notification: {
        module_name: 'notification',
        total_tasks: this._notificationTotalTasks,
        active_tasks: this._notificationActiveTasks,
        total_executions: this._notificationExecutions,
        successful_executions: this._notificationSuccessfulExecutions,
        failed_executions: this._notificationFailedExecutions,
        avg_duration: 0,
      },
    };

    return {
      account_uuid: this._accountUuid,
      total_tasks: this._totalTasks,
      active_tasks: this._activeTasks,
      paused_tasks: this._pausedTasks,
      completed_tasks: this._completedTasks,
      cancelled_tasks: 0, // TODO: 添加字段
      failed_tasks: this._failedTasks,
      total_executions: this._totalExecutions,
      successful_executions: this._successfulExecutions,
      failed_executions: this._failedExecutions,
      skipped_executions: this._skippedExecutions,
      timeout_executions: this._timeoutExecutions,
      avg_execution_duration: 0, // TODO: 添加执行时长追踪
      min_execution_duration: 0,
      max_execution_duration: 0,
      module_statistics: JSON.stringify(moduleStatsObject),
      last_updated_at: this._lastUpdatedAt,
      created_at: this._createdAt,
    };
  }

  // ============ 静态工厂方法 ============

  /**
   * 创建新的统计实例 (新账户)
   */
  public static createEmpty(accountUuid: string): ScheduleStatistics {
    const now = Date.now();

    const statistics = new ScheduleStatistics({
      accountUuid,
      totalTasks: 0,
      activeTasks: 0,
      pausedTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      timeoutExecutions: 0,
      skippedExecutions: 0,
      reminderTotalTasks: 0,
      reminderActiveTasks: 0,
      reminderExecutions: 0,
      reminderSuccessfulExecutions: 0,
      reminderFailedExecutions: 0,
      taskTotalTasks: 0,
      taskActiveTasks: 0,
      taskExecutions: 0,
      taskSuccessfulExecutions: 0,
      taskFailedExecutions: 0,
      goalTotalTasks: 0,
      goalActiveTasks: 0,
      goalExecutions: 0,
      goalSuccessfulExecutions: 0,
      goalFailedExecutions: 0,
      notificationTotalTasks: 0,
      notificationActiveTasks: 0,
      notificationExecutions: 0,
      notificationSuccessfulExecutions: 0,
      notificationFailedExecutions: 0,
      lastUpdatedAt: now,
      createdAt: now,
    });

    // 发布创建事件
    statistics.addDomainEvent({
      eventType: 'ScheduleStatisticsCreated',
      aggregateId: accountUuid,
      occurredOn: new Date(),
      accountUuid,
      payload: {},
    });

    return statistics;
  }

  /**
   * 从 ServerDTO 创建 (用于跨层重建)
   * TODO: 完善实现以支持从 ServerDTO 重建聚合根
   */
  public static fromDTO(dto: ScheduleStatisticsServerDTO): ScheduleStatistics {
    // 从 moduleStatistics Record 提取模块级别数据
    const reminderStats = dto.moduleStatistics.reminder ?? {
      moduleName: 'reminder',
      totalTasks: 0,
      activeTasks: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      avgDuration: 0,
    };
    const taskStats = dto.moduleStatistics.task ?? {
      moduleName: 'task',
      totalTasks: 0,
      activeTasks: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      avgDuration: 0,
    };
    const goalStats = dto.moduleStatistics.goal ?? {
      moduleName: 'goal',
      totalTasks: 0,
      activeTasks: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      avgDuration: 0,
    };
    const notificationStats = dto.moduleStatistics.notification ?? {
      moduleName: 'notification',
      totalTasks: 0,
      activeTasks: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      avgDuration: 0,
    };

    return new ScheduleStatistics({
      accountUuid: dto.accountUuid,
      totalTasks: dto.totalTasks,
      activeTasks: dto.activeTasks,
      pausedTasks: dto.pausedTasks,
      completedTasks: dto.completedTasks,
      failedTasks: dto.failedTasks,
      totalExecutions: dto.totalExecutions,
      successfulExecutions: dto.successfulExecutions,
      failedExecutions: dto.failedExecutions,
      timeoutExecutions: dto.timeoutExecutions,
      skippedExecutions: dto.skippedExecutions,
      reminderTotalTasks: reminderStats.totalTasks,
      reminderActiveTasks: reminderStats.activeTasks,
      reminderExecutions: reminderStats.totalExecutions,
      reminderSuccessfulExecutions: reminderStats.successfulExecutions,
      reminderFailedExecutions: reminderStats.failedExecutions,
      taskTotalTasks: taskStats.totalTasks,
      taskActiveTasks: taskStats.activeTasks,
      taskExecutions: taskStats.totalExecutions,
      taskSuccessfulExecutions: taskStats.successfulExecutions,
      taskFailedExecutions: taskStats.failedExecutions,
      goalTotalTasks: goalStats.totalTasks,
      goalActiveTasks: goalStats.activeTasks,
      goalExecutions: goalStats.totalExecutions,
      goalSuccessfulExecutions: goalStats.successfulExecutions,
      goalFailedExecutions: goalStats.failedExecutions,
      notificationTotalTasks: notificationStats.totalTasks,
      notificationActiveTasks: notificationStats.activeTasks,
      notificationExecutions: notificationStats.totalExecutions,
      notificationSuccessfulExecutions: notificationStats.successfulExecutions,
      notificationFailedExecutions: notificationStats.failedExecutions,
      lastUpdatedAt: dto.lastUpdatedAt,
      createdAt: dto.createdAt,
    });
  }

  /**
   * 从持久化 DTO 创建 (用于数据库加载)
   * TODO: 完善实现以支持从 PersistenceDTO 重建聚合根
   */
  public static fromPersistenceDTO(dto: ScheduleStatisticsPersistenceDTO): ScheduleStatistics {
    // 从 module_statistics JSON string 解析模块级别数据
    const moduleStatsObject = JSON.parse(dto.module_statistics) as Record<
      string,
      {
        module_name: string;
        total_tasks: number;
        active_tasks: number;
        total_executions: number;
        successful_executions: number;
        failed_executions: number;
        avg_duration: number;
      }
    >;

    const reminderStats = moduleStatsObject.reminder ?? {
      total_tasks: 0,
      active_tasks: 0,
      total_executions: 0,
      successful_executions: 0,
      failed_executions: 0,
    };
    const taskStats = moduleStatsObject.task ?? {
      total_tasks: 0,
      active_tasks: 0,
      total_executions: 0,
      successful_executions: 0,
      failed_executions: 0,
    };
    const goalStats = moduleStatsObject.goal ?? {
      total_tasks: 0,
      active_tasks: 0,
      total_executions: 0,
      successful_executions: 0,
      failed_executions: 0,
    };
    const notificationStats = moduleStatsObject.notification ?? {
      total_tasks: 0,
      active_tasks: 0,
      total_executions: 0,
      successful_executions: 0,
      failed_executions: 0,
    };

    return new ScheduleStatistics({
      accountUuid: dto.account_uuid,
      totalTasks: dto.total_tasks,
      activeTasks: dto.active_tasks,
      pausedTasks: dto.paused_tasks,
      completedTasks: dto.completed_tasks,
      failedTasks: dto.failed_tasks,
      totalExecutions: dto.total_executions,
      successfulExecutions: dto.successful_executions,
      failedExecutions: dto.failed_executions,
      timeoutExecutions: dto.timeout_executions,
      skippedExecutions: dto.skipped_executions,
      reminderTotalTasks: reminderStats.total_tasks,
      reminderActiveTasks: reminderStats.active_tasks,
      reminderExecutions: reminderStats.total_executions,
      reminderSuccessfulExecutions: reminderStats.successful_executions,
      reminderFailedExecutions: reminderStats.failed_executions,
      taskTotalTasks: taskStats.total_tasks,
      taskActiveTasks: taskStats.active_tasks,
      taskExecutions: taskStats.total_executions,
      taskSuccessfulExecutions: taskStats.successful_executions,
      taskFailedExecutions: taskStats.failed_executions,
      goalTotalTasks: goalStats.total_tasks,
      goalActiveTasks: goalStats.active_tasks,
      goalExecutions: goalStats.total_executions,
      goalSuccessfulExecutions: goalStats.successful_executions,
      goalFailedExecutions: goalStats.failed_executions,
      notificationTotalTasks: notificationStats.total_tasks,
      notificationActiveTasks: notificationStats.active_tasks,
      notificationExecutions: notificationStats.total_executions,
      notificationSuccessfulExecutions: notificationStats.successful_executions,
      notificationFailedExecutions: notificationStats.failed_executions,
      lastUpdatedAt: dto.last_updated_at,
      createdAt: dto.created_at,
    });
  }
}
