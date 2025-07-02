import { ref } from "vue";
import { TaskApplicationService } from "../../application/services/taskApplicationService";
import { useTaskStore } from "../stores/taskStore";
const taskApplicationService = new TaskApplicationService();

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
      // 直接使用传入的 metaTemplateId 创建 TaskTemplate
      const template = await taskApplicationService.createTaskTemplateFromMeta(
        metaTemplateId
      );
      
      taskStore.updateTaskTemplateBeingEdited(template);
      isEditMode.value = false;

      // 显示编辑对话框
      showEditTaskTemplateDialog.value = true;
    } catch (error) {
      console.error('创建任务模板失败:', error);
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
    // ✅ 使用专门的方法获取可编辑副本
    const originTemplate = await taskApplicationService.getTaskTemplate(templateId);
    if (!originTemplate) {
      showSnackbar('未找到指定的任务模板', 'error');
      return;
    }
    const template = originTemplate.clone();

    if (template) {
      taskStore.updateTaskTemplateBeingEdited(template);
      isEditMode.value = true;
      showEditTaskTemplateDialog.value = true;
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
      const response = await taskApplicationService.saveTaskTemplate(taskTemplateBeingEdited);

      if (response.success && response.data) {
        showEditTaskTemplateDialog.value = false;
        isEditMode.value = false;
        showSnackbar(
          `任务模板 "${response.data.title}" 保存成功`,
          'success',
          3000
        );
      } else {
        showSnackbar(
          `保存失败: ${response.message}`,
          'error',
          4000
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showSnackbar(
        `保存任务模板时发生错误: ${errorMessage}`,
        'error',
        6000
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
      const result = await taskApplicationService.deleteTaskTemplate(template);
      
      if (result.success) {
        showSnackbar(result.message, 'success', 5000);
      } else {
        showSnackbar(result.message, 'error', 6000);
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
      const result = await taskApplicationService.deleteTaskInstance(taskId);
      
      if (result.success && result.data) {
        showSnackbar(
          `成功删除任务实例 "${result.data}"`,
          'success',
          4000
        );
      } else {
        showSnackbar(result.message, 'error', 6000);
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
      const result = await taskApplicationService.pauseTemplate(templateId);
      
      if (result) {
        showSnackbar(`任务模板已暂停`, 'success', 4000);
      } else {
        showSnackbar(`暂停任务模板失败`, 'error', 6000);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showSnackbar(`暂停任务模板失败: ${errorMessage}`, 'error', 6000);
      return false;
    }
  }

  const handleResumeTaskTemplate = async (templateId: string) => {
    try {
      const result = await taskApplicationService.resumeTemplate(templateId);
      
      if (result) {
        showSnackbar(`任务模板已恢复`, 'success', 4000);
      } else {
        showSnackbar(`恢复任务模板失败`, 'error', 6000);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showSnackbar(`恢复任务模板失败: ${errorMessage}`, 'error', 6000);
      return false;
    }
  }

  const handleCompleteTaskInstance = async (taskId: string) => {
    try {
      const result = await taskApplicationService.completeTask(taskId);
      
      if (result.success && result.data) {
        showSnackbar(
          `任务实例 "${result.data}" 已完成`,
          'success',
          4000
        );
      } else {
        showSnackbar(result.message, 'error', 6000);
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
      const result = await taskApplicationService.undoCompleteTask(taskId);
      
      if (result.success && result.data) {
        showSnackbar(
          `任务实例 "${result.data}" 已撤销完成`,
          'success',
          4000
        );
      } else {
        showSnackbar(result.message, 'error', 6000);
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
    handleUndoCompleteTaskInstance
  };
}
