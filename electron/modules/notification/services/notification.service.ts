import { BrowserWindow } from "electron";
import { NotificationWindowManager } from "../windows/notification.window";

import type { NotificationWindowOptions } from "@/modules/notification/types/notification";
import type { TResponse } from "@/shared/types/response";

export interface NotificationServiceConfig {
  mainWindow: BrowserWindow;
  MAIN_DIST: string;
  RENDERER_DIST: string;
  VITE_DEV_SERVER_URL?: string;
}

/**
 * 通知服务 - 统一管理通知功能
 */
class NotificationService {
  private windowManagementService = new NotificationWindowManager();

  constructor() {}

  public async showNotification(
    options: NotificationWindowOptions
  ): Promise<TResponse> {
    try {
      const window = this.windowManagementService.createWindow(options);
      const url = this.windowManagementService.buildNotificationUrl(options);
      // 加载 URL
      await window.loadURL(url);
      window.show();
      return {
        success: true,
        message: "Notification displayed successfully",
      };
    } catch (error) {
      console.error("NotificationService - showNotification Error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public closeNotification(id: string): TResponse {
    try {
      const response = this.windowManagementService.closeWindow(id);
      if (!response) {
        throw new Error(
          `Notification with ID ${id} not found or already closed`
        );
      }
      return {
        success: true,
        message: "Notification closed successfully",
      };
    } catch (error) {
      console.error("NotificationService - closeNotification Error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public handleNotificationAction(
    id: string,
    action: { text: string; type: string }
  ): void {
    const window = this.windowManagementService.getWindow(id);
    if (window) {
      if (action.type === "cancel" || action.type === "confirm") {
        window.close();
      }
      window.webContents.send("notification-action", { id, action });
    } else {
      console.warn(`Notification with ID ${id} not found.`);
    }
  }
}

export const notificationService = new NotificationService();
