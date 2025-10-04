import { type ScheduleContracts } from '@dailyuse/contracts';
import { scheduleApiClient } from '../../infrastructure/api/scheduleApiClient';
import { getScheduleStore } from '../../presentation/stores/scheduleStore';

/**
 * Schedule Web 应用服务
 *
 * 职责：
 * - 协调 Web 端的调度相关操作
 * - 整合 API 调用和本地缓存（Store）
 * - 管理数据同步和缓存策略
 * - 提供统一的数据访问接口
 *
 * 设计原则：
 * - 缓存优先：优先使用 Store 中的缓存数据
 * - 自动同步：操作后自动更新 Store
 * - 错误处理：统一处理错误并传播
 */
export class ScheduleWebApplicationService {
  private readonly scheduleStore = getScheduleStore();

  // ==================== Schedule Task CRUD 操作 ====================

  /**
   * 创建调度任务
   */
  async createScheduleTask(
    request: ScheduleContracts.CreateScheduleTaskRequestDto,
  ): Promise<ScheduleContracts.ScheduleTaskResponseDto> {
    try {
      const task = await scheduleApiClient.createScheduleTask(request);

      // 更新 Store
      this.scheduleStore.addTask(task);

      return task;
    } catch (error) {
      console.error('创建调度任务失败:', error);
      throw error;
    }
  }

  /**
   * 获取调度任务列表
   */
  async getScheduleTasks(params?: {
    page?: number;
    limit?: number;
    status?: string;
    taskType?: string;
    enabled?: boolean;
    tags?: string[];
  }): Promise<ScheduleContracts.ScheduleTaskListResponseDto> {
    try {
      this.scheduleStore.setLoading(true);

      const result = await scheduleApiClient.getScheduleTasks(params);

      // 更新 Store
      this.scheduleStore.setTasks(result.tasks);
      this.scheduleStore.setPagination({
        total: result.total,
        hasMore: result.pagination.hasMore,
      });
      this.scheduleStore.setInitialized(true);

      return result;
    } catch (error) {
      console.error('获取调度任务列表失败:', error);
      this.scheduleStore.setError('获取调度任务列表失败');
      throw error;
    } finally {
      this.scheduleStore.setLoading(false);
    }
  }

  /**
   * 获取单个调度任务
   */
  async getScheduleTask(uuid: string): Promise<ScheduleContracts.ScheduleTaskResponseDto> {
    try {
      // 先检查缓存
      const cached = this.scheduleStore.getTaskByUuid(uuid);
      if (cached && !this.scheduleStore.shouldRefreshCache) {
        return cached;
      }

      // 从API获取
      const task = await scheduleApiClient.getScheduleTask(uuid);

      // 更新 Store
      this.scheduleStore.updateTask(uuid, task);

      return task;
    } catch (error) {
      console.error('获取调度任务详情失败:', error);
      throw error;
    }
  }

  /**
   * 更新调度任务
   */
  async updateScheduleTask(
    uuid: string,
    request: ScheduleContracts.UpdateScheduleTaskRequestDto,
  ): Promise<ScheduleContracts.ScheduleTaskResponseDto> {
    try {
      const task = await scheduleApiClient.updateScheduleTask(uuid, request);

      // 更新 Store
      this.scheduleStore.updateTask(uuid, task);

      return task;
    } catch (error) {
      console.error('更新调度任务失败:', error);
      throw error;
    }
  }

  /**
   * 删除调度任务
   */
  async deleteScheduleTask(uuid: string): Promise<void> {
    try {
      await scheduleApiClient.deleteScheduleTask(uuid);

      // 更新 Store
      this.scheduleStore.removeTask(uuid);
    } catch (error) {
      console.error('删除调度任务失败:', error);
      throw error;
    }
  }

  // ==================== Schedule Task Operations ====================

  /**
   * 启用调度任务
   */
  async enableScheduleTask(uuid: string): Promise<ScheduleContracts.ScheduleTaskResponseDto> {
    try {
      const task = await scheduleApiClient.enableScheduleTask(uuid);

      // 更新 Store
      this.scheduleStore.updateTask(uuid, task);

      return task;
    } catch (error) {
      console.error('启用调度任务失败:', error);
      throw error;
    }
  }

  /**
   * 禁用调度任务
   */
  async disableScheduleTask(uuid: string): Promise<ScheduleContracts.ScheduleTaskResponseDto> {
    try {
      const task = await scheduleApiClient.disableScheduleTask(uuid);

      // 更新 Store
      this.scheduleStore.updateTask(uuid, task);

      return task;
    } catch (error) {
      console.error('禁用调度任务失败:', error);
      throw error;
    }
  }

