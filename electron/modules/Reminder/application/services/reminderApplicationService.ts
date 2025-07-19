import type { TResponse } from "@/shared/types/response";
import type { IReminderTemplate, IReminderTemplateGroup } from "../../domain/types";
import { ReminderTemplate } from "../../domain/aggregates/reminderTemplate";
import { ReminderTemplateGroup } from "../../domain/aggregates/reminderTemplateGroup";
import { ReminderContainer } from "../../infrastructure/di/reminderContainer";
import type { IReminderTemplateRepository } from "../../domain/repositories/iReminderTemplateRepository";
import type { IReminderTemplateGroupRepository } from "../../domain/repositories/iReminderTemplateGroupRepository";
import { reminderContainer } from "../../infrastructure/di/reminderContainer";
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

  /**
   * 获取 ReminderTemplate 仓库实例
   */
  private async getRepository(): Promise<IReminderTemplateRepository> {
    if (!this.reminderRepository) {
      const container = ReminderContainer.getInstance();
      this.reminderRepository = await container.getReminderTemplateRepository();
    }
    return this.reminderRepository;
  }

  /**
   * 获取 ReminderTemplateGroup 仓库实例
   */
  private async getGroupRepository(): Promise<IReminderTemplateGroupRepository> {
    if (!this.reminderGroupRepository) {
      const container = ReminderContainer.getInstance();
      this.reminderGroupRepository = await container.getReminderTemplateGroupRepository();
    }
    return this.reminderGroupRepository;
  }

  // ========== 提醒组管理 ========== 

  /**
   * 创建提醒组
   */
  async createReminderGroup(group: ReminderTemplateGroup): Promise<TResponse<IReminderTemplateGroup>> {
    try {
      const repository = await this.getGroupRepository();
      const result = await repository.create(group);
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
  async getAllReminderGroups(): Promise<TResponse<IReminderTemplateGroup[]>> {
    try {
      const repository = await this.getGroupRepository();
      const groups = await repository.getAll();
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
  async getReminderGroupById(id: string): Promise<TResponse<IReminderTemplateGroup>> {
    try {
      const repository = await this.getGroupRepository();
      const group = await repository.getById(id);
      if (!group) {
        return {
          success: false,
          message: `提醒组不存在: ${id}`,
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
  async updateReminderGroup(groupData: IReminderTemplateGroup): Promise<TResponse<IReminderTemplateGroup>> {
    try {
      const repository = await this.getGroupRepository();
      const existing = await repository.getById(groupData.id);
      if (!existing) {
        return {
          success: false,
          message: `提醒组不存在: ${groupData.id}`,
        };
      }
      const group = ReminderTemplateGroup.fromDTO(groupData);
      const result = await repository.update(group);
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
  async deleteReminderGroup(id: string): Promise<TResponse<void>> {
    try {
      const repository = await this.getGroupRepository();
      const existing = await repository.getById(id);
      if (!existing) {
        return {
          success: false,
          message: `提醒组不存在: ${id}`,
        };
      }
      await repository.delete(id);
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

  /**
   * 设置当前账号 UUID
   */
  async setCurrentAccountUuid(accountUuid: string): Promise<void> {
    const container = ReminderContainer.getInstance();
    await container.setCurrentAccountUuid(accountUuid);
  }

  // ========== 提醒模板管理 ========== 

  /**
   * 创建提醒模板
   */
  async createReminderTemplate(template: ReminderTemplate): Promise<TResponse<IReminderTemplate>> {
    try {
      const repository = await this.getRepository();
      const result = await repository.create(template);
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
  async getAllReminderTemplates(): Promise<TResponse<IReminderTemplate[]>> {
    try {
      const repository = await this.getRepository();
      const templates = await repository.getAll();
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
  async getReminderTemplateById(id: string): Promise<TResponse<IReminderTemplate>> {
    try {
      const repository = await this.getRepository();
      const template = await repository.getById(id);
      if (!template) {
        return {
          success: false,
          message: `提醒模板不存在: ${id}`,
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
  async updateReminderTemplate(templateData: IReminderTemplate): Promise<TResponse<IReminderTemplate>> {
    try {
      const repository = await this.getRepository();
      const existing = await repository.getById(templateData.id);
      if (!existing) {
        return {
          success: false,
          message: `提醒模板不存在: ${templateData.id}`,
        };
      }
      const template = ReminderTemplate.fromDTO(templateData);
      const result = await repository.update(template);
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
  async deleteReminderTemplate(id: string): Promise<TResponse<void>> {
    try {
      const repository = await this.getRepository();
      const existing = await repository.getById(id);
      if (!existing) {
        return {
          success: false,
          message: `提醒模板不存在: ${id}`,
        };
      }
      await repository.delete(id);
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