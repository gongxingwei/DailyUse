import { app, BrowserWindow, ipcMain, dialog, clipboard, screen, Tray, Menu, nativeImage } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { promises as fs } from 'fs';
import { join } from 'path';

// 存储通知窗口的Map
const notificationWindows = new Map<string, BrowserWindow>();

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null;
let popupWindow: BrowserWindow | null;
let tray: Tray | null = null

function createWindow() {
  win = new BrowserWindow({
    frame: false,
    icon: path.join(process.env.VITE_PUBLIC, 'DailyUse.svg'),
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.mjs'),
    },
    width: 1400,
    height: 800,
  })

  // win.setMenu(null)

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  // 可选：设置最小窗口大小
  win.setMinimumSize(800, 600)

  createTray(win)

  // 修改窗口关闭行为
  win.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      win?.hide()
    }
    return false
  })
}

function createTray(win: BrowserWindow) {
  // 使用已有的ico文件
  const icon = nativeImage.createFromPath(join(__dirname, '../public/DailyUse-256.ico'))
  tray = new Tray(icon)

  // 设置托盘图标提示文字
  tray.setToolTip('DailyUse')

  // 创建托盘菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        win.show()
      }
    },
    {
      label: '设置',
      click: () => {
        win.show()
        win.webContents.send('navigate-to', '/setting')
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit()
      }
    }
  ])

  // 设置托盘菜单
  tray.setContextMenu(contextMenu)

  // 点击托盘图标显示主窗口
  tray.on('click', () => {
    win.show()
  })
}

function createPopupWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const popupWidth = 950;
  const popupHeight = 1400;

  popupWindow = new BrowserWindow({
    width: popupWidth,
    height: popupHeight,
    frame: true,
    title: '弹窗',
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    parent: win || undefined,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      webSecurity: false,
      nodeIntegration: true,
    },
  });

  const x = width - popupWidth - 10; // 10 像素的边距
  const y = height - popupHeight - 10; // 10 像素的边距

  popupWindow.setBounds({ x, y, width: popupWidth, height: popupHeight });

  if (process.env.VITE_DEV_SERVER_URL) {
    popupWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/#/popup`);
  } else {
    popupWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'popup' });
  }

  //popupWindow.setMenu(null);

  popupWindow.on('closed', () => {
    popupWindow = null; // 清除对 popupWindow 实例的引用
  });

  popupWindow.once('ready-to-show', () => {
    popupWindow?.show();
    // 动态设置窗口标题
    popupWindow?.setTitle('弹窗');
    // 打开开发者工具
    popupWindow?.webContents.openDevTools();
  });

  
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  ipcMain.on('newPopup', () => {
    if (!popupWindow) {
      createPopupWindow();
    } else {
      popupWindow.show();
    }
  });

  ipcMain.on('closePopup', () => {
    if (popupWindow) {
      popupWindow.close();
      popupWindow = null;
    }
  });

});

// 创建文件夹
ipcMain.handle('createFolder', async (_event, filePath: string) => {
  await fs.mkdir(filePath, { recursive: true });
});

// 创建文件
ipcMain.handle('createFile', async (_event, filePath: string, content: string = '') => {
  await fs.writeFile(filePath, content, 'utf8');
});

// 删除文件或文件夹
ipcMain.handle('deleteFileOrFolder', async (_event, path: string, isDirectory: boolean) => {
  if (isDirectory) {
    await fs.rm(path, { recursive: true, force: true });
  } else {
    await fs.unlink(path);
  }
});

// 选择文件夹
ipcMain.handle('selectFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (result.canceled) {
    return null;
  } else {
    const folderPath = result.filePaths[0];
    const files = await fs.readdir(folderPath).then((fileNames) =>
      Promise.all(
        fileNames.map(async (fileName) => {
          const filePath = path.join(folderPath, fileName);
          const stats = await fs.lstat(filePath);
          return {
            name: fileName,
            path: filePath,
            isDirectory: stats.isDirectory(),
          };
        })
      )
    );
    return { folderPath, files };
  }
});

