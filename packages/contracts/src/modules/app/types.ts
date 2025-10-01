/**
 * App 模块类型定义
 *
 * 定义应用程序相关的接口、枚举和类型
 */

import { AppEnvironment, AppStatus, WindowState } from './enums';

// ========== 接口定义 ==========

/**
 * 应用信息接口
 */
export interface IAppInfo {
  /** 应用名称 */
  name: string;
  /** 应用版本 */
  version: string;
  /** 构建号 */
  buildNumber: string;
  /** 构建时间 */
  buildTime: Date;
  /** 应用环境 */
  environment: AppEnvironment;
  /** 作者信息 */
  author: string;
  /** 描述 */
  description: string;
  /** 主页 */
  homepage?: string;
  /** 许可证 */
  license: string;
}

/**
 * 应用配置接口
 */
export interface IAppConfig {
  /** 自动启动 */
  autoStart: boolean;
  /** 启动时最小化 */
  startMinimized: boolean;
  /** 关闭到托盘 */
  closeToTray: boolean;
  /** 最小化到托盘 */
  minimizeToTray: boolean;
  /** 自动更新 */
  autoUpdate: boolean;
  /** 检查更新间隔（小时） */
  updateCheckInterval: number;
  /** 日志级别 */
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  /** 最大日志文件大小（MB） */
  maxLogFileSize: number;
  /** 最大日志文件数量 */
  maxLogFiles: number;
  /** 数据目录 */
  dataDirectory: string;
  /** 缓存目录 */
  cacheDirectory: string;
  /** 临时目录 */
  tempDirectory: string;
}

/**
 * 窗口配置接口
 */
export interface IWindowConfig {
  /** 窗口宽度 */
  width: number;
  /** 窗口高度 */
  height: number;
  /** 最小宽度 */
  minWidth: number;
  /** 最小高度 */
  minHeight: number;
  /** X坐标 */
  x?: number;
  /** Y坐标 */
  y?: number;
  /** 窗口状态 */
  state: WindowState;
  /** 是否可调整大小 */
  resizable: boolean;
  /** 是否显示菜单栏 */
  showMenuBar: boolean;
  /** 是否显示工具栏 */
  showToolBar: boolean;
  /** 是否显示状态栏 */
  showStatusBar: boolean;
  /** 是否始终置顶 */
  alwaysOnTop: boolean;
  /** 透明度 */
  opacity: number;
}

/**
 * 应用性能指标接口
 */
export interface IAppPerformance {
  /** CPU使用率 */
  cpuUsage: number;
  /** 内存使用量（MB） */
  memoryUsage: number;
  /** 总内存（MB） */
  totalMemory: number;
  /** 启动时间（毫秒） */
  startupTime: number;
  /** 运行时间（秒） */
  uptime: number;
  /** 事件循环延迟（毫秒） */
  eventLoopDelay: number;
  /** 垃圾回收次数 */
  gcCount: number;
  /** 垃圾回收时间（毫秒） */
  gcTime: number;
}

/**
 * 应用状态接口
 */
export interface IAppState {
  /** 应用状态 */
  status: AppStatus;
  /** 应用信息 */
  info: IAppInfo;
  /** 应用配置 */
  config: IAppConfig;
  /** 窗口配置 */
  windowConfig: IWindowConfig;
  /** 性能指标 */
  performance: IAppPerformance;
  /** 最后更新时间 */
  lastUpdated: Date;
  /** 是否首次启动 */
  isFirstRun: boolean;
  /** 是否开发模式 */
  isDevelopment: boolean;
}
