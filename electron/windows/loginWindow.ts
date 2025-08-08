import path from 'path';
import { BaseWindow } from './baseWindow';
import { WindowConfig, ILoginWindow } from './types';

/**
 * 登录窗口类
 * 负责处理用户登录界面
 */
export class LoginWindow extends BaseWindow implements ILoginWindow {
  constructor() {
    const config: WindowConfig = {
      width: 400,
      height: 700,
      resizable: false,
      maximizable: false,
      minimizable: true,
      frame: false,
      show: false,
      title: 'DailyUse - 登录',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        webSecurity: true,
        preload: '',
        additionalArguments: ['--enable-features=SharedArrayBuffer'],
        allowRunningInsecureContent: false,
      },
    };

    super(config);
  }

  /**
   * 获取预加载脚本路径
   */
  protected getPreloadPath(): string {
    return path.join(this.getMainDistPath(), 'login_preload.mjs');
  }

  /**
   * 获取页面URL
   */
  protected getPageUrl(): string {
    const devServerUrl = this.getDevServerUrl();

    if (devServerUrl) {
      return `${devServerUrl}#/login`;
    }

    return path.join(this.getRendererDistPath(), 'index.html');
  }

  /**
   * 初始化完成后的钩子
   */
  protected async onInitialized(): Promise<void> {
    this.setupLoginWindowEvents();
    if (this.window) {
      // 强制跳转到 hash 路由
      this.window?.webContents.executeJavaScript(`window.location.hash = '#/login'`);

      // 注册 F12 快捷键切换开发者工具
      this.window.webContents.openDevTools();
    }
  }
  /**
   * 切换开发者工具
   */
  public toggleDevTools(): void {
    if (this.window) {
      if (this.window.webContents.isDevToolsOpened()) {
        this.window.webContents.closeDevTools();
      } else {
        this.window.webContents.openDevTools();
      }
    }
  }

  /**
   * 设置登录窗口特有的事件
   */
  private setupLoginWindowEvents(): void {
    if (!this.window) return;

    // 监听登录成功事件
    this.window.webContents.on('ipc-message', (_event, channel, ...args) => {
      console.log(`[LoginWindow] 接收到IPC消息: ${channel}`, args);
      switch (channel) {
        case 'login:success':
          console.log('✅ [LoginWindow] 登录成功');
          this.emit('login-success', args[0]);
          break;
        case 'login:failed':
          console.log('❌ [LoginWindow] 登录失败');
          this.emit('login-failed', args[0]);
          break;
        case 'login:cancelled':
          console.log('🚫 [LoginWindow] 登录取消');
          this.emit('login-cancelled');
          break;
      }
    });

    // 监听窗口控制事件
    this.window.webContents.on('ipc-message', (_event, channel, command) => {
      if (channel === 'window-control') {
        this.handleWindowControl(command);
      }
    });
  }

  /**
   * 处理窗口控制命令
   */
  private handleWindowControl(command: string): void {
    switch (command) {
      case 'minimize':
        this.window?.minimize();
        break;
      case 'close':
        this.close();
        break;
    }
  }

  /**
   * 重置登录表单
   */
  public resetForm(): void {
    this.sendToRenderer('login:reset-form');
  }

  /**
   * 显示错误消息
   */
  public showError(message: string): void {
    this.sendToRenderer('login:show-error', message);
  }

  /**
   * 显示窗口
   */
  public show(): void {
    super.show();

    // 窗口居中显示
    this.centerWindow();
  }

  /**
   * 窗口居中
   */
  private centerWindow(): void {
    if (this.window) {
      this.window.center();
    }
  }

  /**
   * 设置登录状态
   */
  public setLoginState(state: 'idle' | 'loading' | 'success' | 'error'): void {
    this.sendToRenderer('login:set-state', state);
  }

  /**
   * 发送登录结果
   */
  public sendLoginResult(result: { success: boolean; message?: string; userData?: any }): void {
    this.sendToRenderer('login:result', result);
  }
}