  /**
   * 暂停调度任务
   */
  async pauseScheduleTask(uuid: string): Promise<ScheduleContracts.ScheduleTaskResponseDto> {
    try {
      const task = await scheduleApiClient.pauseScheduleTask(uuid);

      // 更新 Store
      this.scheduleStore.updateTask(uuid, task);

      return task;
    } catch (error) {
      console.error('暂停调度任务失败:', error);
      throw error;
    }
  }

  /**
   * 恢复调度任务
   */
  async resumeScheduleTask(uuid: string): Promise<ScheduleContracts.ScheduleTaskResponseDto> {
    try {
      const task = await scheduleApiClient.resumeScheduleTask(uuid);

      // 更新 Store
      this.scheduleStore.updateTask(uuid, task);

      return task;
    } catch (error) {
      console.error('恢复调度任务失败:', error);
      throw error;
    }
  }

  /**
   * 执行调度任务
   */
  async executeScheduleTask(uuid: string, force?: boolean): Promise<any> {
    try {
      return await scheduleApiClient.executeScheduleTask(uuid, force);
    } catch (error) {
      console.error('执行调度任务失败:', error);
      throw error;
    }
  }

  /**
   * 延后提醒
   */
  async snoozeReminder(
    uuid: string,
    request: ScheduleContracts.SnoozeReminderRequestDto,
  ): Promise<ScheduleContracts.ScheduleTaskResponseDto> {
    try {
      const task = await scheduleApiClient.snoozeReminder(uuid, request);

      // 更新 Store
      this.scheduleStore.updateTask(uuid, task);

      return task;
    } catch (error) {
      console.error('延后提醒失败:', error);
      throw error;
    }
  }

  // ==================== Additional Features ====================

  /**
   * 获取即将到来的任务
   */
  async getUpcomingTasks(params?: {
    withinMinutes?: number;
    limit?: number;
  }): Promise<ScheduleContracts.UpcomingTasksResponseDto> {
    try {
      return await scheduleApiClient.getUpcomingTasks(params);
    } catch (error) {
      console.error('获取即将到来的任务失败:', error);
      throw error;
    }
  }

  /**
   * 快速创建提醒
   */
  async createQuickReminder(
    request: ScheduleContracts.QuickReminderRequestDto,
  ): Promise<ScheduleContracts.ScheduleTaskResponseDto> {
    try {
      const task = await scheduleApiClient.createQuickReminder(request);

      // 更新 Store
      this.scheduleStore.addTask(task);

      return task;
    } catch (error) {
      console.error('快速创建提醒失败:', error);
      throw error;
    }
  }

  /**
   * 批量操作调度任务
   */
  async batchOperateScheduleTasks(
    request: ScheduleContracts.BatchScheduleTaskOperationRequestDto,
  ): Promise<ScheduleContracts.BatchScheduleTaskOperationResponseDto> {
    try {
      const result = await scheduleApiClient.batchOperateScheduleTasks(request);

      // 根据操作类型更新 Store
      if (request.operation === 'delete') {
        result.success.forEach((uuid) => {
          this.scheduleStore.removeTask(uuid);
        });
      } else if (request.operation === 'enable') {
        this.scheduleStore.batchUpdateTasks(result.success, { enabled: true });
      } else if (request.operation === 'disable') {
        this.scheduleStore.batchUpdateTasks(result.success, { enabled: false });
      }

      return result;
    } catch (error) {
      console.error('批量操作调度任务失败:', error);
      throw error;
    }
  }

  /**
   * 获取统计信息
   */
  async getStatistics(): Promise<ScheduleContracts.IScheduleTaskStatistics> {
    try {
      const statistics = await scheduleApiClient.getStatistics();

      // 更新 Store
      this.scheduleStore.setStatistics(statistics);

      return statistics;
    } catch (error) {
      console.error('获取统计信息失败:', error);
      throw error;
    }
  }

  // ==================== 高级功能 ====================

  /**
   * 初始化模块数据
   */
  async initializeModule(): Promise<void> {
    try {
      // 并行获取任务列表和统计信息
      await Promise.all([this.getScheduleTasks(), this.getStatistics()]);
    } catch (error) {
      console.error('初始化 Schedule 模块失败:', error);
      throw error;
    }
  }

  /**
   * 刷新所有数据
   */
  async refreshAll(): Promise<void> {
    try {
      await Promise.all([this.getScheduleTasks({ page: 1 }), this.getStatistics()]);
    } catch (error) {
      console.error('刷新数据失败:', error);
      throw error;
    }
  }
}

/**
 * 全局单例服务实例 - 懒加载
 */
let _scheduleService: ScheduleWebApplicationService | null = null;

/**
 * 获取 Schedule Web 应用服务实例
 */
export const getScheduleWebService = (): ScheduleWebApplicationService => {
  if (!_scheduleService) {
    _scheduleService = new ScheduleWebApplicationService();
  }
  return _scheduleService;
};

// 保持向后兼容性
export const scheduleWebApplicationService = getScheduleWebService();