// 读取文件
ipcMain.handle('readFile', async (_event, filePath) => {
  return await fs.readFile(filePath, 'utf8');
});

// 写入文件
ipcMain.handle('writeFile', async (_event, filePath: string, content: string) => {
  try {
    await fs.writeFile(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error('写入文件失败:', error);
    throw error;
  }
});

// 获取根目录
ipcMain.handle('getRootDir', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  if (!result.canceled) {
    const directoryPath = result.filePaths[0];
    const folderTreeData = await generateTree(directoryPath);
    return { folderTreeData, directoryPath };
  }

  return null;
});

async function generateTree(dir: string): Promise<any[]> {
  try {
    const items = await fs.readdir(dir, { withFileTypes: true });
    const children = await Promise.all(
      items.map(async (item) => {
        const fullPath = path.join(dir, item.name);
        const fileType = item.isDirectory() ? 'directory' : path.extname(item.name).slice(1) || 'file';
        if (item.isDirectory()) {
          return {
            title: item.name,
            key: fullPath,
            fileType: fileType,
            children: await generateTree(fullPath),
          };
        } else {
          return {
            title: item.name,
            key: fullPath,
            fileType: fileType,
            isLeaf: true,
          };
        }
      })
    );
    return children.filter(Boolean);
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
    return [];
  }
}

// 通知窗口的位置管理
const NOTIFICATION_WIDTH = 320;
const NOTIFICATION_HEIGHT = 120;
const NOTIFICATION_MARGIN = 10;

// 获取通知窗口的位置
function getNotificationPosition(): { x: number, y: number } {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workAreaSize;
  
  // 计算新通知的位置
  const x = screenWidth - NOTIFICATION_WIDTH - NOTIFICATION_MARGIN;
  const y = NOTIFICATION_MARGIN + (notificationWindows.size * (NOTIFICATION_HEIGHT + NOTIFICATION_MARGIN));
  
  return { x, y };
}

// 重新排列所有通知窗口
function reorderNotifications() {
  let index = 0;
  for (const [, window] of notificationWindows) {
    const y = NOTIFICATION_MARGIN + (index * (NOTIFICATION_HEIGHT + NOTIFICATION_MARGIN));
    window.setPosition(window.getPosition()[0], y);
    index++;
  }
}

// 处理桌面通知
ipcMain.handle('show-notification', async (_event, options: {
  id: string
  title: string
  body: string
  icon?: string
  urgency?: 'normal' | 'critical' | 'low'
  actions?: Array<{ text: string, type: 'confirm' | 'cancel' | 'action' }>
}) => {
  console.log('主进程收到显示通知请求:', options);
  
  if (!win) {
    console.error('主窗口未创建，无法显示通知');
    return;
  }

  // 如果存在相同ID的通知，先关闭它
  if (notificationWindows.has(options.id)) {
    console.log('关闭已存在的相同ID通知:', options.id);
    const existingWindow = notificationWindows.get(options.id);
    existingWindow?.close();
    notificationWindows.delete(options.id);
    reorderNotifications();
  }

  // 获取新通知的位置
  const { x, y } = getNotificationPosition();
  console.log('新通知位置:', { x, y });

  // 创建通知窗口
  console.log('创建通知窗口...');
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
      preload: path.join(MAIN_DIST, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: true,
      webSecurity: false
    }
  });

  // 存储窗口引用
  notificationWindows.set(options.id, notificationWindow);
  console.log('通知窗口已存储，当前活动通知数:', notificationWindows.size);

  // 监听窗口准备就绪事件
  notificationWindow.once('ready-to-show', () => {
    console.log('通知窗口准备就绪');
    if (!notificationWindow.isDestroyed()) {
      notificationWindow.show();
      console.log('通知窗口已显示');
    }
  });

  // 监听窗口关闭
  notificationWindow.on('closed', () => {
    console.log('通知窗口已关闭:', options.id);
    notificationWindows.delete(options.id);
    reorderNotifications();
  });

  try {
    // 加载通知页面
    const url = VITE_DEV_SERVER_URL 
      ? `${VITE_DEV_SERVER_URL}#/notification?${new URLSearchParams(options as any)}`
      : `file://${path.join(RENDERER_DIST, 'index.html')}#/notification?${new URLSearchParams(options as any)}`;
    
    console.log('加载通知页面:', url);
    
    if (VITE_DEV_SERVER_URL) {
      await notificationWindow.loadURL(url);
    } else {
      await notificationWindow.loadFile(path.join(RENDERER_DIST, 'index.html'), {
        hash: `/notification?${new URLSearchParams(options as any)}`
      });
    }
    console.log('通知页面加载成功');
  } catch (error) {
    console.error('加载通知页面失败:', error);
    notificationWindow.close();
    return options.id;
  }

  return options.id;
});

