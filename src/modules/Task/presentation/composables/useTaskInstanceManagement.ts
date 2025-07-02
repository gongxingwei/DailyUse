import { ref, computed } from 'vue';
import { TaskApplicationService } from '@/modules/Task/application/services/taskApplicationService';
import { TaskTimeUtils } from '../../domain/utils/taskTimeUtils';
import { TaskInstance } from '../../domain/entities/taskInstance';
import { useTaskStore } from '../stores/taskStore';
export function useTaskInstanceManagement() {
    const taskStore = useTaskStore();
  const taskApplicationService = new TaskApplicationService();
  
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
    dayTasks.value.filter(task => task.status === 'pending' || task.status === 'inProgress'&& task instanceof TaskInstance)
  );

  // 业务操作方法
  const completeTask = async (task: TaskInstance) => {
    loading.value = true;
    try {
      const result = await taskApplicationService.completeTask(task.id);
      
      if (result.success) {

        await refreshTasks(); // 刷新任务列表
      } else {
        console.error('完成任务失败:', result.message || '未知错误');
      }
    } catch (error) {

      console.error('完成任务错误:', error);
    } finally {
      loading.value = false;
    }
  };

  const undoCompleteTask = async (task: TaskInstance) => {
    loading.value = true;
    try {
      const result = await taskApplicationService.undoCompleteTask(task.id);
      
      if (result) {
        await refreshTasks(); // 刷新任务列表
      } else {
        console.error('撤销完成任务失败');
      }
    } catch (error) {
      console.error('撤销完成错误:', error);
    } finally {
      loading.value = false;
    }
  };

  const refreshTasks = async () => {
    loading.value = true;
    console.log('刷新任务列表...');
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
    
    // 方法
    completeTask,
    undoCompleteTask,
    refreshTasks,
    selectDay,
    previousWeek,
    nextWeek
  };
}