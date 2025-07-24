import type { TResponse } from "@/shared/types/response";
import type {
  IReminderTemplate,
  IReminderTemplateGroup,
} from "@common/modules/reminder";
import { SYSTEM_GROUP_ID } from "@common/modules/reminder/types/reminder";
import { ReminderTemplate } from "../../domain/entities/reminderTemplate";
import {
  ReminderTemplateGroup,
  createSystemGroup,
} from "../../domain/aggregates/reminderTemplateGroup";
import { reminderContainer } from "../../infrastructure/di/reminderContainer";
import type { IReminderTemplateRepository } from "../../domain/repositories/iReminderTemplateRepository";
import type { IReminderTemplateGroupRepository } from "../../domain/repositories/iReminderTemplateGroupRepository";
import { reminderScheduleService } from "./reminderScheduleService";
import { reminderDomainService } from "../../domain/services/reminderDomainService";

/**
 * MainReminderApplicationService
 * @description 主进程提醒模板应用服务，负责处理提醒模板相关的业务逻辑和数据库操作。
 * 
 * 用法示例：
 *   const service = new MainReminderApplicationService();
 *   await service.createReminderGroup(accountUuid, group);
 *   await service.setGroupEnabled(accountUuid, groupUuid, true);
 */
export class MainReminderApplicationService {
  private reminderRepository: IReminderTemplateRepository;
  private reminderGroupRepository: IReminderTemplateGroupRepository;
  private reminderScheduleService = reminderScheduleService;

  /**
   * 构造函数
   * @param reminderRepository 提醒模板仓储（可选，默认使用容器）
   * @param reminderGroupRepository 提醒组仓储（可选，默认使用容器）
   */
  constructor(
    reminderRepository?: IReminderTemplateRepository,
    reminderGroupRepository?: IReminderTemplateGroupRepository
  ) {
    this.reminderRepository =
      reminderRepository || reminderContainer.getReminderTemplateRepository();
    this.reminderGroupRepository =
      reminderGroupRepository ||
      reminderContainer.getReminderTemplateGroupRepository();
  }

  // ========== 初始化相关 ==========

  /**
   * 初始化提醒模块（创建系统分组和默认提醒模板）
   * @param accountUuid 用户账号ID
   * @returns TResponse<void>
   * @example
   * await service.initializeReminderModule(accountUuid);
   * // 返回: { success: true, message: "提醒模块初始化成功" }
   */
  async initializeReminderModule(
    accountUuid: string
  ): Promise<TResponse<void>> {
    try {
      const systemGroup = createSystemGroup();
      await this.reminderGroupRepository.create(accountUuid, systemGroup);
      return {
        success: true,
        message: "提醒模块初始化成功",
      };
    } catch (error) {
      console.error("[主进程] 初始化提醒模块失败:", error);
      return {
        success: false,
        message: `初始化提醒模块失败: ${error instanceof Error ? error.message : "未知错误"}`,
      };
    }
  }

  /**
   * 初始化提醒调度服务（根据分组和模板启用状态，创建提醒任务）
   * @param accountUuid 用户账号ID
   * @returns TResponse<void>
   * @example
   * await service.initializeReminderSchedule(accountUuid);
   * // 返回: { success: true, message: "提醒调度服务初始化成功" }
   */
  async initializeReminderSchedule(
    accountUuid: string
  ): Promise<TResponse<void>> {
    try {
      const groups = await this.reminderGroupRepository.getAll(accountUuid);
      const systemGroup = groups.find((g) => g.uuid === SYSTEM_GROUP_ID);
      const userGroups = groups.filter((g) => g.uuid !== SYSTEM_GROUP_ID);
      if (!systemGroup) {
        return {
          success: false,
          message: "系统分组不存在，请先初始化提醒模块",
        };
      }
      if (!systemGroup.enabled) {
        return {
          success: true,
          message: "系统分组被禁用，提醒调度服务不启动",
        };
      }
      for (const group of userGroups) {
        await this.initializeRemindersInGroup(accountUuid, group.uuid);
      }
      return {
        success: true,
        message: "提醒调度服务初始化成功",
      };
    } catch (error) {
      console.error("[主进程] 初始化提醒调度服务失败:", error);
      return {
        success: false,
        message: `初始化提醒调度服务失败: ${error instanceof Error ? error.message : "未知错误"}`,
      };
    }
  }

