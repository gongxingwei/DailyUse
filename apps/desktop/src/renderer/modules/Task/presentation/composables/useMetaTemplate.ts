import { getTaskDomainApplicationService } from '../../application/services/taskDomainApplicationService';
import { useNotification } from './useNotification';

/**
 * 元模板管理 Composable
 * 专门处理元模板的获取和查询操作
 */
export function useMetaTemplate() {
  const { showError } = useNotification();

  // 获取所有元模板
  const getMetaTemplates = async () => {
    try {
      const metaTemplates = await getTaskDomainApplicationService().getAllMetaTemplates();
      return metaTemplates;
    } catch (error) {
      console.error('获取元模板失败:', error);
      showError(`获取元模板失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return [];
    }
  };

  // 根据ID获取元模板
  const getMetaTemplate = async (uuid: string) => {
    try {
      const metaTemplate = await getTaskDomainApplicationService().getMetaTemplate(uuid);
      return metaTemplate;
    } catch (error) {
      console.error('获取元模板失败:', error);
      showError(`获取元模板失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return null;
    }
  };

  return {
    getMetaTemplates,
    getMetaTemplate,
  };
}
