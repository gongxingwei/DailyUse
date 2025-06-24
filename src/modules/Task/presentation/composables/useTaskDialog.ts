import { ref } from "vue";
import { TaskMetaTemplateFactory } from "@/modules/Task/domain/utils/taskMetaTemplateFactory";
import { TaskApplicationService } from "../../application/services/taskApplicationService";
import { useTaskStore } from "../stores/taskStore";

const taskApplicationService = new TaskApplicationService();

interface SnackbarConfig {
  show: boolean;
  message: string;
  color: 'success' | 'error' | 'warning' | 'info';
  timeout: number;
}
export function useTaskDialog() {
  const taskStore = useTaskStore();
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
  const handleTemplateTypeSelected = async (templateType: string) => {
    showTemplateSelectionDialog.value = false;

    // 根据模板类型创建预配置的模板，使用 TaskMetaTemplateFactory
    let metaTemplate;
    switch (templateType) {
      case 'habit':
        metaTemplate = TaskMetaTemplateFactory.createHabit();
        break;
      case 'event':
        metaTemplate = TaskMetaTemplateFactory.createEvent();
        break;
      case 'deadline':
        metaTemplate = TaskMetaTemplateFactory.createDeadline();
        break;
      case 'meeting':
        metaTemplate = TaskMetaTemplateFactory.createMeeting();
        break;
      default:
        metaTemplate = TaskMetaTemplateFactory.createEmpty();
    }

    // 从 MetaTemplate 创建 TaskTemplate 实例
    const template = await taskApplicationService.createTaskTemplateFromMeta(
      metaTemplate.id,
      {
        title: metaTemplate.name,
        timeConfig: metaTemplate.defaultTimeConfig,
        reminderConfig: metaTemplate.defaultReminderConfig,
        description: metaTemplate.description,
        category: metaTemplate.defaultMetadata.category,
        tags: metaTemplate.defaultMetadata.tags,
        priority: metaTemplate.defaultMetadata.priority,
        estimatedDuration: metaTemplate.defaultMetadata.estimatedDuration,
      }
    );
    taskStore.updateTaskTemplateBeingEdited(template);
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
  try {
    // ✅ 使用专门的方法获取可编辑副本
    const originTemplate = await taskApplicationService.getTaskTemplate(templateId);
    if (!originTemplate) {
      showSnackbar('未找到指定的任务模板', 'error');
      return;
    }
    const template = originTemplate.clone();

    if (template) {
      currentTemplate.value = template;
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
        currentTemplate.value = null;
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
    currentTemplate.value = null;
    isEditMode.value = false;
  };

  // 删除任务模板
  const handleDeleteTaskTemplate = async (templateId: string) => {
    try {
      const result = await taskApplicationService.deleteTaskTemplate(templateId);
      
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
