import { BrowserWindow, ipcMain, screen } from 'electron';
import path from 'node:path';

const notificationWindows = new Map<string, BrowserWindow>();

const NOTIFICATION_WIDTH = 320;
const NOTIFICATION_HEIGHT = 120;
const NOTIFICATION_MARGIN = 10;

function getNotificationPosition(): { x: number, y: number } {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workAreaSize;
  const x = screenWidth - NOTIFICATION_WIDTH - NOTIFICATION_MARGIN;
  const y = NOTIFICATION_MARGIN + (notificationWindows.size * (NOTIFICATION_HEIGHT + NOTIFICATION_MARGIN));
  return { x, y };
}

function reorderNotifications() {
  let index = 0;
  for (const [, window] of notificationWindows) {
    const y = NOTIFICATION_MARGIN + (index * (NOTIFICATION_HEIGHT + NOTIFICATION_MARGIN));
    window.setPosition(window.getPosition()[0], y);
    index++;
  }
}

export function setupNotificationHandlers(mainWindow: BrowserWindow, MAIN_DIST: string, RENDERER_DIST: string, VITE_DEV_SERVER_URL: string | undefined) {
  ipcMain.handle('show-notification', async (_event, options: {
    id: string
    title: string
    body: string
    icon?: string
    urgency?: 'normal' | 'critical' | 'low'
    actions?: Array<{ text: string, type: 'confirm' | 'cancel' | 'action' }>
  }) => {
    if (!mainWindow) {
      return;
    }

    if (notificationWindows.has(options.id)) {
      const existingWindow = notificationWindows.get(options.id);
      existingWindow?.close();
      notificationWindows.delete(options.id);
      reorderNotifications();
    }

    const { x, y } = getNotificationPosition();

    const notificationWindow = new BrowserWindow({
      width: NOTIFICATION_WIDTH,
      height: NOTIFICATION_HEIGHT,
      x,
      y,
      frame: false,
      transparent: true,
      resizable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      show: false,
      webPreferences: {
        preload: path.join(MAIN_DIST, 'main_preload.mjs'),
        contextIsolation: true,
        nodeIntegration: true,
        webSecurity: false
      }
    });

    notificationWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': ["default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"]
        }
      });
    });

    notificationWindows.set(options.id, notificationWindow);

    notificationWindow.on('closed', () => {
      notificationWindows.delete(options.id);
      reorderNotifications();
    });

    const queryParams = new URLSearchParams({
      id: options.id,
      title: options.title,
      body: options.body,
      urgency: options.urgency || 'normal'
    });

    if (options.icon) {
      queryParams.append('icon', options.icon);
    }

    if (options.actions) {
      queryParams.append('actions', encodeURIComponent(JSON.stringify(options.actions)));
    }

    const notificationUrl = VITE_DEV_SERVER_URL
      ? `${VITE_DEV_SERVER_URL}#/notification?${queryParams.toString()}`
      : `file://${RENDERER_DIST}/index.html#/notification?${queryParams.toString()}`;

    await notificationWindow.loadURL(notificationUrl);

    notificationWindow.show();

    return options.id;
  });

  ipcMain.on('close-notification', (_event, id: string) => {
    const window = notificationWindows.get(id);
    if (window && !window.isDestroyed()) {
      window.close();
    }
  });

  ipcMain.on('notification-action', (_event, id: string, action: { text: string, type: string }) => {
    const window = notificationWindows.get(id);
    if (window && !window.isDestroyed()) {
      if (action.type === 'confirm' || action.type === 'cancel') {
        window.close();
      }
      mainWindow.webContents.send('notification-action-received', id, action);
    }
  });
}