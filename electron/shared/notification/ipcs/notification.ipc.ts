import { ipcMain } from 'electron';
import { notificationService } from '../services/notificationService';
import type { NotificationWindowOptions } from "@/modules/notification/types/notification";

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
  ipcMain.on('close-notification', (_event, id: string) => {
    try {
      return notificationService.closeNotification(id);
    } catch (error) {
      console.error('IPC Error - close-notification:', error);
    }
  });

  // 通知操作
  ipcMain.on('notification-action', (_event, id: string, action: { text: string; type: string }) => {
    try {
      return notificationService.handleNotificationAction(id, action);
    } catch (error) {
      console.error('IPC Error - notification-action:', error);
    }
  });
}