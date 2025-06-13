import { app, BrowserWindow, ipcMain, clipboard, Tray, Menu, nativeImage } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { PluginManager } from '../src/plugins/core/PluginManager';
import { QuickLauncherMainPlugin } from '../src/plugins/quickLauncher/electron/main';
import { shell } from 'electron';
import { protocol } from 'electron'
import { initializeAllModules } from './shared/moduleGroups';

app.setName('DailyUse');

// 防止软件崩溃以及兼容
// Add these WebGL specific switches
// app.commandLine.appendSwitch('disable-webgl');
// app.commandLine.appendSwitch('disable-webgl2');
// app.commandLine.appendSwitch('use-gl', 'swiftshader');  // Use software rendering

// app.commandLine.appendSwitch('no-sandbox');
// app.commandLine.appendSwitch('disable-gpu');
// app.commandLine.appendSwitch('disable-software-rasterizer');
// app.commandLine.appendSwitch('disable-gpu-compositing');
// app.commandLine.appendSwitch('disable-gpu-rasterization');
// app.commandLine.appendSwitch('disable-gpu-sandbox');
// app.commandLine.appendSwitch('--no-sandbox');
// app.disableHardwareAcceleration();

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

// 设置环境变量供插件使用
process.env.MAIN_DIST = MAIN_DIST
process.env.RENDERER_DIST = RENDERER_DIST
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null;
let tray: Tray | null = null
let pluginManager: PluginManager | null = null;

function createWindow() {
  win = new BrowserWindow({
    frame: false,
    icon: path.join(process.env.VITE_PUBLIC, 'DailyUse.svg'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(MAIN_DIST, 'main_preload.mjs'),
      additionalArguments: ['--enable-features=SharedArrayBuffer'],
      allowRunningInsecureContent: false,
    },
    width: 1400,
    height: 800,
  })
  win.webContents.openDevTools();
  // 设置 CSP
  const cspDirectives = {
    'default-src': ["'self'", "local:",],
    'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", "data:", "blob:", "local:",],
    'connect-src': ["'self'", "ws:", "wss:", "http:", "https:", "local:"],
  };
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const cspValue = Object.entries(cspDirectives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [cspValue],
      }
    });
  });
  // 初始化插件
  pluginManager = new PluginManager();
  if (win) {
    pluginManager.register(new QuickLauncherMainPlugin());
    pluginManager.initializeAll();
  }

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  win.setMinimumSize(800, 600)

  createTray(win)

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
  const icon = nativeImage.createFromPath(path.join(process.env.VITE_PUBLIC, 'DailyUse-16.png'))
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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  
  createWindow();
  if (win) {
    initializeAllModules();
  }
  protocol.registerFileProtocol('local', (request, callback) => {
    const url = request.url.replace('local://', '')
    try {
      return callback(decodeURIComponent(url))
    } catch (error) {
      console.error(error)
    }
  })
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
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

// // 写入文件路径到剪贴板
// ipcMain.handle('writeClipboardFiles', (_event, filePaths: string[]) => {
//   clipboard.writeBuffer('FileNameW', Buffer.from(filePaths.join('\0') + '\0', 'ucs2'));
// });

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

ipcMain.handle('open-external-url', async (_event, url: string) => {
  try {
    await shell.openExternal(url);
  } catch (error) {
    console.error('Failed to open URL:', error);
  }
});

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
  app.isQuitting = true;
})