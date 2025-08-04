import { ref } from "vue";
import { getTaskDomainApplicationService } from "../../application/services/taskDomainApplicationService";
import { useTaskStore } from "../stores/taskStore";
import type { TaskTemplate } from "../../domain/aggregates/taskTemplate";
import type { TaskInstance } from "../../domain/aggregates/taskInstance";
import { useSnackbar } from "@/shared/composables/useSnackbar";

export function useTaskService() {
  const getTaskService = () => getTaskDomainApplicationService();
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

    try {
      // 使用修复后的架构：从元模板创建任务模板但不保存
      // 注意：这个方法现在只创建模板对象，不会保存到数据库
      const newTaskTemplate = await getTaskService().createTaskTemplateByMetaTemplate(
        metaTemplateUuid,
      );
      
      if (!newTaskTemplate) {
        showError('无法创建任务模板，请检查元模板是否存在');
        return;
      }
      
      // 将创建的模板传递给编辑器
      taskStore.updateTaskTemplateBeingEdited(newTaskTemplate);
      isEditMode.value = false; // 这是新创建的模板，需要保存

      // 显示编辑对话框，让用户进一步编辑
      showEditTaskTemplateDialog.value = true;
      
      showSuccess(`成功创建任务模板 "${newTaskTemplate.title}"，请编辑并保存`);
    } catch (error) {
      console.error('从元模板创建任务模板失败:', error);
      showError(`创建任务模板失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 取消模板选择
  const cancelTemplateSelection = () => {
    showTemplateSelectionDialog.value = false;
  };

  // 开始编辑任务模板
  const startEditTaskTemplate = async (templateId: string) => {
    try {
      // 使用新架构的服务获取任务模板
      const template = await getTaskService().getTaskTemplate(templateId);
      
      if (template) {
        // 将领域对象转换为 store 需要的格式（深拷贝以避免修改原始数据）
        taskStore.updateTaskTemplateBeingEdited(JSON.parse(JSON.stringify(template)));
        isEditMode.value = true;
        showEditTaskTemplateDialog.value = true;
        
        showInfo(`开始编辑任务模板 "${template.title}"`);
      } else {
        showError('未找到指定的任务模板');
      }
    } catch (error) {
      console.error('获取模板失败:', error);
      showError(`获取模板失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 保存任务模板
  const handleSaveTaskTemplate = async () => {
    try {
      const taskTemplateBeingEdited = taskStore.getTaskTemplateBeingEdited;
      if (!taskTemplateBeingEdited) {
        showError('没有正在编辑的任务模板');
        return;
      }
      
      let result;
      if (isEditMode.value && taskTemplateBeingEdited.uuid) {
        // 更新现有模板 - 使用深度序列化确保数据可传输
        const templateDto = JSON.parse(JSON.stringify(taskTemplateBeingEdited.toDTO()));
        result = await getTaskService().updateTaskTemplate(templateDto);
      } else {
        // 创建新模板 - 使用深度序列化确保数据可传输
        const templateDto = JSON.parse(JSON.stringify(taskTemplateBeingEdited.toDTO()));
        result = await getTaskService().createTaskTemplate(templateDto);
      }

      if (result.success && result.data) {
        showEditTaskTemplateDialog.value = false;
        isEditMode.value = false;
        
        const action = isEditMode.value ? '更新' : '创建';
        showSuccess(`任务模板 "${result.data.title}" ${action}成功`);
      } else {
        showError(result.message || '保存任务模板失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showError(`保存任务模板时发生错误: ${errorMessage}`);
    }
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
      const result = await getTaskService().deleteTaskTemplate(template.uuid);
      
      if (result.success) {
        showSuccess(result.message || '删除任务模板成功', 5000);
      } else {
        showError(result.message || '删除任务模板失败', 6000);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showError(`删除任务模板失败: ${errorMessage}`, 6000);
      return {
        success: false,
        message: errorMessage,
        data: undefined
      };
    }
  };

  // 删除任务实例
  const handleDeleteTaskInstance = async (taskId: string) => {
    try {
      const result = await getTaskService().deleteTaskInstance(taskId);
      
      if (result.success) {
        showSuccess(`成功删除任务实例`, 4000);
      } else {
        showError(result.message || '删除任务实例失败', 6000);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showError(`删除任务实例失败: ${errorMessage}`, 6000);
      return {
        success: false,
        message: errorMessage,
        data: undefined
      };
    }
  };

  const handlePauseTaskTemplate = async (templateId: string) => {
    try {
      const result = await getTaskService().pauseTaskTemplate(templateId);
      
      if (result.success) {
        showSuccess(`任务模板已暂停`, 4000);
      } else {
        showError(result.message || `暂停任务模板失败`, 6000);
      }
      
      return result.success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showError(`暂停任务模板失败: ${errorMessage}`, 6000);
      return false;
    }
  }

  const handleResumeTaskTemplate = async (templateId: string) => {
    try {
      const result = await getTaskService().resumeTaskTemplate(templateId);
      
      if (result.success) {
        showSuccess(`任务模板已恢复`, 4000);
      } else {
        showError(result.message || `恢复任务模板失败`, 6000);
      }
      
      return result.success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showError(`恢复任务模板失败: ${errorMessage}`, 6000);
      return false;
    }
  }

  const handleCompleteTaskInstance = async (taskId: string) => {
    try {
      const result = await getTaskService().completeTaskInstance(taskId);
      
      if (result.success) {
        showSuccess(`任务实例已完成`, 4000);
      } else {
        showError(result.message || '完成任务实例失败', 6000);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showError(`完成任务实例失败: ${errorMessage}`, 6000);
      return {
        success: false,
        message: errorMessage,
        data: undefined
      };
    }
  }

  const handleUndoCompleteTaskInstance = async (taskId: string) => {
    try {
      const result = await getTaskService().undoCompleteTaskInstance(taskId);
      
      if (result.success) {
        showSuccess(`任务实例已撤销完成`, 4000);
      } else {
        showError(result.message || '撤销完成任务实例失败', 6000);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showError(`撤销完成任务实例失败: ${errorMessage}`, 6000);
      return {
        success: false,
        message: errorMessage,
        data: undefined
      };
    }
  } 

  // 获取所有元模板
  const getMetaTemplates = async () => {
    try {
      const metaTemplates = await getTaskService().getAllMetaTemplates();
      return metaTemplates;
    } catch (error) {
      console.error('获取元模板失败:', error);
      showError(`获取元模板失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return [];
    }
  };

  // 获取所有任务模板
  const getTaskTemplates = async () => {
    try {
      const templates = await getTaskService().getAllTaskTemplates();
      return templates;
    } catch (error) {
      console.error('获取任务模板失败:', error);
      showError(`获取任务模板失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return [];
    }
  };

  // 获取今日任务实例
  const getTodayTaskInstances = async () => {
    try {
      const instances = await getTaskService().getTodayTasks();
      return instances;
    } catch (error) {
      console.error('获取今日任务失败:', error);
      showError(`获取今日任务失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return [];
    }
  };

  // 创建任务实例（从模板创建）
  const createTaskInstanceFromTemplate = async (_templateUuid: string, _scheduleDate?: Date) => {
    try {
      showWarning('暂不支持直接创建任务实例，请联系开发者完善此功能');
      return null;
    } catch (error) {
      console.error('创建任务实例失败:', error);
      showError(
        `创建任务实例失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
      return null;
    }
  };

  // 批量完成任务
  const batchCompleteTaskInstances = async (taskIds: string[]) => {
    try {
      const results = await Promise.all(
        taskIds.map(uuid => getTaskService().completeTaskInstance(uuid))
      );
      
      const successCount = results.filter(r => r.success).length;
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
        taskIds.map(uuid => getTaskService().deleteTaskInstance(uuid))
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
        const templates = await getTaskService().getAllTaskTemplates();
        return templates.filter(t => 
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(query.toLowerCase()))
        );
      } else {
        const instances = await getTaskService().getTodayTasks();
        return instances.filter((i: TaskInstance) => 
          i.title.toLowerCase().includes(query.toLowerCase()) ||
          (i.description && i.description.toLowerCase().includes(query.toLowerCase()))
        );
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
    searchTasks
  };
}
