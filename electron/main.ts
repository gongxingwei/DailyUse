import { app, ipcMain, clipboard, protocol, shell } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PluginManager } from '../src/plugins/core/PluginManager';
import { QuickLauncherMainPlugin } from '../src/plugins/quickLauncher/electron/main';
import { initializeApp, cleanupApp } from './shared/initialization/appInitializer';
import { WindowManager } from './windows/windowManager';


// console.log = (...args) => { logToFile("info", ...args); };
// console.error = (...args) => { logToFile("error", ...args); };
// console.warn = (...args) => { logToFile("warn", ...args); };

console.log('🎯 [Main] 主进程脚本开始执行');

// 早期错误捕获
process.on('uncaughtException', (error) => {
  console.error('💥 [Main] 早期未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 [Main] 早期未处理的Promise拒绝:', reason, promise);
});

// 设置应用名称
app.setName('DailyUse');

// 防止软件崩溃以及兼容性设置
// 这些设置可以根据需要启用
// app.commandLine.appendSwitch('disable-webgl');
// app.commandLine.appendSwitch('disable-webgl2');
// app.commandLine.appendSwitch('use-gl', 'swiftshader');
// app.commandLine.appendSwitch('no-sandbox');
// app.commandLine.appendSwitch('disable-gpu');
// app.disableHardwareAcceleration();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 构建目录结构
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..');

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

// 设置环境变量供插件和窗口管理器使用
process.env.MAIN_DIST = MAIN_DIST;
process.env.RENDERER_DIST = RENDERER_DIST;
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

// 全局实例
let windowManager: WindowManager | null = null;
let pluginManager: PluginManager | null = null;

/**
 * 初始化插件管理器
 */
function initializePlugins(): void {
  console.log('🔌 [Main] 初始化插件管理器');
  
  pluginManager = new PluginManager();
  
  // 注册插件
  pluginManager.register(new QuickLauncherMainPlugin());
  
  // 初始化所有插件
  pluginManager.initializeAll();
  
  console.log('✅ [Main] 插件管理器初始化完成');
}

/**
 * 注册协议处理器
 */
function registerProtocols(): void {
  console.log('🔗 [Main] 注册协议处理器');
  
  // 注册local协议用于本地文件访问
  protocol.registerFileProtocol('local', (request, callback) => {
    const url = request.url.replace('local://', '');
    try {
      return callback(decodeURIComponent(url));
    } catch (error) {
      console.error('Protocol error:', error);
    }
  });
  
}

/**
 * 注册IPC处理器
 */
function registerIpcHandlers(): void {
  console.log('📡 [Main] 注册IPC处理器');
  
  // 剪贴板操作
  ipcMain.handle('readClipboard', () => {
    return clipboard.readText();
  });

  ipcMain.handle('writeClipboard', (_event, text: string) => {
    clipboard.writeText(text);
  });

  ipcMain.handle('readClipboardFiles', () => {
    const formats = clipboard.availableFormats();
    if (formats.includes('FileNameW')) {
      return clipboard.read('FileNameW')
        .split('\0')
        .filter(Boolean);
    }
    return [];
  });

  // 外部链接处理
  ipcMain.handle('open-external-url', async (_event, url: string) => {
    try {
      await shell.openExternal(url);
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  });

  // 自启动设置
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

  // 模块状态查询
  ipcMain.handle('get-module-status', () => {
    const { getInitializationStatus } = require('./shared/initialization/appInitializer');
    return getInitializationStatus();
  });

  // 窗口控制
  ipcMain.on('window-control', (_event, command) => {
    const currentWindow = windowManager?.getCurrentWindow();
    if (currentWindow) {
      switch (command) {
        case 'minimize':
          currentWindow.minimize();
          break;
        case 'maximize':
          if (currentWindow.isMaximized()) {
            currentWindow.unmaximize();
          } else {
            currentWindow.maximize();
          }
          break;
        case 'close':
          currentWindow.close();
          break;
      }
    }
  });

  console.log('✅ [Main] IPC处理器注册完成');
}

/**
 * 应用初始化
 */
async function initializeApplication(): Promise<void> {
  console.log('🚀 [Main] 开始应用初始化');
  
  try {
    // 初始化窗口管理器
    console.log('🪟 [Main] 正在创建 WindowManager 实例...');
    try {
      windowManager = new WindowManager();
      console.log('🪟 [Main] WindowManager 实例创建完成，开始初始化...');
    } catch (error) {
      console.error('💥 [Main] WindowManager 实例创建失败:', error);
      throw error;
    }
    
    try {
      await windowManager.initialize();
      console.log('🪟 [Main] WindowManager 初始化完成');
    } catch (error) {
      console.error('💥 [Main] WindowManager 初始化失败:', error);
      throw error;
    }
    
    // 初始化插件
    initializePlugins();
    
    // 注册协议
    registerProtocols();
    
    // 注册IPC处理器
    registerIpcHandlers();
    
    // 初始化应用模块
    await initializeApp();
    
    console.log('✅ [Main] 应用初始化完成');
  } catch (error) {
    console.error('❌ [Main] 应用初始化失败:', error);
    app.quit();
  }
}

/**
 * 应用清理
 */
async function cleanupApplication(): Promise<void> {
  console.log('🧹 [Main] 开始应用清理');
  
  try {
    // 清理应用模块
    await cleanupApp();
    
    // 清理窗口管理器
    windowManager?.destroy();
    windowManager = null;
    
    // 清理插件管理器
    pluginManager = null;
    
    console.log('✅ [Main] 应用清理完成');
  } catch (error) {
    console.error('❌ [Main] 应用清理失败:', error);
  }
}

console.log('🎯 [Main] 准备设置应用事件监听器');

// 应用事件处理
app.whenReady().then(async () => {
  console.log('🎯 [Main] 应用就绪，开始初始化');
  try {
    await initializeApplication();
    console.log('🎯 [Main] 主进程初始化完成');
  } catch (error) {
    console.error('💥 [Main] 主进程初始化失败:', error);
  }
});

app.on('activate', () => {
  console.log('🔄 [Main] 应用被激活');
  if (!windowManager) {
    initializeApplication();
  }
});

app.on('before-quit', async () => {
  console.log('🛑 [Main] 应用即将退出');
  await cleanupApplication();
});

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('💥 [Main] 未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 [Main] 未处理的Promise拒绝:', reason, promise);
});

console.log('🎯 [Main] 主进程脚本执行完成，等待应用就绪事件');