import path from "path";
import { BaseWindow } from "./baseWindow";
import { WindowConfig, IMainWindow, UserData } from "./types";
import { app } from "electron";
/**
 * 主窗口类
 * 负责处理主应用界面
 */
export class MainWindow extends BaseWindow implements IMainWindow {
  private userData: UserData | null = null;

  constructor() {
    const config: WindowConfig = {
      width: 1400,
      height: 800,
      resizable: true,
      maximizable: true,
      minimizable: true,
      frame: false,
      show: false,
      title: "DailyUse",
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        webSecurity: true,
        preload: "",
        additionalArguments: [
          "--enable-features=SharedArrayBuffer",
          "--window-type=main",
        ],
        allowRunningInsecureContent: false,
      },
    };

    super(config);
  }

  /**
   * 获取预加载脚本路径
   */
  protected getPreloadPath(): string {
    return path.join(this.getMainDistPath(), "main_preload.mjs");
  }

  /**
   * 获取页面URL
   */
  protected getPageUrl(): string {
    const devServerUrl = this.getDevServerUrl();

    if (devServerUrl) {
      return devServerUrl;
    }

    return path.join(this.getRendererDistPath(), "index.html");
  }

  /**
   * 初始化完成后的钩子
   */
  protected async onInitialized(): Promise<void> {
    this.setupMainWindowEvents();

    // 设置最小尺寸
    this.window?.setMinimumSize(800, 600);

    this.window?.webContents.openDevTools();
  }

  /**
   * 设置主窗口特有的事件
   */
  private setupMainWindowEvents(): void {
    if (!this.window) return;

    // 监听注销请求
    this.window.webContents.on("ipc-message", (_event, channel, ...args) => {
      switch (channel) {
        case "logout:request":
          console.log("🔐 [MainWindow] 注销请求");
          this.emit("logout-requested");
          break;
        case "user:data-updated":
          console.log("👤 [MainWindow] 用户数据更新");
          this.userData = args[0];
          this.emit("user-data-updated", args[0]);
          break;
        case "navigation:request":
          console.log("🧭 [MainWindow] 导航请求");
          this.emit("navigation-requested", args[0]);
          break;
      }
    });

    // 监听窗口控制事件
    this.window.webContents.on("ipc-message", (_event, channel, command) => {
      if (channel === "window-control") {
        this.handleWindowControl(command);
      }
    });

    // 监听窗口关闭事件
    this.window.on("close", (event) => {
      // 如果应用不是正在退出，隐藏窗口而不是关闭
      if (!this.isAppQuitting()) {
        event.preventDefault();
        this.hide();
      }
    });
  }

  /**
   * 处理窗口控制命令
   */
  private handleWindowControl(command: string): void {
    switch (command) {
      case "minimize":
        this.window?.minimize();
        break;
      case "maximize":
        if (this.window?.isMaximized()) {
          this.window?.unmaximize();
        } else {
          this.window?.maximize();
        }
        break;
      case "close":
        this.hide(); // 主窗口关闭时隐藏而不是真正关闭
        break;
    }
  }

  /**
   * 检查应用是否正在退出
   */
  private isAppQuitting(): boolean {
    // 这里可以通过全局状态或者事件来检查
    return false; // 暂时返回false，后续可以改进
  }

  /**
   * 发送用户数据到渲染进程
   */
  public sendUserData(userData: UserData): void {
    this.userData = userData;
    this.sendToRenderer("user:data", userData);
  }

  /**
   * 导航到指定路径
   */
  public navigateTo(path: string): void {
    this.sendToRenderer("navigation:navigate", path);
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
   * 获取当前用户数据
   */
  public getUserData(): UserData | null {
    return this.userData;
  }

  /**
   * 清理用户数据
   */
  public clearUserData(): void {
    this.userData = null;
    this.sendToRenderer("user:clear");
  }

  /**
   * 设置窗口标题
   */
  public setTitle(title: string): void {
    if (this.window) {
      this.window.setTitle(title);
    }
  }

  /**
   * 设置窗口徽章（macOS 支持）
   */
  public setBadge(count: number): void {
    if (this.window && process.platform === "darwin") {
      app.setBadgeCount(count);
    }
  }

  /**
   * 显示通知
   */
  public showNotification(title: string, body: string): void {
    this.sendToRenderer("notification:show", { title, body });
  }

  /**
   * 隐藏窗口前的清理
   */
  public hide(): void {
    // 发送窗口即将隐藏的事件
    this.sendToRenderer("window:will-hide");
    super.hide();
  }

  /**
   * 显示窗口
   */
  public show(): void {
    super.show();

    // 发送窗口显示的事件
    this.sendToRenderer("window:shown");

    // 如果有用户数据，重新发送
    if (this.userData) {
      this.sendUserData(this.userData);
    }
  }
}