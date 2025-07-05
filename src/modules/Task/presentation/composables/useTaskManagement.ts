import { ref, computed, onMounted } from 'vue';
import { useTaskStore } from '../stores/taskStore';
import { taskDomainApplicationService } from '../../application/services/taskDomainApplicationService';
import { useNotification } from './useNotification';
import { useTaskInstance } from './useTaskInstance';
import { useTaskTemplate } from './useTaskTemplate';
import { useMetaTemplate } from './useMetaTemplate';
import { useTaskInstanceManagement } from './useTaskInstanceManagement';
import { useTaskReminderInit } from './useTaskReminderInit';

/**
 * 任务管理总控 Composable
 * 提供任务模块的完整功能集合和状态管理
 * 
 * 这是新架构下的统一入口，整合了：
 * - 任务实例管理
 * - 任务模板管理  
 * - 元模板管理
 * - 提醒初始化
 * - 数据同步
 */
export function useTaskManagement() {
  const taskStore = useTaskStore();
  const { showSuccess, showError, showInfo } = useNotification();
  
  // 加载状态
  const isLoading = ref(false);
  const isInitialized = ref(false);
  
  // 整合各子模块
  const taskInstance = useTaskInstance();
  const taskTemplate = useTaskTemplate();
  const metaTemplate = useMetaTemplate();
  const taskInstanceMgmt = useTaskInstanceManagement();
  const reminderInit = useTaskReminderInit(false); // 手动初始化

  // 初始化状态
  const initializationStatus = ref({
    data: false,
    reminders: false,
    complete: false
  });

  // 数据统计
  const stats = computed(() => {
    const instances = taskStore.getAllTaskInstances;
    const templates = taskStore.getAllTaskTemplates;
    const metaTemplates = taskStore.getAllTaskMetaTemplates;
    
    return {
      totalInstances: instances.length,
      completedInstances: instances.filter(i => i.status === 'completed').length,
      pendingInstances: instances.filter(i => i.status === 'pending').length,
      inProgressInstances: instances.filter(i => i.status === 'inProgress').length,
      totalTemplates: templates.length,
      totalMetaTemplates: metaTemplates.length,
      todayTasks: instances.filter(i => {
        // 简化的今日任务计算
        const today = new Date().toDateString();
        return i.timeConfig.scheduledTime && 
               new Date(i.timeConfig.scheduledTime.timestamp).toDateString() === today;
      }).length
    };
  });

  /**
   * 初始化任务管理系统
   */
  const initialize = async () => {
    if (isInitialized.value) {
      return;
    }

    isLoading.value = true;
    
    try {
      // 1. 加载基础数据
      await loadAllData();
      initializationStatus.value.data = true;
      
      // 2. 初始化提醒系统
      if (initializationStatus.value.data) {
        await reminderInit.initializeTaskReminders();
        initializationStatus.value.reminders = true;
      }
      
      initializationStatus.value.complete = true;
      isInitialized.value = true;
      
      showSuccess('任务管理系统初始化完成');
    } catch (error) {
      console.error('任务管理系统初始化失败:', error);
      showError(`初始化失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 加载所有任务数据
   */
  const loadAllData = async () => {
    try {
      const [instances, templates, metaTemplates] = await Promise.all([
        taskDomainApplicationService.getAllTaskInstances(),
        taskDomainApplicationService.getAllTaskTemplates(),
        taskDomainApplicationService.getAllMetaTemplates()
      ]);

      // 同步到 store
      taskStore.syncAllData(templates, instances, metaTemplates);
      
      showInfo(`加载完成: ${instances.length} 个任务实例, ${templates.length} 个模板, ${metaTemplates.length} 个元模板`);
    } catch (error) {
      console.error('加载数据失败:', error);
      throw error;
    }
  };

  /**
   * 刷新所有数据
   */
  const refreshAllData = async () => {
    isLoading.value = true;
    try {
      await loadAllData();
      showSuccess('数据刷新完成');
    } catch (error) {
      console.error('刷新数据失败:', error);
      showError(`刷新失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 重置任务管理系统
   */
  const reset = async () => {
    isLoading.value = true;
    try {
      // 清空 store
      taskStore.setTaskInstances([]);
      taskStore.setTaskTemplates([]);
      taskStore.setMetaTemplates([]);
      
      // 重置状态
      isInitialized.value = false;
      initializationStatus.value = {
        data: false,
        reminders: false,
        complete: false
      };
      
      showInfo('任务管理系统已重置');
    } catch (error) {
      console.error('重置失败:', error);
      showError(`重置失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      isLoading.value = false;
    }
  };

  // 自动初始化
  onMounted(() => {
    initialize();
  });

  return {
    // 状态
    isLoading,
    isInitialized,
    initializationStatus,
    stats,
    
    // 子模块
    taskInstance,
    taskTemplate,
    metaTemplate,
    taskInstanceMgmt,
    reminderInit,
    
    // 全局操作
    initialize,
    loadAllData,
    refreshAllData,
    reset,
    
    // Store 访问器
    store: taskStore
  };
}
