import type { TResponse } from "@/shared/types/response";
import { deepSerializeForIpc } from "@/shared/utils/ipcSerialization";
import { ReminderTemplate } from "../../domain/aggregates/reminderTemplate";
import { ReminderTemplateGroup } from "../../domain/aggregates/reminderTemplateGroup";

/**
 * Reminder 模块 IPC 客户端
 * 处理渲染进程与主进程之间的提醒模板相关通信
 */
export class ReminderIpcClient {
  name = 'ReminderIpcClient';

  /**
   * 创建提醒模板
   */
  async createReminderTemplate(reminderTemplate: ReminderTemplate): Promise<TResponse<ReminderTemplate>> {
  try {
    console.log('🔄 [渲染进程-IPC] 创建提醒模板:', reminderTemplate.name);
    // 1. 只传递纯 JSON 数据
    const dto = reminderTemplate.toDTO();
    const plain = JSON.parse(JSON.stringify(dto));
    const response = await window.shared.ipcRenderer.invoke('reminder:create', plain);
    if (response.success) {
      console.log('✅ [渲染进程-IPC] 提醒模板创建成功:', response.data?.id);
    } else {
      console.error('❌ [渲染进程-IPC] 提醒模板创建失败:', response.message);
    }
    if (response.data) {
      // 反序列化数据
      response.data = ReminderTemplate.fromDTO(response.data);
    }
    return response;
  } catch (error) {
    console.error('❌ [渲染进程-IPC] 创建提醒模板通信错误:', error);
    return {
      success: false,
      message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
    };
  }
}

  /**
   * 获取所有提醒模板
   */
  async getAllReminderTemplates(): Promise<TResponse<ReminderTemplate[]>> {
    try {
      console.log('🔄 [渲染进程-IPC] 获取所有提醒模板');
      const response = await window.shared.ipcRenderer.invoke('reminder:getAll');
      if (response.success) {
        console.log(`✅ [渲染进程-IPC] 获取提醒模板成功，数量: ${response.data?.length || 0}`);
      } else {
        console.error('❌ [渲染进程-IPC] 获取提醒模板失败:', response.message);
      }
      if (response.data) {
        // 反序列化数据
        response.data = response.data.map((item: any) => ReminderTemplate.fromDTO(item));
      }
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 获取提醒模板通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 根据ID获取提醒模板
   */
  async getReminderTemplateById(id: string): Promise<TResponse<ReminderTemplate>> {
    try {
      console.log('🔄 [渲染进程-IPC] 获取提醒模板:', id);
      const response = await window.shared.ipcRenderer.invoke('reminder:getById', id);
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 获取提醒模板成功:', id);
      } else {
        console.error('❌ [渲染进程-IPC] 获取提醒模板失败:', response.message);
      }
      if (response.data) {
        // 反序列化数据
        response.data = ReminderTemplate.fromDTO(response.data);
      }
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 获取提醒模板通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 更新提醒模板
   */
  async updateReminderTemplate(reminderTemplate: ReminderTemplate): Promise<TResponse<ReminderTemplate>> {
    try {
      console.log('🔄 [渲染进程-IPC] 更新提醒模板:', reminderTemplate.id);
      const serializedData = deepSerializeForIpc(reminderTemplate);
      const response = await window.shared.ipcRenderer.invoke('reminder:update', serializedData);
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 提醒模板更新成功:', reminderTemplate.id);
      } else {
        console.error('❌ [渲染进程-IPC] 提醒模板更新失败:', response.message);
      }
      if (response.data) {
        // 反序列化数据
        response.data = ReminderTemplate.fromDTO(response.data);
      }
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 更新提醒模板通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 删除提醒模板
   */
  async deleteReminderTemplate(id: string): Promise<TResponse<void>> {
    try {
      console.log('🔄 [渲染进程-IPC] 删除提醒模板:', id);
      const response = await window.shared.ipcRenderer.invoke('reminder:delete', id);
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 提醒模板删除成功:', id);
      } else {
        console.error('❌ [渲染进程-IPC] 提醒模板删除失败:', response.message);
      }
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 删除提醒模板通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

   // ========== 提醒组相关 ==========

  async createReminderGroup(group: ReminderTemplateGroup): Promise<TResponse<ReminderTemplateGroup>> {
    try {
      const dto = group.toDTO();
      const plain = JSON.parse(JSON.stringify(dto));
      const response = await window.shared.ipcRenderer.invoke('reminderGroup:create', plain);
      if (response.data) {
        response.data = ReminderTemplateGroup.fromDTO(response.data);
      }
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 创建提醒组通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  async getAllReminderGroups(): Promise<TResponse<ReminderTemplateGroup[]>> {
    try {
      const response = await window.shared.ipcRenderer.invoke('reminderGroup:getAll');
      if (response.data) {
        response.data = response.data.map((item: any) => ReminderTemplateGroup.fromDTO(item));
      }
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 获取提醒组通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  async getReminderGroupById(id: string): Promise<TResponse<ReminderTemplateGroup>> {
    try {
      const response = await window.shared.ipcRenderer.invoke('reminderGroup:getById', id);
      if (response.data) {
        response.data = ReminderTemplateGroup.fromDTO(response.data);
      }
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 获取提醒组通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  async updateReminderGroup(group: ReminderTemplateGroup): Promise<TResponse<ReminderTemplateGroup>> {
    try {
      const dto = group.toDTO();
      const plain = JSON.parse(JSON.stringify(dto));
      const response = await window.shared.ipcRenderer.invoke('reminderGroup:update', plain);
      if (response.data) {
        response.data = ReminderTemplateGroup.fromDTO(response.data);
      }
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 更新提醒组通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  async deleteReminderGroup(id: string): Promise<TResponse<void>> {
    try {
      const response = await window.shared.ipcRenderer.invoke('reminderGroup:delete', id);
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 删除提醒组通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }
  
  /**
   * 设置当前账号 UUID
   */
  async setCurrentAccountUuid(accountUuid: string): Promise<TResponse<void>> {
    try {
      console.log('🔄 [渲染进程-IPC] 设置当前账号 UUID:', accountUuid);
      const response = await window.shared.ipcRenderer.invoke('reminder:setCurrentAccountUuid', accountUuid);
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 当前账号 UUID 设置成功');
      } else {
        console.error('❌ [渲染进程-IPC] 当前账号 UUID 设置失败:', response.message);
      }
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 设置当前账号 UUID 通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }
}

// 导出单例实例
export const reminderIpcClient = new ReminderIpcClient();