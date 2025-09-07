/**
 * 窗口模块导出
 * 统一导出所有窗口相关的类和类型
 */

// 核心窗口类
export { WindowManager } from './windowManager';
export { BaseWindow } from './baseWindow';
export { LoginWindow } from './loginWindow';
export { MainWindow } from './mainWindow';

// 类型定义
export * from './types';

// 默认导出窗口管理器
export { WindowManager as default } from './windowManager';
