import { getTaskDomainApplicationService } from "../../application/services/taskDomainApplicationService";
import { useNotification } from "./useNotification";
import type { TaskTemplate } from "../../domain/aggregates/taskTemplate";

/**
 * 任务模板管理 Composable
 * 专门处理任务模板的 CRUD 操作
 */
export function useTaskTemplate() {
  const { showSuccess, showError } = useNotification();
  
  // 获取任务服务实例
  const getTaskService = () => getTaskDomainApplicationService();

  // 获取所有任务模板
  const getTaskTemplates = async () => {
    try {
      const templates = await getTaskService().getAllTaskTemplates();
      return templates;
    } catch (error) {
      console.error('获取任务模板失败:', error);
      showError(
        `获取任务模板失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
      return [];
    }
  };

  // 根据 ID 获取任务模板
  const getTaskTemplate = async (templateId: string) => {
    if (!templateId) {
      showError('模板 ID 不能为空');
      return null;
    }

    try {
      const template = await getTaskService().getTaskTemplate(templateId);
      if (!template) {
        showError(`未找到 ID 为 ${templateId} 的任务模板`);
        return null;
      }
      return template;
    } catch (error) {
      console.error('获取任务模板失败:', error);
      showError(
        `获取任务模板失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
      return null;
    }
  };

  // 创建任务模板
  const createTaskTemplate = async (templateData: any) => {
    if (!templateData || !templateData.title) {
      showError('模板数据不完整，至少需要包含标题');
      return { success: false };
    }

    try {
      const result = await getTaskService().createTaskTemplate(templateData);
      
      if (result.success) {
        showSuccess(`任务模板 "${templateData.title}" 创建成功`);
        return { success: true, data: result.data as TaskTemplate };
      } else {
        showError(result.message || '创建任务模板失败');
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('创建任务模板失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showError(`创建任务模板失败: ${errorMessage}`);
      return { success: false, message: errorMessage };
    }
  };

  // 更新任务模板
  const updateTaskTemplate = async (templateData: any) => {
    if (!templateData || !templateData.uuid) {
      showError('模板数据不完整，缺少 ID');
      return { success: false };
    }

    try {
      const result = await getTaskService().updateTaskTemplate(templateData);
      
      if (result.success) {
        showSuccess(`任务模板 "${templateData.title}" 更新成功`);
        return { success: true, data: result.data as TaskTemplate };
      } else {
        showError(result.message || '更新任务模板失败');
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('更新任务模板失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showError(`更新任务模板失败: ${errorMessage}`);
      return { success: false, message: errorMessage };
    }
  };

  // 删除任务模板
  const deleteTaskTemplate = async (template: TaskTemplate) => {
    if (!template || !template.uuid) {
      showError('模板信息不完整');
      return { success: false };
    }

    try {
      const result = await getTaskService().deleteTaskTemplate(template.uuid);
      
      if (result.success) {
        showSuccess(`任务模板 "${template.title}" 删除成功`);
        return { success: true };
      } else {
        showError(result.message || '删除任务模板失败');
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('删除任务模板失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showError(`删除任务模板失败: ${errorMessage}`);
      return { success: false, message: errorMessage };
    }
  };

  // 从元模板创建任务模板
  const createFromMetaTemplate = async (
    metaTemplateId: string,
    title: string,
    description?: string
  ) => {
    if (!metaTemplateId || !title) {
      showError('元模板 ID 和标题不能为空');
      return null;
    }

    try {
      const newTaskTemplate = await getTaskService().createTaskTemplateFromMetaTemplate(
        metaTemplateId,
        title,
        { description }
      );

      showSuccess(`从元模板创建任务模板 "${title}" 成功`);
      return newTaskTemplate;
    } catch (error) {
      console.error('从元模板创建任务模板失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showError(`从元模板创建任务模板失败: ${errorMessage}`);
      return null;
    }
  };

  return {
    getTaskTemplates,
    getTaskTemplate,
    createTaskTemplate,
    updateTaskTemplate,
    deleteTaskTemplate,
    createFromMetaTemplate
  };
}
