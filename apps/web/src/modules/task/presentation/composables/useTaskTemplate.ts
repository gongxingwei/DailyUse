import { TaskWebApplicationService } from '../../application/services/TaskWebApplicationService';
import { useNotification } from './useNotification';
import type { TaskTemplate } from '@dailyuse/domain-client';

/**
 * 任务模板管理 Composable
 * 专门处理任务模板的 CRUD 操作
 */
export function useTaskTemplate() {
  const { showSuccess, showError } = useNotification();

  // 获取任务服务实例
  const taskService = new TaskWebApplicationService();

  // 获取所有任务模板
  const getTaskTemplates = async () => {
    try {
      const templates = await taskService.getTemplates();
      return templates;
    } catch (error) {
      console.error('获取任务模板失败:', error);
      showError(`获取任务模板失败: ${error instanceof Error ? error.message : '未知错误'}`);
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
      const template = await taskService.getTemplateById(templateId);
      if (!template) {
        showError(`未找到 ID 为 ${templateId} 的任务模板`);
        return null;
      }
      return template;
    } catch (error) {
      console.error('获取任务模板失败:', error);
      showError(`获取任务模板失败: ${error instanceof Error ? error.message : '未知错误'}`);
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
      const result = await taskService.createTemplate(templateData);

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
      const result = await taskService.updateTemplate(templateData.uuid, templateData);

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
      await taskService.deleteTemplate(template.uuid);
      showSuccess(`任务模板 "${template.title}" 删除成功`);
      return { success: true };
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
    description?: string,
  ) => {
    if (!metaTemplateId || !title) {
      showError('元模板 ID 和标题不能为空');
      return null;
    }

    try {
      // TODO: 需要实现从元模板创建的方法
      // const newTaskTemplate = await taskService.createTemplateFromMeta(
      //   metaTemplateId,
      //   title,
      //   { description }
      // );
      throw new Error('从元模板创建功能暂未实现');

      // showSuccess(`从元模板创建任务模板 "${title}" 成功`);
      // return newTaskTemplate;
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
    createFromMetaTemplate,
  };
}
