import { ipcMain } from "electron";
import { MainReminderApplicationService } from "../../application/services/reminderApplicationService";
import { ReminderTemplate } from "../../domain/entities/reminderTemplate";
import { ReminderTemplateGroup } from "../../domain/aggregates/reminderTemplateGroup";
import { withAuth } from "@electron/modules/Authentication/application/services/authTokenService";
/**
 * Reminder 模块 IPC 处理器
 * 注册所有 Reminder 相关的 IPC 通信
 */
export function registerReminderIpcHandlers() {
  const service = new MainReminderApplicationService();

  ipcMain.handle(
    "reminder:create",
    withAuth(async (_event, [templateData], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: "未登录或登录已过期，请重新登录" };
      }
      const reminderTemplate = ReminderTemplate.fromDTO(templateData);
      return await service.createReminderTemplate(
        auth.accountUuid,
        reminderTemplate
      );
    })
  );

  ipcMain.handle(
    "reminder:update",
    withAuth(async (_event, [templateData], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: "未登录或登录已过期，请重新登录" };
      }
      const reminderTemplate = ReminderTemplate.fromDTO(templateData);
      return await service.updateReminderTemplate(
        auth.accountUuid,
        reminderTemplate
      );
    })
  );

  ipcMain.handle(
    "reminder:delete",
    withAuth(async (_event, [uuid], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: "未登录或登录已过期，请重新登录" };
      }
      return await service.deleteReminderTemplate(auth.accountUuid, uuid);
    })
  );

  ipcMain.handle(
    "reminder:getById",
    withAuth(async (_event, [uuid], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: "未登录或登录已过期，请重新登录" };
      }
      return await service.getReminderTemplateById(auth.accountUuid, uuid);
    })
  );

  ipcMain.handle(
    "reminder:getAll",
    withAuth(async (_event, [], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: "未登录或登录已过期，请重新登录" };
      }
      return await service.getAllReminderTemplates(auth.accountUuid);
    })
  );

  // ========== 提醒组相关 IPC ==========
  ipcMain.handle(
    "reminderGroup:create",
    withAuth(async (_event, [groupData], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: "未登录或登录已过期，请重新登录" };
      }
      const group = ReminderTemplateGroup.fromDTO(groupData);
      const response = await service.createReminderGroup(
        auth.accountUuid,
        group
      );
      console.log("🔄 [主进程-IPC] 创建提醒组:", response);
      return response;
    })
  );

  ipcMain.handle(
    "reminderGroup:getAll",
    withAuth(async (_event, [], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: "未登录或登录已过期，请重新登录" };
      }
      return await service.getAllReminderGroups(auth.accountUuid);
    })
  );

  ipcMain.handle(
    "reminderGroup:getById",
    withAuth(async (_event, [uuid], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: "未登录或登录已过期，请重新登录" };
      }
      return await service.getReminderGroupById(auth.accountUuid, uuid);
    })
  );

  ipcMain.handle(
    "reminderGroup:update",
    withAuth(async (_event, [groupData], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: "未登录或登录已过期，请重新登录" };
      }
      return await service.updateReminderGroup(auth.accountUuid, groupData);
    })
  );

  ipcMain.handle(
    "reminderGroup:delete",
    withAuth(async (_event, [uuid], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: "未登录或登录已过期，请重新登录" };
      }
      return await service.deleteReminderGroup(auth.accountUuid, uuid);
    })
  );

  console.log("✅ Reminder IPC handlers registered");

  // 业务逻辑相关的 IPC 处理器
  ipcMain.handle(
    "reminder:moveTemplateToGroup",
    withAuth(async (_event, [templateId, toGroupId], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: "未登录或登录已过期，请重新登录" };
      }
      await service.moveTemplateToGroup(
        auth.accountUuid,
        templateId,
        toGroupId
      );
      return { success: true, message: "模板移动成功" };
    })
  );

  // ========== 新增业务服务相关 IPC ==========

  /**
   * 设置提醒组启用模式（group/individual）
   * @param groupId string 分组ID
   * @param mode "group" | "individual"
   * @returns { success: boolean, message?: string }
   * @example
   * ipcRenderer.invoke('reminderGroup:setEnableMode', groupId, "group")
   */
  ipcMain.handle(
    "reminderGroup:setEnableMode",
    withAuth(async (_event, [groupId, mode], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: "未登录或登录已过期，请重新登录" };
      }
      try {
        await service.setGroupEnableMode(auth.accountUuid, groupId, mode);
        return { success: true, message: "分组启用模式设置成功" };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : String(error),
        };
      }
    })
  );

  /**
   * 设置提醒组启用/禁用
   * @param groupId string 分组ID
   * @param enabled boolean 是否启用
   * @returns { success: boolean, message?: string }
   * @example
   * ipcRenderer.invoke('reminderGroup:setEnabled', groupId, true)
   */
  ipcMain.handle(
    "reminderGroup:setEnabled",
    withAuth(async (_event, [groupId, enabled], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: "未登录或登录已过期，请重新登录" };
      }
      try {
        await service.setGroupEnabled(auth.accountUuid, groupId, enabled);
        return { success: true, message: "分组启用状态设置成功" };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : String(error),
        };
      }
    })
  );

  /**
   * 设置提醒模板启用/禁用
   * @param templateId string 模板ID
   * @param enabled boolean 是否启用
   * @returns { success: boolean, message?: string }
   * @example
   * ipcRenderer.invoke('reminder:setEnabled', templateId, true)
   */
  ipcMain.handle(
    "reminder:setEnabled",
    withAuth(async (_event, [templateId, enabled], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: "未登录或登录已过期，请重新登录" };
      }
      try {
        await service.setTemplateEnabled(auth.accountUuid, templateId, enabled);
        return { success: true, message: "模板启用状态设置成功" };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : String(error),
        };
      }
    })
  );

  /**
   * 获取提醒任务调度信息（下一次提醒时间等）
   * @param event
   * @param uuid string 任务模板唯一ID
   * @returns { exists: boolean, nextInvocation: Date | null }
   */
  ipcMain.handle(
    "reminder:getScheduleInfo",
    withAuth(async (_event, [uuid], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: "未登录或登录已过期，请重新登录" };
      }
      try {
        const info = service.getReminderScheduleInfoByUuid(uuid);
        return { success: true, data: info };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : String(error),
        };
      }
    })
  );
}

/**
 * 取消注册所有 Reminder 相关的 IPC 处理器
 */
export function unregisterReminderIpcHandlers() {
  const channels = [
    "reminder:create",
    "reminder:update",
    "reminder:delete",
    "reminder:getById",
    "reminder:getAll",
    "reminder:setCurrentAccountUuid",
    "reminder:moveTemplateToGroup",
    "reminder:setEnabled",
    "reminder:getScheduleInfo",

    "reminderGroup:create",
    "reminderGroup:getAll",
    "reminderGroup:getById",
    "reminderGroup:update",
    "reminderGroup:delete",
    "reminderGroup:setEnableMode",
    "reminderGroup:setEnabled",
  ];

  channels.forEach((channel) => {
    ipcMain.removeAllListeners(channel);
  });

  console.log("✅ Reminder IPC handlers unregistered");
}
