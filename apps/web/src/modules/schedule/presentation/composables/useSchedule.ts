/**
 * useSchedule Composable
 * Schedule 模块的核心组合函数 - 严格参考 Repository 模块
 */

import { ref, onMounted } from 'vue';
import { scheduleWebApplicationService } from '../../services/ScheduleWebApplicationService';
import { ScheduleContracts } from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('useSchedule');

/**
 * Schedule 模块的核心组合函数
 * 提供任务和统计信息的状态管理
 */
export function useSchedule() {
  // ===== 状态 =====
  const tasks = ref<ScheduleContracts.ScheduleTaskServerDTO[]>([]);
  const statistics = ref<ScheduleContracts.ScheduleStatisticsServerDTO | null>(null);
  const moduleStatistics = ref<Record<
    ScheduleContracts.SourceModule,
    ScheduleContracts.ModuleStatisticsServerDTO
  > | null>(null);
  const isLoading = ref(false);
  const isLoadingStats = ref(false);
  const error = ref<string | null>(null);

  // ===== 任务管理方法 =====

  /**
   * 获取所有任务
   */
  async function fetchTasks() {
    isLoading.value = true;
    error.value = null;

    try {
      logger.info('Fetching all schedule tasks');
      tasks.value = await scheduleWebApplicationService.getAllTasks();
      logger.info('Schedule tasks fetched successfully', { count: tasks.value.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch schedule tasks';
      error.value = message;
      logger.error('Error fetching schedule tasks', { error: err });
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 根据模块获取任务
   */
  async function fetchTasksByModule(module: ScheduleContracts.SourceModule) {
    isLoading.value = true;
    error.value = null;

    try {
      logger.info('Fetching tasks by module', { module });
      tasks.value = await scheduleWebApplicationService.getTasksByModule(module);
      logger.info('Tasks fetched by module successfully', {
        module,
        count: tasks.value.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tasks by module';
      error.value = message;
      logger.error('Error fetching tasks by module', { error: err, module });
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 创建任务
   */
  async function createTask(request: ScheduleContracts.CreateScheduleTaskRequestDTO) {
    isLoading.value = true;
    error.value = null;

    try {
      logger.info('Creating schedule task', { name: request.name });
      const newTask = await scheduleWebApplicationService.createTask(request);
      tasks.value.push(newTask);
      logger.info('Schedule task created successfully', { taskUuid: newTask.uuid });
      return newTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create schedule task';
      error.value = message;
      logger.error('Error creating schedule task', { error: err });
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 暂停任务
   */
  async function pauseTask(taskUuid: string) {
    try {
      logger.info('Pausing task', { taskUuid });
      await scheduleWebApplicationService.pauseTask(taskUuid);

      // 更新本地状态
      const task = tasks.value.find((t) => t.uuid === taskUuid);
      if (task) {
        task.status = ScheduleContracts.ScheduleTaskStatus.PAUSED;
      }

      logger.info('Task paused successfully', { taskUuid });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pause task';
      error.value = message;
      logger.error('Error pausing task', { error: err, taskUuid });
      throw err;
    }
  }

  /**
   * 恢复任务
   */
  async function resumeTask(taskUuid: string) {
    try {
      logger.info('Resuming task', { taskUuid });
      await scheduleWebApplicationService.resumeTask(taskUuid);

      // 更新本地状态
      const task = tasks.value.find((t) => t.uuid === taskUuid);
      if (task) {
        task.status = ScheduleContracts.ScheduleTaskStatus.ACTIVE;
      }

      logger.info('Task resumed successfully', { taskUuid });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resume task';
      error.value = message;
      logger.error('Error resuming task', { error: err, taskUuid });
      throw err;
    }
  }

  /**
   * 删除任务
   */
  async function deleteTask(taskUuid: string) {
    try {
      logger.info('Deleting task', { taskUuid });
      await scheduleWebApplicationService.deleteTask(taskUuid);

      // 从本地列表移除
      const index = tasks.value.findIndex((t) => t.uuid === taskUuid);
      if (index > -1) {
        tasks.value.splice(index, 1);
      }

      logger.info('Task deleted successfully', { taskUuid });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete task';
      error.value = message;
      logger.error('Error deleting task', { error: err, taskUuid });
      throw err;
    }
  }

  // ===== 统计信息方法 =====

  /**
   * 获取统计信息
   */
  async function fetchStatistics() {
    isLoadingStats.value = true;
    error.value = null;

    try {
      logger.info('Fetching schedule statistics');
      statistics.value = await scheduleWebApplicationService.getStatistics();
      logger.info('Schedule statistics fetched successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch statistics';
      error.value = message;
      logger.error('Error fetching statistics', { error: err });
    } finally {
      isLoadingStats.value = false;
    }
  }

  /**
   * 获取所有模块统计
   */
  async function fetchAllModuleStatistics() {
    isLoadingStats.value = true;
    error.value = null;

    try {
      logger.info('Fetching all module statistics');
      moduleStatistics.value = await scheduleWebApplicationService.getAllModuleStatistics();
      logger.info('All module statistics fetched successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch module statistics';
      error.value = message;
      logger.error('Error fetching module statistics', { error: err });
    } finally {
      isLoadingStats.value = false;
    }
  }

  /**
   * 重新计算统计信息
   */
  async function recalculateStatistics() {
    isLoadingStats.value = true;
    error.value = null;

    try {
      logger.info('Recalculating statistics');
      statistics.value = await scheduleWebApplicationService.recalculateStatistics();
      logger.info('Statistics recalculated successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to recalculate statistics';
      error.value = message;
      logger.error('Error recalculating statistics', { error: err });
      throw err;
    } finally {
      isLoadingStats.value = false;
    }
  }

  // ===== 初始化和刷新 =====

  /**
   * 初始化 - 加载任务和统计信息
   */
  async function initialize() {
    await Promise.all([fetchTasks(), fetchStatistics(), fetchAllModuleStatistics()]);
  }

  /**
   * 刷新所有数据
   */
  async function refresh() {
    await initialize();
  }

  /**
   * 清除错误
   */
  function clearError() {
    error.value = null;
  }

  // ===== 生命周期 =====
  onMounted(() => {
    // 组件挂载时不自动加载，由页面控制
  });

  return {
    // 状态
    tasks,
    statistics,
    moduleStatistics,
    isLoading,
    isLoadingStats,
    error,

    // 任务方法
    fetchTasks,
    fetchTasksByModule,
    createTask,
    pauseTask,
    resumeTask,
    deleteTask,

    // 统计方法
    fetchStatistics,
    fetchAllModuleStatistics,
    recalculateStatistics,

    // 工具方法
    initialize,
    refresh,
    clearError,
  };
}
