import { ipcMain } from 'electron';
import { notificationService } from '../services/notificationService';
import type { NotificationWindowOptions } from "@renderer/modules/notification/types/notification";

export function setupNotificationHandler() {
  ipcMain.handle('show-notification', async (_event, options: NotificationWindowOptions) => {
    try {
      return await notificationService.showNotification(options);
    } catch (error) {
      console.error('IPC Error - show-notification:', error);
      throw error;
    }
  });

  // 关闭通知
  ipcMain.on('close-notification', (_event, uuid: string) => {
    try {
      return notificationService.closeNotification(uuid);
    } catch (error) {
      console.error('IPC Error - close-notification:', error);
    }
  });

  // 通知操作
  ipcMain.on('notification-action', (_event, uuid: string, action: { text: string; type: string }) => {
    try {
      return notificationService.handleNotificationAction(uuid, action);
    } catch (error) {
      console.error('IPC Error - notification-action:', error);
    }
  });
}
