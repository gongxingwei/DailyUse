import { getReminderDomainApplicationService } from "../../application/services/reminderApplicationService";
// types
import type { IReminderTemplate } from "../../../../../common/modules/reminder/types/reminder";
// composables
import { useSnackbar } from "@/shared/composables/useSnackbar";
// domain aggregates
import { ReminderTemplateGroup } from "../../domain/aggregates/reminderTemplateGroup";
import { ReminderTemplate } from "../../domain/entities/reminderTemplate";

/**
 * useReminderServices
 * 
 * 该组合式函数封装了所有与提醒模板和分组相关的业务操作（增删改查、移动等），
 * 并统一处理消息提示（snackbar），为表现层提供简洁的调用接口。
 * 
 * 主要职责：
 * - 调用应用服务（reminderService）完成业务操作
 * - 统一处理操作结果和异常
 * - 通过 snackbar 反馈操作结果
 */
export function useReminderServices() {
  // 获取领域应用服务实例（负责与主进程通信及本地状态同步）
  const reminderService = getReminderDomainApplicationService();
  // 获取全局 snackbar 相关方法
  const { snackbar, showSnackbar, showError, showSuccess, showInfo } = useSnackbar();

  /**
   * 创建提醒模板
   * @param templateData - 新建的提醒模板实例
   */
  const handleCreateReminderTemplate = async (templateData: ReminderTemplate) => {
    console.log('[userReminderServices] Creating reminder template with data:', templateData);
    try {
      const result = await reminderService.createReminderTemplate(templateData);
      if (result.success && result.data) {
        const name = result.data.template?.name || '（无名称）';
        
        showSuccess(`提醒模板创建成功：${name}`);
      } else {
        showError(`创建提醒模板失败：${result.message}`);
      }
    } catch (error) {
        console.error("Error creating reminder template:", error);
    }
  };

  /**
   * 删除提醒模板
   * @param templateUuid - 要删除的模板 uuid
   */
  const handleDeleteReminderTemplate = async (templateUuid: string) => {
    console.log('[userReminderServices] Deleting reminder template:', templateUuid);
    try {
      const result = await reminderService.deleteReminderTemplate(templateUuid);
      if (result.success) {
        showSuccess(`提醒模板已删除：${templateUuid}`);
      } else {
        showError(`删除提醒模板失败：${result.message}`);
      }
    } catch (error) {
      console.error("Error deleting reminder template:", error);
    }
  };

  /**
   * 更新提醒模板
   * @param templateData - 要更新的提醒模板实例
   */
  const handleUpdateReminderTemplate = async (templateData: ReminderTemplate) => {
    console.log('[userReminderServices] Updating reminder template with data:', templateData);
    try {
      const result = await reminderService.updateReminderTemplate(templateData);
      if (result.success && result.data) {
        showSuccess(`提醒模板更新成功：${result.data.template.name}`);
      } else {
        showError(`更新提醒模板失败：${result.message}`);
      }
    } catch (error) {
      console.error("Error updating reminder template:", error);
    }
  };

  /**
   * 创建提醒分组
   * @param group - 新建的分组实例
   */
  const handleCreateReminderGroup = async (group: ReminderTemplateGroup) => {
    // Logic to create a new reminder group
    console.log('[userReminderServices] Creating reminder group:', group);
    try {
      const result = await reminderService.createReminderGroup(group);
      if (result.success) {
        showSuccess(`提醒分组创建成功：${group.name}`);
      } else {
        showError(`创建提醒分组失败：${result.message}`);
      }
    } catch (error) {
      console.error("Error creating reminder group:", error);
    }
  };

  /**
   * 删除提醒分组
   * @param groupUuid - 要删除的分组 uuid
   */
  const handleDeleteReminderGroup = async (groupUuid: string) => {
    console.log('[userReminderServices] Deleting reminder group:', groupUuid);
    try {
      const result = await reminderService.deleteReminderGroup(groupUuid);
      if (result.success) {
        showSuccess(`提醒分组已删除：${groupUuid}`);
      } else {
        showError(`删除提醒分组失败：${result.message}`);
      }
    } catch (error) {
      console.error("Error deleting reminder group:", error);
    }
  };

  /**
   * 更新提醒分组
   * @param group - 要更新的分组实例
   */
  const handleUpdateReminderGroup = async (group: ReminderTemplateGroup) => {
    // Logic to update an existing reminder group
    console.log('[userReminderServices] Updating reminder group:', group);
    try {
      const result = await reminderService.updateReminderGroup(group);
      if (result.success) {
        showSuccess(`提醒分组更新成功：${group.name}`);
      } else {
        showError(`更新提醒分组失败：${result.message}`);
      }
    } catch (error) {
      console.error("Error updating reminder group:", error);
    }
  };

  /**
   * 移动提醒模板到指定分组
   * @param payload - 包含模板实例和目标分组ID
   */
  const handleMoveTemplateToGroup = async (payload: {template: ReminderTemplate, toGroupId: string}) => {
    console.log('[userReminderServices] Moving template to group:', payload);
    try {
      const result = await reminderService.moveTemplateToGroup(payload.template.uuid, payload.toGroupId);
      if (result.success) {
        showSuccess(`模板已移动到分组：${payload.toGroupId}`);
      } else {
        showError(`移动模板到分组失败：${result.message}`);
      }
    } catch (error) {
      console.error("Error moving template to group:", error);
    }
  }

  /**
   * 设置提醒组启用模式（group/individual）
   * @param groupId string 分组ID
   * @param mode "group" | "individual"
   */
  const handleSetGroupEnableMode = async (groupId: string, mode: "group" | "individual") => {
    console.log('[userReminderServices] Setting group enable mode:', groupId, mode);
    try {
      const result = await reminderService.setGroupEnableMode(groupId, mode);
      if (result.success) {
        showSuccess(`分组启用模式设置成功：${mode}`);
      } else {
        showError(`分组启用模式设置失败：${result.message}`);
      }
    } catch (error) {
      console.error("Error setting group enable mode:", error);
    }
  };

  /**
   * 设置提醒组启用/禁用
   * @param groupId string 分组ID
   * @param enabled boolean 是否启用
   */
  const handleSetGroupEnabled = async (groupId: string, enabled: boolean) => {
    console.log('[userReminderServices] Setting group enabled:', groupId, enabled);
    try {
      const result = await reminderService.setGroupEnabled(groupId, enabled);
      if (result.success) {
        showSuccess(`分组${enabled ? '已启用' : '已禁用'}：${groupId}`);
      } else {
        showError(`分组启用状态设置失败：${result.message}`);
      }
    } catch (error) {
      console.error("Error setting group enabled:", error);
    }
  };

  /**
   * 设置提醒模板启用/禁用
   * @param templateId string 模板ID
   * @param enabled boolean 是否启用
   */
  const handleSetTemplateEnabled = async (templateId: string, enabled: boolean) => {
    console.log('[userReminderServices] Setting template enabled:', templateId, enabled);
    try {
      const result = await reminderService.setTemplateEnabled(templateId, enabled);
      if (result.success) {
        showSuccess(`模板${enabled ? '已启用' : '已禁用'}：${templateId}`);
      } else {
        showError(`模板启用状态设置失败：${result.message}`);
      }
    } catch (error) {
      console.error("Error setting template enabled:", error);
    }
  };

  // 导出所有业务操作和 snackbar
  return {
    snackbar,
    reminderService,
    handleCreateReminderTemplate,
    handleUpdateReminderTemplate,
    handleCreateReminderGroup,
    handleUpdateReminderGroup,
    handleMoveTemplateToGroup,
    handleDeleteReminderTemplate,
    handleDeleteReminderGroup,
    handleSetGroupEnableMode,
    handleSetGroupEnabled,
    handleSetTemplateEnabled,
  };
}