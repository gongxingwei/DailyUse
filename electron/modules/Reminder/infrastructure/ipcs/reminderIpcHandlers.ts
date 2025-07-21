import { ipcMain } from 'electron';
import { MainReminderApplicationService } from '../../application/services/reminderApplicationService';
import { ReminderTemplate } from '../../domain/aggregates/reminderTemplate';
import { ReminderTemplateGroup } from '../../domain/aggregates/reminderTemplateGroup';
import { withAuth } from '@electron/modules/Authentication/application/services/authTokenService';
/**
 * Reminder 模块 IPC 处理器
 * 注册所有 Reminder 相关的 IPC 通信
 */
export function registerReminderIpcHandlers() {
  const service = new MainReminderApplicationService();

  ipcMain.handle('reminder:create', withAuth(async (_event, [templateData], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    const reminderTemplate = ReminderTemplate.fromDTO(templateData);
    return await service.createReminderTemplate(auth.accountUuid, reminderTemplate);
  }));

  ipcMain.handle('reminder:update', withAuth(async (_event, [templateData], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    const reminderTemplate = ReminderTemplate.fromDTO(templateData);
    return await service.updateReminderTemplate(auth.accountUuid, reminderTemplate);
  }));

  ipcMain.handle('reminder:delete', withAuth(async (_event, [uuid], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    return await service.deleteReminderTemplate(auth.accountUuid, uuid);
  }));

  ipcMain.handle('reminder:getById', withAuth(async (_event, [uuid], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    return await service.getReminderTemplateById(auth.accountUuid, uuid);
  }));

  ipcMain.handle('reminder:getAll', withAuth(async (_event, [], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    return await service.getAllReminderTemplates(auth.accountUuid);
  }));

  // ========== 提醒组相关 IPC ==========
  ipcMain.handle('reminderGroup:create', withAuth(async (_event, [groupData], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    const group = ReminderTemplateGroup.fromDTO(groupData);
    return await service.createReminderGroup(auth.accountUuid, group);
  }));

  ipcMain.handle('reminderGroup:getAll', withAuth(async (_event, [], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    return await service.getAllReminderGroups(auth.accountUuid);
  }));

  ipcMain.handle('reminderGroup:getById', withAuth(async (_event, [uuid], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    return await service.getReminderGroupById(auth.accountUuid, uuid);
  }));

  ipcMain.handle('reminderGroup:update', withAuth(async (_event, [groupData], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    return await service.updateReminderGroup(auth.accountUuid, groupData);
  }));

  ipcMain.handle('reminderGroup:delete', withAuth(async (_event, [uuid], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    return await service.deleteReminderGroup(auth.accountUuid, uuid);
  }));

  console.log('✅ Reminder IPC handlers registered');
}

/**
 * 取消注册所有 Reminder 相关的 IPC 处理器
 */
export function unregisterReminderIpcHandlers() {
  const channels = [
    'reminder:create',
    'reminder:update',
    'reminder:delete',
    'reminder:getById',
    'reminder:getAll',
    'reminder:setCurrentAccountUuid',

    'reminderGroup:create',
    'reminderGroup:getAll',
    'reminderGroup:getById',
    'reminderGroup:update',
    'reminderGroup:delete',
  ];

  channels.forEach(channel => {
    ipcMain.removeAllListeners(channel);
  });

  console.log('✅ Reminder IPC handlers unregistered');
}