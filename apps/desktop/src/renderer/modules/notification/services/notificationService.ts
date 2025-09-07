import type { NotificationWindowOptions } from '../types/notification';
import type { ApiResponse } from '@dailyuse/contracts';

import { serializeForIpc } from '@renderer/shared/utils/ipcSerialization';
import { ImportanceLevel } from '@dailyuse/contracts';
import { generateUUID } from '@dailyuse/utils';
export class NotificationService {
  /**
   * 显示通知
   * @param options 通知选项
   * @returns Promise<ApiResponse>
   */
  public async showNotification(options: NotificationWindowOptions): Promise<ApiResponse> {
    try {
      const fullOptions: any = {
        ...options,
      };
      const response = await window.shared.ipcRenderer.invoke(
        'show-notification',
        serializeForIpc(fullOptions),
      );
      return response;
    } catch (error) {
      console.error('NotificationService - showNotification Error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  /**
   * 关闭通知
   * @param id 通知ID
   * @returns Promise<ApiResponse>
   */
  public async closeNotification(uuid: string): Promise<ApiResponse> {
    try {
      const response = await window.shared.ipcRenderer.invoke('close-notification', uuid);
      return response;
    } catch (error) {
      console.error('NotificationService - closeNotification Error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 发送通知操作
   */
  public notificationAction(uuid: string, action: { text: string; type: string }): ApiResponse {
    try {
      window.shared.ipcRenderer.send('notification-action', uuid, action);
      return {
        success: true,
        message: 'Action sent successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 监听通知操作
   */
  public onNotificationAction(
    callback: (uuid: string, action: { text: string; type: string }) => void,
  ): () => void {
    const handler = (_event: any, uuid: string, action: { text: string; type: string }) => {
      callback(uuid, action);
    };

    window.shared.ipcRenderer.on('notification-action-received', handler);

    // 返回清理函数
    return () => {
      window.shared.ipcRenderer.removeListener('notification-action-received', handler);
    };
  }

  /**
   * 显示简单通知
   * @param title 标题
   * @param message 消息内容
   */
  public async showSimple(title: string, message: string): Promise<ApiResponse> {
    return await this.showNotification({
      uuid: generateUUID(),
      title,
      body: message,
      importance: ImportanceLevel.Moderate,
    });
  }

  /**
   * 显示警告通知
   * @param title 标题
   * @param message 消息内容
   */
  public async showWarning(title: string, message: string): Promise<ApiResponse> {
    return await this.showNotification({
      uuid: generateUUID(),
      title,
      body: message,
      importance: ImportanceLevel.Vital,
      actions: [{ text: '我知道了', type: 'confirm' }],
    });
  }
}

export const notificationService = new NotificationService();