  // ========== 提醒组管理 ==========

  /**
   * 创建提醒组
   * @param accountUuid 用户账号ID
   * @param group ReminderTemplateGroup 实体
   * @returns TResponse<IReminderTemplateGroup>
   * @example
   * await service.createReminderGroup(accountUuid, group);
   * // 返回: { success: true, data: groupDTO }
   */
  async createReminderGroup(
    accountUuid: string,
    group: ReminderTemplateGroup
  ): Promise<TResponse<IReminderTemplateGroup>> {
    try {
      const response = await reminderDomainService.createReminderTemplateGroup(
        accountUuid,
        group,
        this.reminderGroupRepository
      );
      if (response.data) {
        return {
          success: true,
          message: "提醒组创建成功",
          data: response.data.toDTO(),
        };
      }
      return response;
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
   * @param accountUuid 用户账号ID
   * @returns TResponse<IReminderTemplateGroup[]>
   * @example
   * await service.getAllReminderGroups(accountUuid);
   * // 返回: { success: true, data: [groupDTO, ...] }
   */
  async getAllReminderGroups(
    accountUuid: string
  ): Promise<TResponse<IReminderTemplateGroup[]>> {
    try {
      const groups = await this.reminderGroupRepository.getAll(accountUuid);
      return {
        success: true,
        message: "获取提醒组成功",
        data: groups.map((g) => g.toDTO()),
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
   * @param accountUuid 用户账号ID
   * @param uuid 分组ID
   * @returns TResponse<IReminderTemplateGroup>
   * @example
   * await service.getReminderGroupById(accountUuid, groupUuid);
   * // 返回: { success: true, data: groupDTO }
   */
  async getReminderGroupById(
    accountUuid: string,
    uuid: string
  ): Promise<TResponse<IReminderTemplateGroup>> {
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
   * @param accountUuid 用户账号ID
   * @param groupData IReminderTemplateGroup DTO
   * @returns TResponse<IReminderTemplateGroup>
   * @example
   * await service.updateReminderGroup(accountUuid, groupDTO);
   * // 返回: { success: true, data: groupDTO }
   */
  async updateReminderGroup(
    accountUuid: string,
    groupData: IReminderTemplateGroup
  ): Promise<TResponse<IReminderTemplateGroup>> {
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
   * @param accountUuid 用户账号ID
   * @param uuid 分组ID
   * @returns TResponse<void>
   * @example
   * await service.deleteReminderGroup(accountUuid, groupUuid);
   * // 返回: { success: true }
   */
  async deleteReminderGroup(
    accountUuid: string,
    uuid: string
  ): Promise<TResponse<void>> {
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
   * @param accountUuid 用户账号ID
   * @param template ReminderTemplate 实体
   * @returns TResponse<IReminderTemplate>
   * @example
   * await service.createReminderTemplate(accountUuid, template);
   * // 返回: { success: true, data: templateDTO }
   */
  async createReminderTemplate(
    accountUuid: string,
    template: ReminderTemplate
  ): Promise<TResponse<IReminderTemplate>> {
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
   * @param accountUuid 用户账号ID
   * @returns TResponse<IReminderTemplate[]>
   * @example
   * await service.getAllReminderTemplates(accountUuid);
   * // 返回: { success: true, data: [templateDTO, ...] }
   */
  async getAllReminderTemplates(
    accountUuid: string
  ): Promise<TResponse<IReminderTemplate[]>> {
    try {
      const templates = await this.reminderRepository.getAll(accountUuid);
      return {
        success: true,
        message: "获取提醒模板成功",
        data: templates.map((t) => t.toDTO()),
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
   * @param accountUuid 用户账号ID
   * @param uuid 模板ID
   * @returns TResponse<IReminderTemplate>
   * @example
   * await service.getReminderTemplateById(accountUuid, templateUuid);
   * // 返回: { success: true, data: templateDTO }
   */
  async getReminderTemplateById(
    accountUuid: string,
    uuid: string
  ): Promise<TResponse<IReminderTemplate>> {
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
   * @param accountUuid 用户账号ID
   * @param templateData IReminderTemplate DTO
   * @returns TResponse<IReminderTemplate>
   * @example
   * await service.updateReminderTemplate(accountUuid, templateDTO);
   * // 返回: { success: true, data: templateDTO }
   */
  async updateReminderTemplate(
    accountUuid: string,
    templateData: IReminderTemplate
  ): Promise<TResponse<IReminderTemplate>> {
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
   * @param accountUuid 用户账号ID
   * @param uuid 模板ID
   * @returns TResponse<void>
   * @example
   * await service.deleteReminderTemplate(accountUuid, templateUuid);
   * // 返回: { success: true }
   */
  async deleteReminderTemplate(
    accountUuid: string,
    uuid: string
  ): Promise<TResponse<void>> {
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

  // ========== 业务逻辑 ==========

  /**
   * 将提醒模板从一个分组移动到另一个分组
   * @param accountUuid 用户账号ID
   * @param templateUuid 模板ID
   * @param toGroupUuid 目标分组ID
   * @returns Promise<void>
   * @example
   * await service.moveTemplateToGroup(accountUuid, templateUuid, toGroupUuid);
   */
  async moveTemplateToGroup(
    accountUuid: string,
    templateUuid: string,
    toGroupUuid: string
  ): Promise<void> {
    console.log("[主进程] 移动提醒模板:", templateUuid, "到分组:", toGroupUuid);
    return reminderDomainService.moveTemplateToGroup(
      accountUuid,
      templateUuid,
      toGroupUuid,
      this.reminderRepository
    );
  }

  /**
   * 设置提醒组的启用模式（group/individual）
   * @param accountUuid 用户账号ID
   * @param groupUuid 分组ID
   * @param mode "group" | "individual"
   * @returns Promise<void>
   * @example
   * await service.setGroupEnableMode(accountUuid, groupUuid, "group");
   */
  async setGroupEnableMode(
    accountUuid: string,
    groupUuid: string,
    mode: "group" | "individual"
  ): Promise<void> {
    try {
      if (mode === "group") {
        await reminderDomainService.switchEnableModeToGroup(
          accountUuid,
          groupUuid,
          this.reminderGroupRepository
        );
      }
      if (mode === "individual") {
        await reminderDomainService.switchEnableModeToIndividual(
          accountUuid,
          groupUuid,
          this.reminderGroupRepository
        );
      }
      const newGroup = await this.reminderGroupRepository.getById(accountUuid, groupUuid);
      if (!newGroup) {
        throw new Error(`提醒组不存在: ${groupUuid}`);
      }
      await this.initializeRemindersInGroup(accountUuid, groupUuid);
    } catch (error) {
      console.error("[主进程] 设置提醒组模式失败:", error);
      throw new Error(
        `设置提醒组模式失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  }

  /**
   * 设置提醒组启用/禁用
   * @param accountUuid 用户账号ID
   * @param groupUuid 分组ID
   * @param enabled 是否启用
   * @returns Promise<void>
   * @example
   * await service.setGroupEnabled(accountUuid, groupUuid, true);
   */
  async setGroupEnabled(
    accountUuid: string,
    groupUuid: string,
    enabled: boolean
  ): Promise<void> {
    try {
      if (enabled) {
        await reminderDomainService.switchGroupEnabledToTrue(
          accountUuid,
          groupUuid,
          this.reminderGroupRepository
        );
      }
      if (!enabled) {
        await reminderDomainService.switchGroupEnabledToFalse(
          accountUuid,
          groupUuid,
          this.reminderGroupRepository
        );
      }
    } catch (error) {
      console.error("[主进程] 设置提醒组启用状态失败:", error);
    }
  }

  /**
   * 设置提醒模板启用/禁用
   * @param accountUuid 用户账号ID
   * @param templateUuid 模板ID
   * @param enabled 是否启用
   * @returns Promise<void>
   * @example
   * await service.setTemplateEnabled(accountUuid, templateUuid, true);
   */
  async setTemplateEnabled(
    accountUuid: string,
    templateUuid: string,
    enabled: boolean
  ): Promise<void> {
    try {
      if (enabled) {
        await reminderDomainService.switchReminderTemplateSelfEnabledToTrue(
          accountUuid,
          templateUuid,
          this.reminderRepository
        );
      }
      if (!enabled) {
        await reminderDomainService.switchReminderTemplateSelfEnabledToFalse(
          accountUuid,
          templateUuid,
          this.reminderRepository
        );
      }
      const reminderTemplate = await this.reminderRepository.getById(accountUuid, templateUuid);
      if (!reminderTemplate) {
        throw new Error(`提醒模板不存在: ${templateUuid}`);
      }
      const group = await this.reminderGroupRepository.getById(accountUuid, reminderTemplate.groupUuid);
      if (!group) {
        throw new Error(`提醒组不存在: ${reminderTemplate.groupUuid}`);
      }
      const newState = group.isTemplateEnabled(reminderTemplate.uuid) ? 'enabled' : 'disabled';
      await this.initializeReminderInTemplate(reminderTemplate, newState);
    } catch (error) {
      console.error("[主进程] 设置提醒模板启用状态失败:", error);
      throw new Error(
        `设置提醒模板启用状态失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  }

  /**
   * 初始化分组下所有提醒任务（内部方法）
   * @param accountUuid 用户账号ID
   * @param groupUuid 分组ID
   * @returns Promise<void>
   * @example
   * await service.initializeRemindersInGroup(accountUuid, groupUuid);
   */
  private async initializeRemindersInGroup(
    accountUuid: string,
    groupUuid: string
  ): Promise<void> {
    try {
      const group = await this.reminderGroupRepository.getById(accountUuid, groupUuid);
      if (!group) {
        throw new Error(`提醒组不存在: ${groupUuid}`);
      }
      const enabledTemplates = group.allEnabledReminderTemplates;
      // 先取消所有已存在的提醒任务
      for (const template of group.templates) {
        await this.reminderScheduleService.cancelReminderSchedule(template.uuid);
      }
      // 创建新的提醒任务
      for (const template of enabledTemplates) {
        await this.reminderScheduleService.createReminderScheduleByRule(
          template.timeConfig.schedule,
          {
            uuid: template.uuid,
            title: template.name,
            body: template.description || "无描述",
            importanceLevel: template.importanceLevel,
          }
        );
        console.log("[主进程] 初始化提醒组成功，已创建提醒任务:", template.uuid);
      }
    } catch (error) {
      throw new Error(
        `初始化提醒组失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  }

  /**
   * 初始化单个提醒模板的提醒任务（内部方法）
   * @param template ReminderTemplate 实体
   * @param newState "enabled" | "disabled"
   * @returns Promise<void>
   * @example
   * await service.initializeReminderInTemplate(template, "enabled");
   */
  private async initializeReminderInTemplate(
    template: ReminderTemplate,
    newState: "enabled" | "disabled"
  ): Promise<void> {
    try {
      if (newState === "disabled") {
        await this.reminderScheduleService.cancelReminderSchedule(template.uuid);
        console.log("[主进程] 提醒模板已禁用，取消提醒任务:", template.uuid);
        return;
      } else {
        await this.reminderScheduleService.createReminderScheduleByRule(
          template.timeConfig.schedule,
          {
            uuid: template.uuid,
            title: template.name,
            body: template.description || "无描述",
            importanceLevel: template.importanceLevel,
          }
        );
      }
      console.log("[主进程] 初始化提醒模板成功，已创建提醒任务:", template.uuid);
    } catch (error) {
      throw new Error(
        `初始化提醒模板失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  }
}