import type { TResponse } from "@/shared/types/response";
import type { IReminderTemplate, IReminderTemplateGroup } from "@common/modules/reminder";
import { ReminderTemplate } from "../../domain/aggregates/reminderTemplate";
import { ReminderTemplateGroup } from "../../domain/aggregates/reminderTemplateGroup";
import { reminderContainer } from "../../infrastructure/di/reminderContainer";
import type { IReminderTemplateRepository } from "../../domain/repositories/iReminderTemplateRepository";
import type { IReminderTemplateGroupRepository } from "../../domain/repositories/iReminderTemplateGroupRepository";

/**
 * 主进程提醒模板应用服务
 * 处理提醒模板相关的业务逻辑和数据库操作
 */
export class MainReminderApplicationService {
  private reminderRepository: IReminderTemplateRepository;
  private reminderGroupRepository: IReminderTemplateGroupRepository;

  constructor(
    reminderRepository?: IReminderTemplateRepository,
    reminderGroupRepository?: IReminderTemplateGroupRepository
  ) {
    this.reminderRepository = reminderRepository || reminderContainer.getReminderTemplateRepository();
    this.reminderGroupRepository = reminderGroupRepository || reminderContainer.getReminderTemplateGroupRepository();
  }

  // ========== 提醒组管理 ========== 

  /**
   * 创建提醒组
   */
  async createReminderGroup(accountUuid: string, group: ReminderTemplateGroup): Promise<TResponse<IReminderTemplateGroup>> {
    try {
      const result = await this.reminderGroupRepository.create(accountUuid, group);
      if (!result) {
        return {
          success: false,
          message: "创建提醒组失败",
        };
      }
      return {
        success: true,
        message: "提醒组创建成功",
        data: group.toDTO(),
      };
    } catch (error) {
      console.error("[主进程] 创建提醒组失败:", error);
      return {
        success: false,
        message: `创建提醒组失败: ${error instanceof Error ? error.message : "未知错误"}`,
      };
    }
  }

  /**
   * 获取所有提醒组
   */
  async getAllReminderGroups(accountUuid: string): Promise<TResponse<IReminderTemplateGroup[]>> {
    try {
      const groups = await this.reminderGroupRepository.getAll(accountUuid);
      return {
        success: true,
        message: "获取提醒组成功",
        data: groups.map(g => g.toDTO()),
      };
    } catch (error) {
      console.error("[主进程] 获取提醒组失败:", error);
      return {
        success: false,
        message: `获取提醒组失败: ${error instanceof Error ? error.message : "未知错误"}`,
      };
    }
  }

  /**
   * 根据ID获取提醒组
   */
  async getReminderGroupById(accountUuid: string, uuid: string): Promise<TResponse<IReminderTemplateGroup>> {
    try {
      const group = await this.reminderGroupRepository.getById(accountUuid, uuid);
      if (!group) {
        return {
          success: false,
          message: `提醒组不存在: ${uuid}`,
        };
      }
      return {
        success: true,
        message: "获取提醒组成功",
        data: group.toDTO(),
      };
    } catch (error) {
      console.error("[主进程] 获取提醒组失败:", error);
      return {
        success: false,
        message: `获取提醒组失败: ${error instanceof Error ? error.message : "未知错误"}`,
      };
    }
  }

  /**
   * 更新提醒组
   */
  async updateReminderGroup(accountUuid: string, groupData: IReminderTemplateGroup): Promise<TResponse<IReminderTemplateGroup>> {
    try {
      const existing = await this.reminderGroupRepository.getById(accountUuid, groupData.uuid);
      if (!existing) {
        return {
          success: false,
          message: `提醒组不存在: ${groupData.uuid}`,
        };
      }
      const group = ReminderTemplateGroup.fromDTO(groupData);
      const result = await this.reminderGroupRepository.update(accountUuid, group);
      if (!result) {
        return {
          success: false,
          message: "更新提醒组失败",
        };
      }
      return {
        success: true,
        message: "提醒组更新成功",
        data: group.toDTO(),
      };
    } catch (error) {
      console.error("[主进程] 更新提醒组失败:", error);
      return {
        success: false,
        message: `更新提醒组失败: ${error instanceof Error ? error.message : "未知错误"}`,
      };
    }
  }

