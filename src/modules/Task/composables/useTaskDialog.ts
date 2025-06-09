import { ref } from "vue";
import { TaskTemplateFactory } from "../utils/taskTemplateFactory";
import { taskTemplateService } from "../services/taskTemplateService";
import type { TaskTemplate } from "../types/task";
import { useTaskStore } from "../stores/taskStore";
import { taskInstanceService } from "../services/taskInstanceService";
import { taskReminderService } from "../services/taskReminderService";
import { taskDomainService } from "../services/taskDomainService";
import { TimeUtils } from "../utils/timeUtils";

interface SnackbarConfig {
  show: boolean;
  message: string;
  color: 'success' | 'error' | 'warning' | 'info';
  timeout: number;
}
export function useTaskDialog() {
  const showEditTaskTemplateDialog = ref(false);
  const showTemplateSelectionDialog = ref(false);
  const currentTemplate = ref<TaskTemplate | null>(null);
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

  const handleTemplateTypeSelected = (templateType: string) => {
    showTemplateSelectionDialog.value = false;

    // 根据模板类型创建预配置的模板
    const template = TaskTemplateFactory.createByType(templateType);
    currentTemplate.value = template;
    isEditMode.value = false;

    // 显示编辑对话框
    showEditTaskTemplateDialog.value = true;
  };

  // 取消模板选择
  const cancelTemplateSelection = () => {
    showTemplateSelectionDialog.value = false;
  };

  // 开始编辑任务模板
  const startEditTaskTemplate = async (templateId: string) => {
    const taskStore = useTaskStore();
    const template = taskStore.getTaskTemplateById(templateId);

    if (template) {
      currentTemplate.value = { ...template }; // 创建副本
      isEditMode.value = true;
      showEditTaskTemplateDialog.value = true;
    }
  };

  // 保存任务模板
  const handleSaveTaskTemplate = async (template: TaskTemplate) => {
    try {
      let result;

      if (isEditMode.value) {
        // 更新模式
        result = await taskTemplateService.updateTaskTemplate(template);
        if (result.success) {
          await handleTemplateUpdate(template);
          showSnackbar(
            `任务模板 "${template.title}" 更新成功！`,
            'success'
          );
        }
      } else {
        // 添加模式
        result = await taskTemplateService.addTaskTemplate(template);
        if (result.success) {
          await handleNewTemplateCreated(template);
          showSnackbar(
            `任务模板 "${template.title}" 创建成功！`,
            'success'
          );
        }
      }

      if (result.success) {
        showEditTaskTemplateDialog.value = false;
        currentTemplate.value = null;
        isEditMode.value = false;
      } else {
        showSnackbar(
          `保存失败: ${result.message}`,
          'error',
          6000
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


  const handleNewTemplateCreated = async (template: TaskTemplate) => {
    try {
      // 生成未来30天的任务实例
      const instances = await taskInstanceService.generateAndSaveInstances(template, 30);
      
      // 为每个实例设置提醒
      for (const instance of instances) {
        if (template.timeConfig.reminder.enabled) {
          await taskReminderService.createTaskReminders(instance, template);
        }
      }
      
      console.log(`为模板 "${template.title}" 生成了 ${instances.length} 个任务实例`);
    } catch (error) {
      console.error("生成任务实例失败:", error);
    }
  };

  // 处理模板更新后的实例重新生成
  const handleTemplateUpdate = async (template: TaskTemplate) => {
    try {
      const taskStore = useTaskStore();
      
      // 取消现有未完成实例的提醒
      const existingInstances = taskStore.taskInstances.filter(
        instance => instance.templateId === template.id && 
                   ['pending', 'inProgress'].includes(instance.status)
      );
      
      for (const instance of existingInstances) {
        await taskReminderService.cancelTaskInstanceReminders(instance.id);
      }
      
      // 重新生成未来的实例
      const now = TimeUtils.now();
      const futureInstances = existingInstances.filter(
        instance => instance.scheduledTime.timestamp > now.timestamp
      );
      
      // 移除未来的旧实例
      futureInstances.forEach(instance => {
        const index = taskStore.taskInstances.findIndex(t => t.id === instance.id);
        if (index !== -1) {
          taskStore.taskInstances.splice(index, 1);
        }
      });
      
      // 生成新实例
      await handleNewTemplateCreated(template);
      
    } catch (error) {
      console.error("更新任务实例失败:", error);
    }
  };

  // 取消编辑
  const cancelEditTaskTemplate = () => {
    showEditTaskTemplateDialog.value = false;
    currentTemplate.value = null;
    isEditMode.value = false;
  };

  // 删除任务模板
  const handleDeleteTaskTemplate = async (templateId: string) => {
    try {
      const result = await taskDomainService.deleteTask(templateId);
      
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
      const result = await taskDomainService.deleteTaskInstance(taskId);
      
      if (result.success && result.data) {
        showSnackbar(
          `成功删除任务实例 "${result.data.taskTitle}"`,
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

  return {
    // Snackbar配置
    snackbar,
    showSnackbar,
    closeSnackbar,
    // 状态
    showEditTaskTemplateDialog,
    showTemplateSelectionDialog,
    currentTemplate,
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
  };
}
