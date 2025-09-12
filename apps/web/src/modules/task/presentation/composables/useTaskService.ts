import { ref } from 'vue';
import { TaskWebApplicationService } from '../../application/services/TaskWebApplicationService';
import { useTaskStore } from '../stores/taskStore';
import type { TaskTemplate, TaskInstance } from '@dailyuse/domain-client';
import { useSnackbar } from '@/shared/composables/useSnackbar';

export function useTaskService() {
  const taskService = new TaskWebApplicationService();
  const { showSuccess, showError, showWarning, showInfo, snackbar } = useSnackbar();
  const taskStore = useTaskStore();
  const showEditTaskTemplateDialog = ref(false);
  const showTemplateSelectionDialog = ref(false);
  const isEditMode = ref(false);

  const startCreateTaskTemplate = () => {
    showTemplateSelectionDialog.value = true;
  };

  const handleTemplateTypeSelected = async (metaTemplateUuid: string) => {
    showTemplateSelectionDialog.value = false;
    showInfo('功能开发中，请稍后使用');
  };

  // 取消模板选择
  const cancelTemplateSelection = () => {
    showTemplateSelectionDialog.value = false;
  };

  // 开始编辑任务模板
  const startEditTaskTemplate = async (templateId: string) => {
    showInfo('功能开发中，请稍后使用');
  };

  // 保存任务模板
  const handleSaveTaskTemplate = async () => {
    showInfo('功能开发中，请稍后使用');
  };

  // 取消编辑
  const cancelEditTaskTemplate = () => {
    showEditTaskTemplateDialog.value = false;
    taskStore.updateTaskTemplateBeingEdited(null);
    isEditMode.value = false;
  };

  // 删除任务模板
  const handleDeleteTaskTemplate = async (template: TaskTemplate) => {
    try {
      await taskService.deleteTemplate(template.uuid);
      showSuccess('删除任务模板成功');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showError(`删除任务模板失败: ${errorMessage}`);
      return { success: false, message: errorMessage };
    }
  };

  // 删除任务实例
  const handleDeleteTaskInstance = async (taskId: string) => {
    try {
      await taskService.deleteInstance(taskId);
      showSuccess('删除任务实例成功');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showError(`删除任务实例失败: ${errorMessage}`);
      return { success: false, message: errorMessage };
    }
  };

  const handlePauseTaskTemplate = async (templateId: string) => {
    try {
      await taskService.pauseTemplate(templateId);
      showSuccess('任务模板已暂停');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showError(`暂停任务模板失败: ${errorMessage}`);
      return false;
    }
  };

  const handleResumeTaskTemplate = async (templateId: string) => {
    try {
      await taskService.activateTemplate(templateId);
      showSuccess('任务模板已恢复');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showError(`恢复任务模板失败: ${errorMessage}`);
      return false;
    }
  };

  const handleCompleteTaskInstance = async (taskId: string) => {
    try {
      await taskService.completeTask(taskId, {});
      showSuccess('任务实例已完成');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showError(`完成任务实例失败: ${errorMessage}`);
      return { success: false, message: errorMessage };
    }
  };

  const handleUndoCompleteTaskInstance = async (taskId: string) => {
    try {
      await taskService.undoCompleteTask(taskId, '');
      showSuccess('任务实例已撤销完成');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showError(`撤销完成任务实例失败: ${errorMessage}`);
      return { success: false, message: errorMessage };
    }
  };

  // 获取所有元模板
  const getMetaTemplates = async () => {
    showInfo('功能开发中，请稍后使用');
    return [];
  };

  // 获取所有任务模板
  const getTaskTemplates = async () => {
    try {
      const response = await taskService.getTemplates();
      return response;
    } catch (error) {
      console.error('获取任务模板失败:', error);
      showError(`获取任务模板失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return [];
    }
  };

  // 获取今日任务实例
  const getTodayTaskInstances = async () => {
    try {
      const response = await taskService.getUpcomingTasks();
      return response.instances || [];
    } catch (error) {
      console.error('获取今日任务失败:', error);
      showError(`获取今日任务失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return [];
    }
  };

  // 创建任务实例（从模板创建）
  const createTaskInstanceFromTemplate = async (_templateUuid: string, _scheduleDate?: Date) => {
    showWarning('暂不支持直接创建任务实例，请联系开发者完善此功能');
    return null;
  };

  // 批量完成任务
  const batchCompleteTaskInstances = async (taskIds: string[]) => {
    try {
      const results = await Promise.all(
        taskIds.map(async (uuid) => {
          try {
            await taskService.completeTask(uuid, {});
            return { success: true };
          } catch (error) {
            return { success: false };
          }
        }),
      );

      const successCount = results.filter((r: any) => r.success).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        showSuccess(`成功完成 ${successCount} 个任务`);
      } else {
        showWarning(`完成 ${successCount} 个任务，失败 ${failCount} 个`);
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
      const results = await Promise.all(
        taskIds.map(async (uuid) => {
          try {
            await taskService.deleteInstance(uuid);
            return { success: true };
          } catch (error) {
            return { success: false };
          }
        }),
      );

      const successCount = results.filter((r: any) => r.success).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        showSuccess(`成功删除 ${successCount} 个任务`);
      } else {
        showWarning(`删除 ${successCount} 个任务，失败 ${failCount} 个`);
      }

      return results;
    } catch (error) {
      console.error('批量删除任务失败:', error);
      showError(`批量操作失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return [];
    }
  };

  // 搜索任务
  const searchTasks = async (query: string, type: 'template' | 'instance' = 'instance') => {
    try {
      if (type === 'template') {
        const templates = await taskService.getTemplates();
        return templates.filter(
          (t: any) =>
            t.title?.toLowerCase().includes(query.toLowerCase()) ||
            (t.description && t.description.toLowerCase().includes(query.toLowerCase())),
        );
      } else {
        const response = await taskService.searchTasks({ query });
        return response.instances || [];
      }
    } catch (error) {
      console.error('搜索任务失败:', error);
      showError(`搜索失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return [];
    }
  };

  return {
    // Snackbar配置
    snackbar,
    // 状态
    showEditTaskTemplateDialog,
    showTemplateSelectionDialog,
    isEditMode,

    // 方法
    startCreateTaskTemplate,
    handleTemplateTypeSelected,
    cancelTemplateSelection,
    startEditTaskTemplate,
    handleSaveTaskTemplate,
    cancelEditTaskTemplate,
    handleDeleteTaskTemplate,
    handleDeleteTaskInstance,
    handlePauseTaskTemplate,
    handleResumeTaskTemplate,
    handleCompleteTaskInstance,
    handleUndoCompleteTaskInstance,

    // 新增的业务逻辑方法
    getMetaTemplates,
    getTaskTemplates,
    getTodayTaskInstances,
    createTaskInstanceFromTemplate,
    batchCompleteTaskInstances,
    batchDeleteTaskInstances,
    searchTasks,
  };
}
