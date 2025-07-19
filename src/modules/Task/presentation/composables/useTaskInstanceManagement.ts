import { ref, computed } from 'vue';
import { TaskTimeUtils } from '../../domain/utils/taskTimeUtils';
import { TaskInstance } from '../../domain/aggregates/taskInstance';
import { useTaskStore } from '../stores/taskStore';
import { getTaskDomainApplicationService } from '../../application/services/taskDomainApplicationService';
import { useNotification } from './useNotification';

/**
 * 任务实例管理 Composable
 * 提供任务实例的 CRUD 操作和状态管理
 * 所有业务操作通过 taskDomainApplicationService 进行 IPC 调用
 */
export function useTaskInstanceManagement() {
  const taskStore = useTaskStore();
  const { showSuccess, showError, showInfo } = useNotification();
  
  // Helper function to get task service
  const getTaskService = () => getTaskDomainApplicationService();
  
  const selectedDate = ref(new Date().toISOString().split('T')[0]);
  const currentWeekStart = ref(new Date());
  const loading = ref(false);
  const taskInstances = computed(() => taskStore.getAllTaskInstances);

  // 计算属性
  const dayTasks = computed(() => {
    const selectedDateTime = TaskTimeUtils.fromISOString(new Date(selectedDate.value).toISOString());
    const nextDay = TaskTimeUtils.fromISOString(
      new Date(new Date(selectedDate.value).getTime() + 24 * 60 * 60 * 1000).toISOString()
    );
    
    return taskInstances.value.filter(task => {
      if (!task.timeConfig.scheduledTime || typeof task.timeConfig.scheduledTime.timestamp !== 'number') {
        return false;
      }
      
      return task.timeConfig.scheduledTime.timestamp >= selectedDateTime.timestamp &&
             task.timeConfig.scheduledTime.timestamp < nextDay.timestamp;
    });
  });

  const completedTasks = computed(() =>
    dayTasks.value.filter(task => task.status === 'completed' && task instanceof TaskInstance)
  );

  const incompleteTasks = computed(() =>
    dayTasks.value.filter(task => (task.status === 'pending' || task.status === 'inProgress') && task instanceof TaskInstance)
  );

  // 单个任务操作方法
  const completeTask = async (task: TaskInstance) => {
    loading.value = true;
    try {
      const result = await getTaskService().completeTaskInstance(task.id);
      
      if (result.success) {
        showSuccess(`任务 "${task.title}" 已完成`);
        await refreshTasks();
      } else {
        showError(result.message || '完成任务失败');
      }
    } catch (error) {
      console.error('完成任务错误:', error);
      showError(`完成任务失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      loading.value = false;
    }
  };

  const undoCompleteTask = async (task: TaskInstance) => {
    loading.value = true;
    try {
      const result = await getTaskService().undoCompleteTaskInstance(task.id);
      
      if (result.success) {
        showSuccess(`任务 "${task.title}" 撤销完成成功`);
        await refreshTasks();
      } else {
        showError(result.message || '撤销完成任务失败');
      }
    } catch (error) {
      console.error('撤销完成错误:', error);
      showError(`撤销完成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      loading.value = false;
    }
  };

  const deleteTask = async (task: TaskInstance) => {
    loading.value = true;
    try {
      const result = await getTaskService().deleteTaskInstance(task.id);
      
      if (result.success) {
        showSuccess(`任务 "${task.title}" 已删除`);
        await refreshTasks();
      } else {
        showError(result.message || '删除任务失败');
      }
    } catch (error) {
      console.error('删除任务错误:', error);
      showError(`删除任务失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      loading.value = false;
    }
  };

  const startTask = async (task: TaskInstance) => {
    loading.value = true;
    try {
      const result = await getTaskService().startTaskInstance(task.id);
      
      if (result.success) {
        showSuccess(`任务 "${task.title}" 已开始`);
        await refreshTasks();
      } else {
        showError(result.message || '开始任务失败');
      }
    } catch (error) {
      console.error('开始任务错误:', error);
      showError(`开始任务失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      loading.value = false;
    }
  };

  const cancelTask = async (task: TaskInstance) => {
    loading.value = true;
    try {
      const result = await getTaskService().cancelTaskInstance(task.id);
      
      if (result.success) {
        showSuccess(`任务 "${task.title}" 已取消`);
        await refreshTasks();
      } else {
        showError(result.message || '取消任务失败');
      }
    } catch (error) {
      console.error('取消任务错误:', error);
      showError(`取消任务失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      loading.value = false;
    }
  };

  // 批量操作
  const batchCompleteTask = async (tasks: TaskInstance[]) => {
    if (tasks.length === 0) return;
    
    loading.value = true;
    try {
      const results = await Promise.allSettled(
        tasks.map(task => getTaskService().completeTaskInstance(task.id))
      );
      
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failCount = results.length - successCount;
      
      if (failCount === 0) {
        showSuccess(`成功完成 ${successCount} 个任务`);
      } else {
        showInfo(`完成 ${successCount} 个任务，失败 ${failCount} 个`);
      }
      
      await refreshTasks();
    } catch (error) {
      console.error('批量完成任务错误:', error);
      showError(`批量操作失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      loading.value = false;
    }
  };

  const batchDeleteTask = async (tasks: TaskInstance[]) => {
    if (tasks.length === 0) return;
    
    loading.value = true;
    try {
      const results = await Promise.allSettled(
        tasks.map(task => getTaskService().deleteTaskInstance(task.id))
      );
      
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failCount = results.length - successCount;
      
      if (failCount === 0) {
        showSuccess(`成功删除 ${successCount} 个任务`);
      } else {
        showInfo(`删除 ${successCount} 个任务，失败 ${failCount} 个`);
      }
      
      await refreshTasks();
    } catch (error) {
      console.error('批量删除任务错误:', error);
      showError(`批量操作失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      loading.value = false;
    }
  };

  // 数据刷新方法
  const refreshTasks = async () => {
    loading.value = true;
    try {
      // 通过应用服务获取最新的任务实例数据
      const latestInstances = await getTaskService().getAllTaskInstances();
      // 同步到 store 中
      taskStore.setTaskInstances(latestInstances);
    } catch (error) {
      console.error('刷新任务失败:', error);
      showError(`刷新任务失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      loading.value = false;
    }
  };

  // 日期导航方法
  const selectDay = async (date: string) => {
    selectedDate.value = date;
    await refreshTasks();
  };

  const previousWeek = () => {
    const newDate = new Date(currentWeekStart.value);
    newDate.setDate(newDate.getDate() - 7);
    currentWeekStart.value = newDate;
  };

  const nextWeek = () => {
    const newDate = new Date(currentWeekStart.value);
    newDate.setDate(newDate.getDate() + 7);
    currentWeekStart.value = newDate;
  };

  return {
    // 状态
    selectedDate,
    currentWeekStart,
    loading,
    
    // 计算属性
    dayTasks,
    completedTasks,
    incompleteTasks,
    
    // 单个任务操作
    completeTask,
    undoCompleteTask,
    deleteTask,
    startTask,
    cancelTask,
    
    // 批量操作
    batchCompleteTask,
    batchDeleteTask,
    
    // 工具方法
    refreshTasks,
    selectDay,
    previousWeek,
    nextWeek
  };
}
