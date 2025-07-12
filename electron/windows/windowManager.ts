import { BrowserWindow, app, Tray, nativeImage, Menu } from 'electron';
import path from 'path';
import { EventEmitter } from 'events';
import { LoginWindow } from './loginWindow';
import { MainWindow } from './mainWindow';
import { WindowType } from './types';

/**
 * 窗口管理器
 * 负责管理登录窗口和主窗口的生命周期、切换和状态管理
 */
export class WindowManager extends EventEmitter {
  private loginWindow: LoginWindow | null = null;
  private mainWindow: MainWindow | null = null;
  private tray: Tray | null = null;
  private currentWindow: WindowType = WindowType.LOGIN;

  constructor() {
    super();
    console.log('🪟 [WindowManager] 构造函数被调用');
    this.setupAppEvents();
    console.log('🪟 [WindowManager] 构造函数完成');
  }

  /**
   * 初始化窗口管理器
   */
  public async initialize(): Promise<void> {
    console.log('🪟 [WindowManager] 初始化窗口管理器');
    
    // 创建登录窗口
    await this.createLoginWindow();
    
    // 创建系统托盘
    this.createTray();
    
    console.log('✅ [WindowManager] 窗口管理器初始化完成');
  }

  /**
   * 创建登录窗口
   */
  private async createLoginWindow(): Promise<void> {
    if (this.loginWindow) {
      this.loginWindow.show();
      return;
    }

    console.log('🔐 [WindowManager] 创建登录窗口');
    
    this.loginWindow = new LoginWindow();
    await this.loginWindow.initialize();
    
    // 监听登录窗口事件
    this.loginWindow.on('login-success', (userData: any) => {
      console.log('✅ [WindowManager] 登录成功，切换到主窗口');
      this.switchToMainWindow(userData);
    });

    this.loginWindow.on('window-closed', () => {
      console.log('🔐 [WindowManager] 登录窗口关闭');
      this.loginWindow = null;
      if (!this.mainWindow) {
        this.quit();
      }
    });

    // 显示登录窗口
    this.loginWindow.show();
    console.log('✅ [WindowManager] 登录窗口已显示');

    this.currentWindow = WindowType.LOGIN;
  }

  /**
   * 创建主窗口
   */
  private async createMainWindow(): Promise<void> {
    if (this.mainWindow) {
      this.mainWindow.show();
      return;
    }

    console.log('🏠 [WindowManager] 创建主窗口');
    
    this.mainWindow = new MainWindow();
    await this.mainWindow.initialize();
    
    // 监听主窗口事件
    this.mainWindow.on('logout-requested', () => {
      console.log('🔐 [WindowManager] 注销请求，切换到登录窗口');
      this.switchToLoginWindow();
    });

    this.mainWindow.on('window-closed', () => {
      console.log('🏠 [WindowManager] 主窗口关闭');
      this.mainWindow = null;
      if (!this.loginWindow) {
        this.quit();
      }
    });

    this.currentWindow = WindowType.MAIN;
  }

  /**
   * 切换到主窗口
   */
  private async switchToMainWindow(userData?: any): Promise<void> {
    console.log('🔄 [WindowManager] 切换到主窗口');
    
    // 创建主窗口
    await this.createMainWindow();
    
    // 隐藏登录窗口
    if (this.loginWindow) {
      this.loginWindow.hide();
    }
    
    // 显示主窗口
    this.mainWindow?.show();
    
    // 发送用户数据到主窗口
    if (userData) {
      this.mainWindow?.sendUserData(userData);
    }
    
    this.currentWindow = WindowType.MAIN;
    this.emit('window-switched', WindowType.MAIN);
  }

  /**
   * 切换到登录窗口
   */
  private async switchToLoginWindow(): Promise<void> {
    console.log('🔄 [WindowManager] 切换到登录窗口');
    
    // 隐藏主窗口
    if (this.mainWindow) {
      this.mainWindow.hide();
    }
    
    // 创建或显示登录窗口
    await this.createLoginWindow();
    this.loginWindow?.show();
    
    this.currentWindow = WindowType.LOGIN;
    this.emit('window-switched', WindowType.LOGIN);
  }

  /**
   * 创建系统托盘
   */
  private createTray(): void {
    if (this.tray) {
      return;
    }

    console.log('🍽️ [WindowManager] 创建系统托盘');

    const iconPath = path.join(process.env.VITE_PUBLIC || '', 'DailyUse-16.png');
    const icon = nativeImage.createFromPath(iconPath);
    this.tray = new Tray(icon);

    this.tray.setToolTip('DailyUse');
    this.updateTrayMenu();

    // 点击托盘图标显示当前窗口
    this.tray.on('click', () => {
      this.showCurrentWindow();
    });
  }

  /**
   * 更新托盘菜单
   */
  private updateTrayMenu(): void {
    if (!this.tray) return;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示窗口',
        click: () => {
          this.showCurrentWindow();
        }
      },
      {
        label: this.currentWindow === WindowType.LOGIN ? '登录' : '设置',
        click: () => {
          if (this.currentWindow === WindowType.LOGIN) {
            this.loginWindow?.show();
          } else {
            this.mainWindow?.show();
            this.mainWindow?.navigateTo('/setting');
          }
        }
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          this.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  /**
   * 显示当前窗口
   */
  private showCurrentWindow(): void {
    if (this.currentWindow === WindowType.LOGIN) {
      this.loginWindow?.show();
    } else {
      this.mainWindow?.show();
    }
  }

  /**
   * 获取当前窗口类型
   */
  public getCurrentWindowType(): WindowType {
    return this.currentWindow;
  }

  /**
   * 获取当前活动窗口
   */
  public getCurrentWindow(): BrowserWindow | null {
    if (this.currentWindow === WindowType.LOGIN) {
      return this.loginWindow?.getWindow() || null;
    } else {
      return this.mainWindow?.getWindow() || null;
    }
  }

  /**
   * 设置应用事件处理
   */
  private setupAppEvents(): void {
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        this.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createLoginWindow();
      }
    });

    app.on('before-quit', () => {
      // 应用即将退出时设置标志
    });
  }

  /**
   * 退出应用
   */
  public quit(): void {
    console.log('🛑 [WindowManager] 退出应用');
    
    // 关闭所有窗口
    this.loginWindow?.close();
    this.mainWindow?.close();
    
    // 销毁托盘
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
    
    app.quit();
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    console.log('🧹 [WindowManager] 清理资源');
    
    this.loginWindow?.destroy();
    this.mainWindow?.destroy();
    
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
    
    this.removeAllListeners();
  }
}
