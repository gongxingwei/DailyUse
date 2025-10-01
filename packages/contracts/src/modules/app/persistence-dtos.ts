/**
 * App 模块持久化 DTO 定义
 */

import { AppEnvironment, AppStatus, WindowState } from './enums';

export interface AppInfoPersistenceDTO {
  name: string;
  version: string;
  buildNumber: string;
  buildTime: number; // timestamp
  environment: AppEnvironment;
  author: string;
  description: string;
  homepage?: string;
  license: string;
}

export interface AppConfigPersistenceDTO {
  autoStart: number; // 0 or 1
  startMinimized: number; // 0 or 1
  closeToTray: number; // 0 or 1
  minimizeToTray: number; // 0 or 1
  autoUpdate: number; // 0 or 1
  updateCheckInterval: number;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  maxLogFileSize: number;
  maxLogFiles: number;
  dataDirectory: string;
  cacheDirectory: string;
  tempDirectory: string;
}

export interface WindowConfigPersistenceDTO {
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  x?: number;
  y?: number;
  state: WindowState;
  resizable: number; // 0 or 1
  showMenuBar: number; // 0 or 1
  showToolBar: number; // 0 or 1
  showStatusBar: number; // 0 or 1
  alwaysOnTop: number; // 0 or 1
  opacity: number;
}

export interface AppStatePersistenceDTO {
  status: AppStatus;
  info: AppInfoPersistenceDTO;
  config: AppConfigPersistenceDTO;
  windowConfig: WindowConfigPersistenceDTO;
  performance?: string; // JSON string storing metrics
  lastUpdated: number; // timestamp
  isFirstRun: number; // 0 or 1
  isDevelopment: number; // 0 or 1
}
