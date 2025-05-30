import { app, globalShortcut, ipcMain, BrowserWindow, dialog, shell } from 'electron';
import { ElectronPlugin, PluginMetadata } from '../../core/types';
import { exec, ExecOptions } from 'child_process';
import path from 'path';
import { VITE_DEV_SERVER_URL, MAIN_DIST, RENDERER_DIST } from '../../../../electron/main';

export class QuickLauncherMainPlugin implements ElectronPlugin {
  metadata: PluginMetadata = {
    name: 'quickLauncher',
    version: '1.0.0',
    description: 'Quick application launcher with shortcuts',
    author: 'bakersean',
  };

  private quickLauncherWindow: Electron.BrowserWindow | null = null;

  createQuickLauncherWindow() {
    if (this.quickLauncherWindow) {
      // 如果窗口存在，切换显示/隐藏状态
      if (this.quickLauncherWindow.isVisible()) {
        this.quickLauncherWindow.hide();
      } else {
        this.quickLauncherWindow.show();
        this.quickLauncherWindow.focus();
      }
      return;
    }

    const preloadPath = path.resolve(MAIN_DIST, 'quickLauncher_preload.mjs');

    this.quickLauncherWindow = new BrowserWindow({
      width: 1024,
      height: 576,
      frame: false,
      skipTaskbar: true,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        sandbox: false,
        preload: preloadPath,
        webSecurity: true
      }
    });

    // 设置内容安全策略
    this.quickLauncherWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
          ]
        }
      });
    });

    // 加载完成后再显示窗口，避免白屏
    this.quickLauncherWindow.once('ready-to-show', () => {
      if (this.quickLauncherWindow) {
        this.quickLauncherWindow.show();
        this.quickLauncherWindow.focus();
      }
    });

    // Load the quick launcher URL
    if (VITE_DEV_SERVER_URL) {
      this.quickLauncherWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/src/plugins/quickLauncher/index.html`);
    } else {
      this.quickLauncherWindow.loadFile(
        path.join(RENDERER_DIST, 'src/plugins/quickLauncher/index.html')
      );
    }

    // 移除blur事件处理
    this.quickLauncherWindow.on('closed', () => {
      this.quickLauncherWindow = null;
    });
  }

  async init(): Promise<void> {
    this.registerIpcHandlers();
    this.registerShortcuts();
  }

  registerIpcHandlers(): void {  
    // 注册IPC处理器来处理应用程序启动请求
    ipcMain.handle('launch-application', async (_, path: string) => {
      return new Promise((resolve, reject) => {
        const options: ExecOptions = { windowsHide: false };  // 使用合法的选项
        exec(`start "" "${path}"`, options, (error) => {
          if (error) {
            console.error('[QuickLauncherMain] 启动应用失败:', error);
            reject(error);
          } else {

            resolve(true);
          }
        });
      });
    });

    ipcMain.handle('select-file', async () => {
      const result = await dialog.showOpenDialog({
        properties: ['openFile']
      });
      return result;
    });

    ipcMain.handle('get-file-icon', async (_event, filePath) => {
      try {
        // 获取文件图标
        const icon = await app.getFileIcon(filePath, {
          size: 'large' // 可选值: 'small', 'normal', 'large'
        });
        
        // 将图标转换为base64字符串
        return icon.toDataURL();
      } catch (error) {
        console.error('获取文件图标失败:', error);
        return null;
      }
    });

    ipcMain.handle('get-link-file-target-path', async (_, shortcutPath) => {
      try {
        const normalizedPath = path.win32.normalize(shortcutPath);
        const target = shell.readShortcutLink(normalizedPath);
        const targetPath = target.target;
        return targetPath;
      } catch (error) {
        console.error('Failed to read shortcut target path:', error);
        return '';
      }
    });

    ipcMain.handle('reveal-in-explorer', async (_, filePath) => {
      try {
        shell.showItemInFolder(filePath);
        return true;
      }
      catch (error) {
        console.error('Failed to reveal in explorer:', error);
        return false;
      }
    });

    ipcMain.handle('hide-window', async () => {
      try {
        this.quickLauncherWindow?.hide();
        return true;
      } catch (error) {
        console.error('failed to hide window',error);
        return false;
      }
    })
  }

  
  registerShortcuts(): void {
    // 注册全局快捷键
    globalShortcut.register('Alt+Space', () => {
      if (this.quickLauncherWindow) {
        if (this.quickLauncherWindow.isVisible()) {
          this.quickLauncherWindow.hide();
        } else {
          this.quickLauncherWindow.show();
          this.quickLauncherWindow.focus();
        }
      } else {
        this.createQuickLauncherWindow();
        
      }
    });
  }

  async destroy(): Promise<void> {
    globalShortcut.unregister('Alt+Space');
    ipcMain.removeHandler('launch-application');
    ipcMain.removeHandler('select-file');
    if (this.quickLauncherWindow) {
      this.quickLauncherWindow.close();
      this.quickLauncherWindow = null;
    }
  }
}
