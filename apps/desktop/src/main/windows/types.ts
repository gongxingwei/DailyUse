import { BrowserWindow } from 'electron';
import { EventEmitter } from 'events';

/**
 * 窗口类型枚举
 */
export enum WindowType {
  LOGIN = 'login',
  MAIN = 'main'
}

/**
 * 窗口配置接口
 */
export interface WindowConfig {
  width: number;
  height: number;
  resizable: boolean;
  maximizable: boolean;
  minimizable: boolean;
  frame: boolean;
  show: boolean;
  title: string;
  icon?: string;
  webPreferences?: {
    nodeIntegration: boolean;
    contextIsolation: boolean;
    webSecurity: boolean;
    preload: string;
    additionalArguments?: string[];
    allowRunningInsecureContent: boolean;
  };
}

/**
 * 基础窗口接口
 */
export interface IBaseWindow extends EventEmitter {
  initialize(): Promise<void>;
  show(): void;
  hide(): void;
  close(): void;
  destroy(): void;
  getWindow(): BrowserWindow | null;
  isVisible(): boolean;
  focus(): void;
}

/**
 * 登录窗口接口
 */
export interface ILoginWindow extends IBaseWindow {
  // 登录窗口特有的方法
  resetForm(): void;
  showError(message: string): void;
}

/**
 * 主窗口接口
 */
export interface IMainWindow extends IBaseWindow {
  // 主窗口特有的方法
  sendUserData(userData: any): void;
  navigateTo(path: string): void;
  toggleDevTools(): void;
}

/**
 * 窗口事件类型
 */
export interface WindowEvents {
  'window-ready': () => void;
  'window-closed': () => void;
  'window-minimized': () => void;
  'window-maximized': () => void;
  'window-restored': () => void;
  'window-focused': () => void;
  'window-blurred': () => void;
}

/**
 * 登录窗口事件类型
 */
export interface LoginWindowEvents extends WindowEvents {
  'login-success': (userData: any) => void;
  'login-failed': (error: string) => void;
  'login-cancelled': () => void;
  
}

/**
 * 主窗口事件类型
 */
export interface MainWindowEvents extends WindowEvents {
  'logout-requested': () => void;
  'user-data-updated': (userData: any) => void;
  'navigation-requested': (path: string) => void;
}

/**
 * 用户数据接口
 */
export interface UserData {
  userId: string;
  username: string;
  email?: string;
  displayName?: string;
  avatar?: string;
  permissions?: string[];
  preferences?: Record<string, any>;
}

/**
 * 窗口状态
 */
export interface WindowState {
  type: WindowType;
  isVisible: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * 窗口管理器接口
 */
export interface IWindowManager extends EventEmitter {
  initialize(): Promise<void>;
  getCurrentWindowType(): WindowType;
  getCurrentWindow(): BrowserWindow | null;
  quit(): void;
  destroy(): void;
}

/**
 * 窗口管理器事件
 */
export interface WindowManagerEvents {
  'window-switched': (windowType: WindowType) => void;
  'all-windows-closed': () => void;
  'tray-clicked': () => void;
}
