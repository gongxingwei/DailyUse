import { BrowserWindow } from 'electron';
import { EventEmitter } from 'events';
import path from 'path';
import { WindowConfig, IBaseWindow } from './types';

/**
 * 基础窗口类
 * 提供所有窗口的通用功能
 */
export abstract class BaseWindow extends EventEmitter implements IBaseWindow {
  protected window: BrowserWindow | null = null;
  protected config: WindowConfig;
  protected isInitialized = false;
  protected isDestroyed = false;

  constructor(config: WindowConfig) {
    super();
    this.config = config;
  }

  /**
   * 初始化窗口
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized || this.isDestroyed) {
      return;
    }

    console.log(`🪟 [${this.constructor.name}] 初始化窗口`);

    // 创建窗口
    this.window = new BrowserWindow({
      ...this.config,
      webPreferences: {
        ...this.config.webPreferences,
        preload: this.getPreloadPath(),
      }
    });

    // 设置窗口事件
    this.setupWindowEvents();

    // 设置CSP
    this.setupCSP();

    // 加载页面
    await this.loadPage();

    // 执行子类的初始化逻辑
    await this.onInitialized();

    this.isInitialized = true;
    this.emit('window-ready');

    console.log(`✅ [${this.constructor.name}] 窗口初始化完成`);
  }

  /**
   * 显示窗口
   */
  public show(): void {
    if (this.window && !this.isDestroyed) {
      this.window.show();
      this.window.focus();
    }
  }

  /**
   * 隐藏窗口
   */
  public hide(): void {
    if (this.window && !this.isDestroyed) {
      this.window.hide();
    }
  }

  /**
   * 关闭窗口
   */
  public close(): void {
    if (this.window && !this.isDestroyed) {
      this.window.close();
    }
  }

  /**
   * 销毁窗口
   */
  public destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    console.log(`🧹 [${this.constructor.name}] 销毁窗口`);

    this.isDestroyed = true;

    if (this.window) {
      this.window.destroy();
      this.window = null;
    }

    this.removeAllListeners();
  }

  /**
   * 获取窗口实例
   */
  public getWindow(): BrowserWindow | null {
    return this.window;
  }

  /**
   * 检查窗口是否可见
   */
  public isVisible(): boolean {
    return this.window ? this.window.isVisible() : false;
  }

  /**
   * 聚焦窗口
   */
  public focus(): void {
    if (this.window && !this.isDestroyed) {
      this.window.focus();
    }
  }

  /**
   * 获取预加载脚本路径
   */
  protected abstract getPreloadPath(): string;

  /**
   * 获取页面URL或文件路径
   */
  protected abstract getPageUrl(): string;

  /**
   * 子类初始化钩子
   */
  protected async onInitialized(): Promise<void> {
    // 子类可以重写此方法
  }

  /**
   * 设置窗口事件
   */
  private setupWindowEvents(): void {
    if (!this.window) return;

    // 窗口关闭事件
    this.window.on('closed', () => {
      console.log(`🚪 [${this.constructor.name}] 窗口关闭`);
      this.window = null;
      this.emit('window-closed');
    });

    // 窗口最小化事件
    this.window.on('minimize', () => {
      this.emit('window-minimized');
    });

    // 窗口最大化事件
    this.window.on('maximize', () => {
      this.emit('window-maximized');
    });

    // 窗口恢复事件
    this.window.on('restore', () => {
      this.emit('window-restored');
    });

    // 窗口聚焦事件
    this.window.on('focus', () => {
      this.emit('window-focused');
    });

    // 窗口失焦事件
    this.window.on('blur', () => {
      this.emit('window-blurred');
    });

    // 窗口准备显示事件
    this.window.on('ready-to-show', () => {
      console.log(`✨ [${this.constructor.name}] 窗口准备显示`);
      if (this.config.show) {
        this.window?.show();
      }
    });
  }

  /**
   * 设置内容安全策略
   */
  private setupCSP(): void {
    if (!this.window) return;

    const cspDirectives = {
      'default-src': ["'self'", 'local:'],
      'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'blob:', 'local:'],
      'connect-src': ["'self'", 'ws:', 'wss:', 'http:', 'https:', 'local:'],
    };

    this.window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
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
  }

  /**
   * 加载页面
   */
  private async loadPage(): Promise<void> {
    if (!this.window) return;

    const pageUrl = this.getPageUrl();
    
    if (pageUrl.startsWith('http')) {
      await this.window.loadURL(pageUrl);
    } else {
      await this.window.loadFile(pageUrl);
    }
  }

  /**
   * 获取公共资源路径
   */
  protected getPublicPath(): string {
    return process.env.VITE_PUBLIC || path.join(process.env.APP_ROOT || '', 'public');
  }

  /**
   * 获取主进程分发目录
   */
  protected getMainDistPath(): string {
    return process.env.MAIN_DIST || path.join(process.env.APP_ROOT || '', 'dist-electron');
  }

  /**
   * 获取渲染进程分发目录
   */
  protected getRendererDistPath(): string {
    return process.env.RENDERER_DIST || path.join(process.env.APP_ROOT || '', 'dist');
  }

  /**
   * 获取开发服务器URL
   */
  protected getDevServerUrl(): string | null {
    return process.env.VITE_DEV_SERVER_URL || null;
  }

  /**
   * 向渲染进程发送消息
   */
  protected sendToRenderer(channel: string, ...args: any[]): void {
    if (this.window && !this.isDestroyed) {
      this.window.webContents.send(channel, ...args);
    }
  }
}