  /**
   * 删除提醒组
   */
  async deleteReminderGroup(accountUuid: string, uuid: string): Promise<TResponse<void>> {
    try {
      const existing = await this.reminderGroupRepository.getById(accountUuid, uuid);
      if (!existing) {
        return {
          success: false,
          message: `提醒组不存在: ${uuid}`,
        };
      }
      await this.reminderGroupRepository.delete(accountUuid, uuid);
      return {
        success: true,
        message: "提醒组删除成功",
      };
    } catch (error) {
      console.error("[主进程] 删除提醒组失败:", error);
      return {
        success: false,
        message: `删除提醒组失败: ${error instanceof Error ? error.message : "未知错误"}`,
      };
    }
  }

  // ========== 提醒模板管理 ========== 

  /**
   * 创建提醒模板
   */
  async createReminderTemplate(accountUuid: string, template: ReminderTemplate): Promise<TResponse<IReminderTemplate>> {
    try {
      const result = await this.reminderRepository.create(accountUuid, template);
      if (!result) {
        return {
          success: false,
          message: "创建提醒模板失败",
        };
      }
      return {
        success: true,
        message: "提醒模板创建成功",
        data: template.toDTO(),
      };
    } catch (error) {
      console.error("[主进程] 创建提醒模板失败:", error);
      return {
        success: false,
        message: `创建提醒模板失败: ${error instanceof Error ? error.message : "未知错误"}`,
      };
    }
  }

  /**
   * 获取所有提醒模板
   */
  async getAllReminderTemplates(accountUuid: string): Promise<TResponse<IReminderTemplate[]>> {
    try {
      const templates = await this.reminderRepository.getAll(accountUuid);
      return {
        success: true,
        message: "获取提醒模板成功",
        data: templates.map(t => t.toDTO()),
      };
    } catch (error) {
      console.error("[主进程] 获取提醒模板失败:", error);
      return {
        success: false,
        message: `获取提醒模板失败: ${error instanceof Error ? error.message : "未知错误"}`,
      };
    }
  }

  /**
   * 根据ID获取提醒模板
   */
  async getReminderTemplateById(accountUuid: string, uuid: string): Promise<TResponse<IReminderTemplate>> {
    try {
      const template = await this.reminderRepository.getById(accountUuid, uuid);
      if (!template) {
        return {
          success: false,
          message: `提醒模板不存在: ${uuid}`,
        };
      }
      return {
        success: true,
        message: "获取提醒模板成功",
        data: template.toDTO(),
      };
    } catch (error) {
      console.error("[主进程] 获取提醒模板失败:", error);
      return {
        success: false,
        message: `获取提醒模板失败: ${error instanceof Error ? error.message : "未知错误"}`,
      };
    }
  }

  /**
   * 更新提醒模板
   */
  async updateReminderTemplate(accountUuid: string, templateData: IReminderTemplate): Promise<TResponse<IReminderTemplate>> {
    try {
      const existing = await this.reminderRepository.getById(accountUuid, templateData.uuid);
      if (!existing) {
        return {
          success: false,
          message: `提醒模板不存在: ${templateData.uuid}`,
        };
      }
      const template = ReminderTemplate.fromDTO(templateData);
      const result = await this.reminderRepository.update(accountUuid, template);
      if (!result) {
        return {
          success: false,
          message: "更新提醒模板失败",
        };
      }
      return {
        success: true,
        message: "提醒模板更新成功",
        data: template.toDTO(),
      };
    } catch (error) {
      console.error("[主进程] 更新提醒模板失败:", error);
      return {
        success: false,
        message: `更新提醒模板失败: ${error instanceof Error ? error.message : "未知错误"}`,
      };
    }
  }

  /**
   * 删除提醒模板
   */
  async deleteReminderTemplate(accountUuid: string, uuid: string): Promise<TResponse<void>> {
    try {
      const existing = await this.reminderRepository.getById(accountUuid, uuid);
      if (!existing) {
        return {
          success: false,
          message: `提醒模板不存在: ${uuid}`,
        };
      }
      await this.reminderRepository.delete(accountUuid, uuid);
      return {
        success: true,
        message: "提醒模板删除成功",
      };
    } catch (error) {
      console.error("[主进程] 删除提醒模板失败:", error);
      return {
        success: false,
        message: `删除提醒模板失败: ${error instanceof Error ? error.message : "未知错误"}`,
      };
    }
  }
}