// 通知相关的IPC处理
ipcMain.on('notification-action', (_event, id: string, action: { text: string, type: string }) => {
  const window = notificationWindows.get(id);
  if (window) {
    window.close();
    notificationWindows.delete(id);
    reorderNotifications();
  }
  win?.webContents.send('notification-action', id, action);
});

ipcMain.on('close-notification', (_event, id: string) => {
  const window = notificationWindows.get(id);
  if (window) {
    window.close();
    notificationWindows.delete(id);
    reorderNotifications();
    win?.webContents.send('notification-action', id, { text: 'close', type: 'action' });
  }
});

// 重命名文件或文件夹
ipcMain.handle('renameFileOrFolder', async (_event, oldPath: string, newPath: string) => {
  try {
    // 检查新路径是否已存在
    const exists = await fs.access(newPath)
      .then(() => true)
      .catch(() => false);

    if (exists) {
      // 如果目标已存在，弹出确认对话框
      const { response } = await dialog.showMessageBox({
        type: 'question',
        buttons: ['覆盖', '取消'],
        defaultId: 1,
        title: '确认覆盖',
        message: '目标已存在，是否覆盖？',
        detail: `目标路径: ${newPath}`
      });

      if (response === 1) {
        return false;
      }
    }

    // 执行重命名
    await fs.rename(oldPath, newPath);
    return true;
  } catch (error) {
    console.error('Rename error:', error);
    throw error;
  }
});

// 读取剪贴板文本
ipcMain.handle('readClipboard', () => {
  return clipboard.readText();
});

// 写入剪贴板文本
ipcMain.handle('writeClipboard', (_event, text: string) => {
  clipboard.writeText(text);
});

// 读取剪贴板文件列表
ipcMain.handle('readClipboardFiles', () => {
  // 在 Windows 上，可以通过 formats 检查是否有文件
  const formats = clipboard.availableFormats();
  if (formats.includes('FileNameW')) {
    // 读取文件列表
    return clipboard.read('FileNameW')
      .split('\0')  // 文件路径以 null 字符分隔
      .filter(Boolean);  // 移除空字符串
  }
  return [];
});

// 写入文件路径到剪贴板
ipcMain.handle('writeClipboardFiles', (_event, filePaths: string[]) => {
  clipboard.writeBuffer('FileNameW', Buffer.from(filePaths.join('\0') + '\0', 'ucs2'));
});

// 刷新文件夹
ipcMain.handle('refreshFolder', async (_event, directoryPath: string) => {
  const folderTreeData = await generateTree(directoryPath)
  return { folderTreeData, directoryPath }
})

// 窗口控制
ipcMain.on('window-control', (_event, command) => {
  switch (command) {
    case 'minimize':
      win?.minimize()
      break
    case 'maximize':
      if (win?.isMaximized()) {
        win?.unmaximize()
      } else {
        win?.maximize()
      }
      break
    case 'close':
      win?.close()
      break
  }
})

// 设置开机自启动
ipcMain.handle('get-auto-launch', () => {
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle('set-auto-launch', (_event, enable: boolean) => {
  if (process.platform === 'win32') {
    app.setLoginItemSettings({
      openAtLogin: enable,
      path: process.execPath
    });
  }
  return app.getLoginItemSettings().openAtLogin;
});

app.on('before-quit', () => {
  app.isQuitting = true
})