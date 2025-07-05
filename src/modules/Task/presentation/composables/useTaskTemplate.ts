import { taskDomainApplicationService } from "../../application/services/taskDomainApplicationService";
import { useNotification } from "./useNotification";
import type { TaskTemplate } from "../../domain/entities/taskTemplate";

/**
 * 任务模板管理 Composable
 * 专门处理任务模板的 CRUD 操作
 */
export function useTaskTemplate() {
  const { showSuccess, showError, showInfo } = useNotification();
  
  // 获取所有任务模板
  const getTaskTemplates = async () => {
    try {
      const templates = await taskDomainApplicationService.getAllTaskTemplates();
      return templates;
    } catch (error) {
      console.error('获取任务模板失败:', error);
      showError(
        `获取任务模板失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
      return [];
    }
  };

  // 根据ID获取任务模板
  const getTaskTemplate = async (templateId: string) => {
    try {
      const template = await taskDomainApplicationService.getTaskTemplate(templateId);
      if (template) {
        showInfo(`获取任务模板 "${template.title}" 成功`);
        return template;
      } else {
        showError('未找到指定的任务模板');
        return null;
      }
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
    try {
      const result = await taskDomainApplicationService.createTaskTemplate(templateData);
      
      if (result.success && result.template) {
        showSuccess(`任务模板 "${result.template.title}" 创建成功`);
        return result.template;
      } else {
        showError(result.message || '创建任务模板失败');
        return null;
      }
    } catch (error) {
      console.error('创建任务模板失败:', error);
      showError(
        `创建任务模板失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
      return null;
    }
  };

  // 更新任务模板
  const updateTaskTemplate = async (templateData: any) => {
    try {
      const result = await taskDomainApplicationService.updateTaskTemplate(templateData);
      
      if (result.success && result.template) {
        showSuccess(`任务模板 "${result.template.title}" 更新成功`);
        return result.template;
      } else {
        showError(result.message || '更新任务模板失败');
        return null;
      }
    } catch (error) {
      console.error('更新任务模板失败:', error);
      showError(
        `更新任务模板失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
      return null;
    }
  };

  // 删除任务模板
  const deleteTaskTemplate = async (template: TaskTemplate) => {
    try {
      const result = await taskDomainApplicationService.deleteTaskTemplate(template.id);
      
      if (result.success) {
        showSuccess(`任务模板 "${template.title}" 删除成功`);
        return true;
      } else {
        showError(result.message || '删除任务模板失败');
        return false;
      }
    } catch (error) {
      console.error('删除任务模板失败:', error);
      showError(
        `删除任务模板失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
      return false;
    }
  };

  // 从元模板创建任务模板
  const createTaskTemplateFromMetaTemplate = async (
    metaTemplateId: string,
    title: string = '新任务模板',
    options?: any
  ) => {
    try {
      const newTaskTemplate = await taskDomainApplicationService.createTaskTemplateFromMetaTemplate(
        metaTemplateId,
        title,
        options || {
          description: '基于元模板创建的任务',
          priority: 3,
          tags: ['新建'],
        }
      );
      
      showSuccess(`成功从元模板创建任务模板 "${newTaskTemplate.title}"`);
      return newTaskTemplate;
    } catch (error) {
      console.error('从元模板创建任务模板失败:', error);
      showError(
        `创建任务模板失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
      return null;
    }
  };

  return {
    getTaskTemplates,
    getTaskTemplate,
    createTaskTemplate,
    updateTaskTemplate,
    deleteTaskTemplate,
    createTaskTemplateFromMetaTemplate
  };
}
