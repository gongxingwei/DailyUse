import type { TResponse } from "@/shared/types/response";
import { deepSerializeForIpc } from "@/shared/utils/ipcSerialization";
import { ReminderTemplate } from "../../domain/entities/reminderTemplate";
import { ReminderTemplateGroup } from "../../domain/aggregates/reminderTemplateGroup";
import { ipcInvokeWithAuth } from "@/shared/utils/ipcInvokeWithAuth";

/**
 * Reminder 模块 IPC 客户端
 * 处理渲染进程与主进程之间的提醒模板相关通信
 */
export class ReminderIpcClient {
  name = "ReminderIpcClient";

  /**
   * 创建提醒模板
   */
  async createReminderTemplate(
    reminderTemplate: ReminderTemplate
  ): Promise<TResponse<ReminderTemplate>> {
    try {
      console.log("🔄 [渲染进程-IPC] 创建提醒模板:", reminderTemplate.name);
      const dto = reminderTemplate.toDTO();
      const plain = JSON.parse(JSON.stringify(dto));
      const response = await ipcInvokeWithAuth("reminder:create", plain);
      if (response.success) {
        console.log("✅ [渲染进程-IPC] 提醒模板创建成功:", response.data?.id);
      } else {
        console.error("❌ [渲染进程-IPC] 提醒模板创建失败:", response.message);
      }
      if (response.data) {
        response.data = ReminderTemplate.fromDTO(response.data);
      }
      return response;
    } catch (error) {
      console.error("❌ [渲染进程-IPC] 创建提醒模板通信错误:", error);
      return {
        success: false,
        message: `IPC通信失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  /**
   * 获取所有提醒模板
   */
  async getAllReminderTemplates(): Promise<TResponse<ReminderTemplate[]>> {
    try {
      console.log("🔄 [渲染进程-IPC] 获取所有提醒模板");
      const response = await ipcInvokeWithAuth("reminder:getAll");
      if (response.success) {
        console.log(
          `✅ [渲染进程-IPC] 获取提醒模板成功，数量: ${
            response.data?.length || 0
          }`
        );
      } else {
        console.error("❌ [渲染进程-IPC] 获取提醒模板失败:", response.message);
      }
      if (response.data) {
        response.data = response.data.map((item: any) =>
          ReminderTemplate.fromDTO(item)
        );
      }
      return response;
    } catch (error) {
      console.error("❌ [渲染进程-IPC] 获取提醒模板通信错误:", error);
      return {
        success: false,
        message: `IPC通信失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  /**
   * 根据ID获取提醒模板
   */
  async getReminderTemplateById(
    uuid: string
  ): Promise<TResponse<ReminderTemplate>> {
    try {
      console.log("🔄 [渲染进程-IPC] 获取提醒模板:", uuid);
      const response = await ipcInvokeWithAuth("reminder:getById", uuid);
      if (response.success) {
        console.log("✅ [渲染进程-IPC] 获取提醒模板成功:", uuid);
      } else {
        console.error("❌ [渲染进程-IPC] 获取提醒模板失败:", response.message);
      }
      if (response.data) {
        response.data = ReminderTemplate.fromDTO(response.data);
      }
      return response;
    } catch (error) {
      console.error("❌ [渲染进程-IPC] 获取提醒模板通信错误:", error);
      return {
        success: false,
        message: `IPC通信失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  /**
   * 更新提醒模板
   */
  async updateReminderTemplate(
    reminderTemplate: ReminderTemplate
  ): Promise<TResponse<ReminderTemplate>> {
    try {
      console.log("🔄 [渲染进程-IPC] 更新提醒模板:", reminderTemplate.uuid);
      const serializedData = deepSerializeForIpc(reminderTemplate);
      const response = await ipcInvokeWithAuth(
        "reminder:update",
        serializedData
      );
      if (response.success) {
        console.log(
          "✅ [渲染进程-IPC] 提醒模板更新成功:",
          reminderTemplate.uuid
        );
      } else {
        console.error("❌ [渲染进程-IPC] 提醒模板更新失败:", response.message);
      }
      if (response.data) {
        response.data = ReminderTemplate.fromDTO(response.data);
      }
      return response;
    } catch (error) {
      console.error("❌ [渲染进程-IPC] 更新提醒模板通信错误:", error);
      return {
        success: false,
        message: `IPC通信失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  /**
   * 删除提醒模板
   */
  async deleteReminderTemplate(uuid: string): Promise<TResponse<void>> {
    try {
      console.log("🔄 [渲染进程-IPC] 删除提醒模板:", uuid);
      const response = await ipcInvokeWithAuth("reminder:delete", uuid);
      if (response.success) {
        console.log("✅ [渲染进程-IPC] 提醒模板删除成功:", uuid);
      } else {
        console.error("❌ [渲染进程-IPC] 提醒模板删除失败:", response.message);
      }
      return response;
    } catch (error) {
      console.error("❌ [渲染进程-IPC] 删除提醒模板通信错误:", error);
      return {
        success: false,
        message: `IPC通信失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  // ========== 提醒组相关 ==========

  async createReminderGroup(
    group: ReminderTemplateGroup
  ): Promise<TResponse<ReminderTemplateGroup>> {
    try {
      const dto = group.toDTO();
      const plain = JSON.parse(JSON.stringify(dto));
      const response = await ipcInvokeWithAuth("reminderGroup:create", plain);
      if (response.data) {
        response.data = ReminderTemplateGroup.fromDTO(response.data);
      }
      return response;
    } catch (error) {
      console.error("❌ [渲染进程-IPC] 创建提醒组通信错误:", error);
      return {
        success: false,
        message: `IPC通信失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  async getAllReminderGroups(): Promise<TResponse<ReminderTemplateGroup[]>> {
    try {
      const response = await ipcInvokeWithAuth("reminderGroup:getAll");
      if (response.data) {
        response.data = response.data.map((item: any) =>
          ReminderTemplateGroup.fromDTO(item)
        );
      }
      return response;
    } catch (error) {
      console.error("❌ [渲染进程-IPC] 获取提醒组通信错误:", error);
      return {
        success: false,
        message: `IPC通信失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  async getReminderGroupById(
    uuid: string
  ): Promise<TResponse<ReminderTemplateGroup>> {
    try {
      const response = await ipcInvokeWithAuth("reminderGroup:getById", uuid);
      if (response.data) {
        response.data = ReminderTemplateGroup.fromDTO(response.data);
      }
      return response;
    } catch (error) {
      console.error("❌ [渲染进程-IPC] 获取提醒组通信错误:", error);
      return {
        success: false,
        message: `IPC通信失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  async updateReminderGroup(
    group: ReminderTemplateGroup
  ): Promise<TResponse<ReminderTemplateGroup>> {
    try {
      const dto = group.toDTO();
      const plain = JSON.parse(JSON.stringify(dto));
      const response = await ipcInvokeWithAuth("reminderGroup:update", plain);
      if (response.data) {
        response.data = ReminderTemplateGroup.fromDTO(response.data);
      }
      return response;
    } catch (error) {
      console.error("❌ [渲染进程-IPC] 更新提醒组通信错误:", error);
      return {
        success: false,
        message: `IPC通信失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  async deleteReminderGroup(uuid: string): Promise<TResponse<void>> {
    try {
      const response = await ipcInvokeWithAuth("reminderGroup:delete", uuid);
      return response;
    } catch (error) {
      console.error("❌ [渲染进程-IPC] 删除提醒组通信错误:", error);
      return {
        success: false,
        message: `IPC通信失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  async moveTemplateToGroup(
    templateId: string,
    toGroupId: string
  ): Promise<TResponse<void>> {
    try {
      const response = await ipcInvokeWithAuth(
        "reminder:moveTemplateToGroup",
        templateId,
        toGroupId
      );
      return response;
    } catch (error) {
      console.error("❌ [渲染进程-IPC] 移动提醒模板到组通信错误:", error);
      return {
        success: false,
        message: `IPC通信失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  /**
   * 设置提醒组启用模式（group/individual）
   * @param groupId string 分组ID
   * @param mode "group" | "individual"
   * @returns TResponse<void>
   * @example
   * await reminderIpcClient.setGroupEnableMode(groupId, "group");
   */
  async setGroupEnableMode(
    groupId: string,
    mode: "group" | "individual"
  ): Promise<TResponse<void>> {
    try {
      const response = await ipcInvokeWithAuth(
        "reminderGroup:setEnableMode",
        groupId,
        mode
      );
      return response;
    } catch (error) {
      console.error("❌ [渲染进程-IPC] 设置分组启用模式通信错误:", error);
      return {
        success: false,
        message: `IPC通信失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  /**
   * 设置提醒组启用/禁用
   * @param groupId string 分组ID
   * @param enabled boolean 是否启用
   * @returns TResponse<void>
   * @example
   * await reminderIpcClient.setGroupEnabled(groupId, true);
   */
  async setGroupEnabled(
    groupId: string,
    enabled: boolean
  ): Promise<TResponse<void>> {
    try {
      const response = await ipcInvokeWithAuth(
        "reminderGroup:setEnabled",
        groupId,
        enabled
      );
      return response;
    } catch (error) {
      console.error("❌ [渲染进程-IPC] 设置分组启用状态通信错误:", error);
      return {
        success: false,
        message: `IPC通信失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  /**
   * 设置提醒模板启用/禁用
   * @param templateId string 模板ID
   * @param enabled boolean 是否启用
   * @returns TResponse<void>
   * @example
   * await reminderIpcClient.setTemplateEnabled(templateId, true);
   */
  async setTemplateEnabled(
    templateId: string,
    enabled: boolean
  ): Promise<TResponse<void>> {
    try {
      const response = await ipcInvokeWithAuth(
        "reminder:setEnabled",
        templateId,
        enabled
      );
      return response;
    } catch (error) {
      console.error("❌ [渲染进程-IPC] 设置模板启用状态通信错误:", error);
      return {
        success: false,
        message: `IPC通信失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  /**
   * 获取提醒任务调度信息（下一次提醒时间等）
   * @param uuid string 任务模板唯一ID
   * @returns Promise<{ exists: boolean, nextInvocation: Date | null }>
   */
  async getReminderScheduleInfo(
    uuid: string
  ): Promise<{ exists: boolean; nextInvocation: Date | null }> {
    try {
      const response = await ipcInvokeWithAuth("reminder:getScheduleInfo", uuid);
      if (response.success && response.data) {
        // nextInvocation 可能是字符串，需要转为 Date 类型
        const { exists, nextInvocation } = response.data;
        return {
          exists: Boolean(exists),
          nextInvocation: nextInvocation ? new Date(nextInvocation) : null,
        };
      }
      throw new Error(response.message || "获取提醒任务调度信息失败");
    } catch (error) {
      console.error("❌ [渲染进程-IPC] 获取提醒任务调度信息通信错误:", error);
      return {
        exists: false,
        nextInvocation: null,
      };
    }
  }
}

// 导出单例实例
export const reminderIpcClient = new ReminderIpcClient();
