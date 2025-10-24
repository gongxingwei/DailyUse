import { BrowserWindow, screen } from 'electron';
import path from 'node:path';
import type { NotificationWindow } from '../types';

import { MAIN_DIST, RENDERER_DIST, VITE_DEV_SERVER_URL } from '../../../main';
export class NotificationWindowManager {
  private windows = new Map<string, BrowserWindow>();
  private static readonly WINDOW_CONFIG = {
    WIDTH: 620,
    HEIGHT: 920,
    MARGIN: 10,
  };

  constructor() {}

  /**
   * 创建通知窗口
   */
  createWindow(options: NotificationWindow): BrowserWindow {
    // 如果窗口已存在，先关闭
    this.closeWindow(options.uuid);

    const position = this.calculatePosition();
    const window = this.buildWindow(position);

    this.setupWindowEvents(window, options.uuid);
    this.windows.set(options.uuid, window);
    console.log('NotificationWindowManager - Window created:', options.uuid);
    return window;
  }

  /**
   * 关闭指定窗口
   */
  closeWindow(uuid: string): boolean {
    const window = this.windows.get(uuid);
    if (window && !window.isDestroyed()) {
      window.close();
      return true;
    }
    return false;
  }

  /**
   * 获取窗口
   */
  getWindow(uuid: string): BrowserWindow | undefined {
    return this.windows.get(uuid);
  }

  /**
   * 获取所有窗口
   */
  getAllWindows(): Map<string, BrowserWindow> {
    return new Map(this.windows);
  }

  /**
   * 计算窗口位置
   */
  private calculatePosition(): { x: number; y: number } {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth } = primaryDisplay.workAreaSize;

    const x =
      screenWidth -
      NotificationWindowManager.WINDOW_CONFIG.WIDTH -
      NotificationWindowManager.WINDOW_CONFIG.MARGIN;
    const y =
      NotificationWindowManager.WINDOW_CONFIG.MARGIN +
      this.windows.size *
        (NotificationWindowManager.WINDOW_CONFIG.HEIGHT +
          NotificationWindowManager.WINDOW_CONFIG.MARGIN);

    return { x, y };
  }

  /**
   * 构建窗口
   */
  private buildWindow(position: { x: number; y: number }): BrowserWindow {
    return new BrowserWindow({
      width: NotificationWindowManager.WINDOW_CONFIG.WIDTH,
      height: NotificationWindowManager.WINDOW_CONFIG.HEIGHT,
      x: position.x,
      y: position.y,
      frame: false,
      transparent: true,
      resizable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      show: false,
      backgroundColor: '#00000000',
      webPreferences: {
        preload: path.join(MAIN_DIST, 'main_preload.mjs'),
        contextIsolation: true,
        nodeIntegration: true,
        webSecurity: false,
      },
    });
  }

  /**
   * 设置窗口事件
   */
  private setupWindowEvents(window: BrowserWindow, uuid: string): void {
    // CSP 设置
    window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
          ],
        },
      });
    });

    // 窗口关闭事件
    window.on('closed', () => {
      this.windows.delete(uuid);
      this.reorderWindows();
    });
  }

  /**
   * 重新排列窗口位置
   */
  reorderWindows(): void {
    let index = 0;
    for (const [, window] of this.windows) {
      if (!window.isDestroyed()) {
        const y =
          NotificationWindowManager.WINDOW_CONFIG.MARGIN +
          index *
            (NotificationWindowManager.WINDOW_CONFIG.HEIGHT +
              NotificationWindowManager.WINDOW_CONFIG.MARGIN);
        window.setPosition(window.getPosition()[0], y);
        index++;
      }
    }
  }

  /**
   * 构建通知URL
   */
  buildNotificationUrl(options: NotificationWindow): string {
    const queryParams = new URLSearchParams({
      uuid: options.uuid,
      title: options.title,
      body: options.body,
      importance: options.importance,
    });

    if (options.actions) {
      queryParams.append('actions', encodeURIComponent(JSON.stringify(options.actions)));
    }

    return VITE_DEV_SERVER_URL
      ? `${VITE_DEV_SERVER_URL}#/notification?${queryParams.toString()}`
      : `file://${RENDERER_DIST}/index.html#/notification?${queryParams.toString()}`;
  }
}
