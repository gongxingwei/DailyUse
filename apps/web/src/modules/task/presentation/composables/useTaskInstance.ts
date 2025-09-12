import { TaskWebApplicationService } from '../../application/services/TaskWebApplicationService';
import { useNotification } from './useNotification';

/**
 * 任务实例管理 Composable
 * 专门处理任务实例的 CRUD 和状态变更操作
 */
export function useTaskInstance() {
  const { showSuccess, showError, showInfo } = useNotification();

  // Helper function to get task service
  const taskService = new TaskWebApplicationService();

  // 获取今日任务实例
  const getTodayTaskInstances = async () => {
    try {
      // TODO: 需要实现获取今日任务的方法
      const instances = await taskService.getInstances({ date: new Date() });
      return instances;
    } catch (error) {
      console.error('获取今日任务失败:', error);
      showError(`获取今日任务失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return [];
    }
  };

  // 根据ID获取任务实例
  const getTaskInstance = async (taskId: string) => {
    try {
      const instance = await taskService.getInstanceById(taskId);
      if (instance) {
        return instance;
      } else {
        showError('未找到指定的任务实例');
        return null;
      }
    } catch (error) {
      console.error('获取任务实例失败:', error);
      showError(`获取任务实例失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return null;
    }
  };

  // 完成任务实例
  const completeTaskInstance = async (taskId: string) => {
    try {
      const result = await taskService.completeTask(taskId, {});

      if (result.success) {
        showSuccess(`任务已完成`);
        return true;
      } else {
        showError(result.message || '完成任务失败');
        return false;
      }
    } catch (error) {
      console.error('完成任务实例失败:', error);
      showError(`完成任务失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return false;
    }
  };

  // 撤销完成任务实例
  const undoCompleteTaskInstance = async (taskId: string) => {
    try {
      const result = await taskService.undoCompleteTask(taskId, 'current-user');

      if (result.success) {
        showSuccess(`任务撤销完成成功`);
        return true;
      } else {
        showError(result.message || '撤销完成失败');
        return false;
      }
    } catch (error) {
      console.error('撤销完成任务实例失败:', error);
      showError(`撤销完成失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return false;
    }
  };

  // 删除任务实例
  const deleteTaskInstance = async (taskId: string) => {
    try {
      await taskService.deleteInstance(taskId);
      showSuccess(`任务实例删除成功`);
      return true;
    } catch (error) {
      console.error('删除任务实例失败:', error);
      showError(`删除任务实例失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return false;
    }
  };

  // 批量完成任务
  const batchCompleteTaskInstances = async (taskIds: string[]) => {
    try {
      const results = await Promise.allSettled(taskIds.map((uuid) => completeTaskInstance(uuid)));

      const successCount = results.filter((r) => r.status === 'fulfilled' && r.value).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        showSuccess(`成功完成 ${successCount} 个任务`);
      } else {
        showInfo(`完成 ${successCount} 个任务，失败 ${failCount} 个`);
      }

      return results;
    } catch (error) {
      console.error('批量完成任务失败:', error);
      showError(`批量操作失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return [];
    }
  };

  // 批量删除任务实例
  const batchDeleteTaskInstances = async (taskIds: string[]) => {
    try {
      const results = await Promise.allSettled(taskIds.map((uuid) => deleteTaskInstance(uuid)));

      const successCount = results.filter((r) => r.status === 'fulfilled' && r.value).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        showSuccess(`成功删除 ${successCount} 个任务`);
      } else {
        showInfo(`删除 ${successCount} 个任务，失败 ${failCount} 个`);
      }

      return results;
    } catch (error) {
      console.error('批量删除任务失败:', error);
      showError(`批量操作失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return [];
    }
  };

  return {
    getTodayTaskInstances,
    getTaskInstance,
    completeTaskInstance,
    undoCompleteTaskInstance,
    deleteTaskInstance,
    batchCompleteTaskInstances,
    batchDeleteTaskInstances,
  };
}
