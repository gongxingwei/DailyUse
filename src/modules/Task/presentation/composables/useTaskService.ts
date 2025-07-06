import { ref } from "vue";
import { getTaskDomainApplicationService } from "../../application/services/taskDomainApplicationService";
import { useTaskStore } from "../stores/taskStore";
import type { TaskTemplate } from "../../domain/entities/taskTemplate";
import type { TaskInstance } from "../../domain/entities/taskInstance";

// 使用新架构的服务
const getTaskService = () => getTaskDomainApplicationService();

interface SnackbarConfig {
  show: boolean;
  message: string;
  color: 'success' | 'error' | 'warning' | 'info';
  timeout: number;
}

export function useTaskService() {
  const taskStore = useTaskStore();
  const showEditTaskTemplateDialog = ref(false);
  const showTemplateSelectionDialog = ref(false);
  const isEditMode = ref(false);

  const snackbar = ref<SnackbarConfig>({
    show: false,
    message: '',
    color: 'success',
    timeout: 4000
  });

  const showSnackbar = (
    message: string, 
    color: SnackbarConfig['color'] = 'success',
    timeout: number = 4000
  ) => {
    snackbar.value = {
      show: true,
      message,
      color,
      timeout
    };
  };


  const closeSnackbar = () => {
    snackbar.value.show = false;
  };

  const startCreateTaskTemplate = () => {
    showTemplateSelectionDialog.value = true;
  };
  const handleTemplateTypeSelected = async (metaTemplateId: string) => {
    showTemplateSelectionDialog.value = false;

    try {
      // 使用修复后的架构：从元模板创建任务模板但不保存
      // 注意：这个方法现在只创建模板对象，不会保存到数据库
      const newTaskTemplate = await getTaskService().createTaskTemplateFromMetaTemplate(
        metaTemplateId,
        '新任务模板', // 默认标题，用户可以在编辑器中修改
        {
          description: '基于元模板创建的任务',
          priority: 3,
          tags: ['新建'],
        }
      );
      
      console.log('✓ 从元模板创建任务模板成功（待保存）:', newTaskTemplate.title);
      
      // 将创建的模板传递给编辑器
      taskStore.updateTaskTemplateBeingEdited(newTaskTemplate);
      isEditMode.value = false; // 这是新创建的模板，需要保存

      // 显示编辑对话框，让用户进一步编辑
      showEditTaskTemplateDialog.value = true;
      
      showSnackbar(
        `成功创建任务模板 "${newTaskTemplate.title}"，请编辑并保存`,
        'success'
      );
    } catch (error) {
      console.error('从元模板创建任务模板失败:', error);
      showSnackbar(
        `创建任务模板失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'error'
      );
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
        
        showSnackbar(`开始编辑任务模板 "${template.title}"`, 'info');
      } else {
        showSnackbar('未找到指定的任务模板', 'error');
      }
    } catch (error) {
      console.error('获取模板失败:', error);
      showSnackbar(
        `获取模板失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'error'
      );
    }
  };

  // 保存任务模板
  const handleSaveTaskTemplate = async () => {
    try {
      const taskTemplateBeingEdited = taskStore.getTaskTemplateBeingEdited;
      if (!taskTemplateBeingEdited) {
        showSnackbar('没有正在编辑的任务模板', 'error');
        return;
      }
      
      let result;
      if (isEditMode.value && taskTemplateBeingEdited.id) {
        // 更新现有模板 - 使用深度序列化确保数据可传输
        const templateDto = JSON.parse(JSON.stringify(taskTemplateBeingEdited.toDTO()));
        result = await getTaskService().updateTaskTemplate(templateDto);
      } else {
        // 创建新模板 - 使用深度序列化确保数据可传输
        const templateDto = JSON.parse(JSON.stringify(taskTemplateBeingEdited.toDTO()));
        result = await getTaskService().createTaskTemplate(templateDto);
      }

      if (result.success && result.template) {
        showEditTaskTemplateDialog.value = false;
        isEditMode.value = false;
        
        const action = isEditMode.value ? '更新' : '创建';
        showSnackbar(
          `任务模板 "${result.template.title}" ${action}成功`,
          'success'
        );
      } else {
        showSnackbar(
          result.message || '保存任务模板失败',
          'error'
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showSnackbar(
        `保存任务模板时发生错误: ${errorMessage}`,
        'error'
      );
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
      const result = await getTaskService().deleteTaskTemplate(template.id);
      
      if (result.success) {
        showSnackbar(result.message || '删除任务模板成功', 'success', 5000);
      } else {
        showSnackbar(result.message || '删除任务模板失败', 'error', 6000);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showSnackbar(`删除任务模板失败: ${errorMessage}`, 'error', 6000);
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
        showSnackbar(
          `成功删除任务实例`,
          'success',
          4000
        );
      } else {
        showSnackbar(result.message || '删除任务实例失败', 'error', 6000);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showSnackbar(`删除任务实例失败: ${errorMessage}`, 'error', 6000);
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
        showSnackbar(`任务模板已暂停`, 'success', 4000);
      } else {
        showSnackbar(result.message || `暂停任务模板失败`, 'error', 6000);
      }
      
      return result.success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showSnackbar(`暂停任务模板失败: ${errorMessage}`, 'error', 6000);
      return false;
    }
  }

  const handleResumeTaskTemplate = async (templateId: string) => {
    try {
      const result = await getTaskService().resumeTaskTemplate(templateId);
      
      if (result.success) {
        showSnackbar(`任务模板已恢复`, 'success', 4000);
      } else {
        showSnackbar(result.message || `恢复任务模板失败`, 'error', 6000);
      }
      
      return result.success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showSnackbar(`恢复任务模板失败: ${errorMessage}`, 'error', 6000);
      return false;
    }
  }

  const handleCompleteTaskInstance = async (taskId: string) => {
    try {
      const result = await getTaskService().completeTaskInstance(taskId);
      
      if (result.success) {
        showSnackbar(
          `任务实例已完成`,
          'success',
          4000
        );
      } else {
        showSnackbar(result.message || '完成任务实例失败', 'error', 6000);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showSnackbar(`完成任务实例失败: ${errorMessage}`, 'error', 6000);
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
        showSnackbar(
          `任务实例已撤销完成`,
          'success',
          4000
        );
      } else {
        showSnackbar(result.message || '撤销完成任务实例失败', 'error', 6000);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showSnackbar(`撤销完成任务实例失败: ${errorMessage}`, 'error', 6000);
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
      showSnackbar(
        `获取元模板失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'error'
      );
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
      showSnackbar(
        `获取任务模板失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'error'
      );
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
      showSnackbar(
        `获取今日任务失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'error'
      );
      return [];
    }
  };

  // 创建任务实例（从模板创建）
  const createTaskInstanceFromTemplate = async (_templateId: string, _scheduleDate?: Date) => {
    try {
      showSnackbar('暂不支持直接创建任务实例，请联系开发者完善此功能', 'warning');
      return null;
    } catch (error) {
      console.error('创建任务实例失败:', error);
      showSnackbar(
        `创建任务实例失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'error'
      );
      return null;
    }
  };

  // 批量完成任务
  const batchCompleteTaskInstances = async (taskIds: string[]) => {
    try {
      const results = await Promise.all(
        taskIds.map(id => getTaskService().completeTaskInstance(id))
      );
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;
      
      if (failCount === 0) {
        showSnackbar(
          `成功完成 ${successCount} 个任务`,
          'success'
        );
      } else {
        showSnackbar(
          `完成 ${successCount} 个任务，失败 ${failCount} 个`,
          'warning'
        );
      }
      
      return results;
    } catch (error) {
      console.error('批量完成任务失败:', error);
      showSnackbar(
        `批量操作失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'error'
      );
      return [];
    }
  };

  // 批量删除任务实例
  const batchDeleteTaskInstances = async (taskIds: string[]) => {
    try {
      const results = await Promise.all(
        taskIds.map(id => getTaskService().deleteTaskInstance(id))
      );
      
      const successCount = results.filter((r: any) => r.success).length;
      const failCount = results.length - successCount;
      
      if (failCount === 0) {
        showSnackbar(
          `成功删除 ${successCount} 个任务`,
          'success'
        );
      } else {
        showSnackbar(
          `删除 ${successCount} 个任务，失败 ${failCount} 个`,
          'warning'
        );
      }
      
      return results;
    } catch (error) {
      console.error('批量删除任务失败:', error);
      showSnackbar(
        `批量操作失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'error'
      );
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
      showSnackbar(
        `搜索失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'error'
      );
      return [];
    }
  };

  return {
    // Snackbar配置
    snackbar,
    showSnackbar,
    closeSnackbar,
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
