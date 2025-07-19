import { ipcMain } from 'electron';
import { MainReminderApplicationService } from '../../application/services/reminderApplicationService';
import { ReminderTemplate } from '../../domain/aggregates/reminderTemplate';
import { ReminderTemplateGroup } from '../../domain/aggregates/reminderTemplateGroup';
/**
 * Reminder 模块 IPC 处理器
 * 注册所有 Reminder 相关的 IPC 通信
 */
export function registerReminderIpcHandlers() {
  const service = new MainReminderApplicationService();

  ipcMain.handle('reminder:create', async (_event, templateData) => {
    const reminderTemplate = ReminderTemplate.fromDTO(templateData);
    return await service.createReminderTemplate(reminderTemplate);
  });

  ipcMain.handle('reminder:update', async (_event, templateData) => {
     const reminderTemplate = ReminderTemplate.fromDTO(templateData);
    return await service.updateReminderTemplate(reminderTemplate);
  });

  ipcMain.handle('reminder:delete', async (_event, id: string) => {
    return await service.deleteReminderTemplate(id);
  });

  ipcMain.handle('reminder:getById', async (_event, id: string) => {
    return await service.getReminderTemplateById(id);
  });

  ipcMain.handle('reminder:getAll', async () => {
    return await service.getAllReminderTemplates();
  });

  ipcMain.handle('reminder:setCurrentAccountUuid', async (_event, accountUuid: string) => {
    await service.setCurrentAccountUuid(accountUuid);
    return { success: true };
  });

  // ========== 提醒组相关 IPC ==========
  ipcMain.handle('reminderGroup:create', async (_event, groupData) => {
    const group = ReminderTemplateGroup.fromDTO(groupData);
    return await service.createReminderGroup(group);
  });

  ipcMain.handle('reminderGroup:getAll', async () => {
    return await service.getAllReminderGroups();
  });

  ipcMain.handle('reminderGroup:getById', async (_event, id: string) => {
    return await service.getReminderGroupById(id);
  });

  ipcMain.handle('reminderGroup:update', async (_event, groupData) => {
    return await service.updateReminderGroup(groupData);
  });

  ipcMain.handle('reminderGroup:delete', async (_event, id: string) => {
    return await service.deleteReminderGroup(id);
  });

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