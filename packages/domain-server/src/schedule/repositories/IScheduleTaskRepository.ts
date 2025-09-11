/**
 * Schedule Task Repository Interface
 * @description 调度任务仓储接口定义
 * @author DailyUse Team
 * @date 2025-01-09
 */

import type {
  ScheduleTaskResponseDto,
  ScheduleTaskListResponseDto,
  CreateScheduleTaskRequestDto,
  UpdateScheduleTaskRequestDto,
  IScheduleTaskQuery,
  IScheduleTaskStatistics,
  ScheduleExecutionResultResponseDto,
  ScheduleTaskLogResponseDto,
  UpcomingTasksResponseDto,
  ScheduleStatus,
  ScheduleTaskType,
  SchedulePriority,
} from '@dailyuse/contracts';

/**
 * 调度任务仓储接口
 */
export interface IScheduleTaskRepository {
  /**
   * 创建调度任务
   */
  create(
    request: CreateScheduleTaskRequestDto,
    createdBy: string,
  ): Promise<ScheduleTaskResponseDto>;

  /**
   * 根据UUID获取任务
   */
  findByUuid(uuid: string): Promise<ScheduleTaskResponseDto | null>;

  /**
   * 根据查询条件获取任务列表
   */
  findMany(query: IScheduleTaskQuery): Promise<ScheduleTaskListResponseDto>;

  /**
   * 更新任务
   */
  update(uuid: string, request: UpdateScheduleTaskRequestDto): Promise<ScheduleTaskResponseDto>;

  /**
   * 删除任务
   */
  delete(uuid: string): Promise<void>;

  /**
   * 批量删除任务
   */
  deleteBatch(uuids: string[]): Promise<void>;

  /**
   * 启用任务
   */
  enable(uuid: string): Promise<ScheduleTaskResponseDto>;

  /**
   * 禁用任务
   */
  disable(uuid: string): Promise<ScheduleTaskResponseDto>;

  /**
   * 暂停任务
   */
  pause(uuid: string): Promise<ScheduleTaskResponseDto>;

  /**
   * 恢复任务
   */
  resume(uuid: string): Promise<ScheduleTaskResponseDto>;

  /**
   * 更新任务状态
   */
  updateStatus(uuid: string, status: ScheduleStatus): Promise<ScheduleTaskResponseDto>;

  /**
   * 获取即将执行的任务
   */
  findUpcomingTasks(withinMinutes: number, limit?: number): Promise<UpcomingTasksResponseDto>;

  /**
   * 获取可执行的任务
   */
  findExecutableTasks(limit?: number): Promise<ScheduleTaskResponseDto[]>;

  /**
   * 获取超时的任务
   */
  findTimeoutTasks(): Promise<ScheduleTaskResponseDto[]>;

  /**
   * 获取失败需要重试的任务
   */
  findRetryTasks(): Promise<ScheduleTaskResponseDto[]>;

  /**
   * 根据用户获取任务
   */
  findByUser(
    userId: string,
    query?: Partial<IScheduleTaskQuery>,
  ): Promise<ScheduleTaskListResponseDto>;

  /**
   * 根据任务类型获取任务
   */
  findByTaskType(
    taskType: ScheduleTaskType,
    query?: Partial<IScheduleTaskQuery>,
  ): Promise<ScheduleTaskListResponseDto>;

  /**
   * 根据状态获取任务
   */
  findByStatus(
    status: ScheduleStatus[],
    query?: Partial<IScheduleTaskQuery>,
  ): Promise<ScheduleTaskListResponseDto>;

  /**
   * 根据标签获取任务
   */
  findByTags(
    tags: string[],
    query?: Partial<IScheduleTaskQuery>,
  ): Promise<ScheduleTaskListResponseDto>;

  /**
   * 增加执行次数
   */
  incrementExecutionCount(uuid: string): Promise<void>;

  /**
   * 增加重试次数
   */
  incrementRetryCount(uuid: string): Promise<void>;

  /**
   * 更新下次执行时间
   */
  updateNextExecutionTime(uuid: string, nextTime: Date | null): Promise<void>;

  /**
   * 记录执行结果
   */
  recordExecutionResult(result: ScheduleExecutionResultResponseDto): Promise<void>;

  /**
   * 获取执行历史
   */
  findExecutionHistory(
    taskUuid: string,
    pagination?: { offset: number; limit: number },
  ): Promise<{
    logs: ScheduleTaskLogResponseDto[];
    total: number;
  }>;

  /**
   * 获取任务统计
   */
  getStatistics(userId?: string): Promise<IScheduleTaskStatistics>;

  /**
   * 清理过期任务
   */
  cleanupExpiredTasks(beforeDate: Date): Promise<number>;

  /**
   * 清理执行日志
   */
  cleanupExecutionLogs(beforeDate: Date, keepCount?: number): Promise<number>;

  /**
   * 检查任务是否存在
   */
  exists(uuid: string): Promise<boolean>;

  /**
   * 获取用户任务数量
   */
  countByUser(userId: string): Promise<number>;

  /**
   * 获取活跃任务数量
   */
  countActiveTasks(): Promise<number>;

  /**
   * 导出任务数据
   */
  exportTasks(query: IScheduleTaskQuery): Promise<ScheduleTaskResponseDto[]>;

  /**
   * 导入任务数据
   */
  importTasks(
    tasks: CreateScheduleTaskRequestDto[],
    createdBy: string,
  ): Promise<ScheduleTaskResponseDto[]>;
}
