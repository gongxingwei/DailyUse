/**
 * Web 应用日志配置
 * 使用 @dailyuse/utils 的跨平台日志系统（浏览器环境）
 */

import { LoggerFactory, ConsoleTransport, LogLevel } from '@dailyuse/utils';

const isDevelopment = import.meta.env.DEV;
const logLevel = import.meta.env.VITE_LOG_LEVEL || (isDevelopment ? 'debug' : 'warn');

/**
 * 初始化浏览器日志系统
 */
export function initializeLogger(): void {
  LoggerFactory.configure({
    level: logLevel as any,
    enableInProduction: false, // 生产环境禁用日志
    transports: [
      // 仅支持控制台传输器（浏览器环境）
      new ConsoleTransport({
        level: LogLevel.DEBUG,
        colorize: true,
        timestamp: true,
      }),
    ],
  });
}

/**
 * 获取应用启动信息
 */
export function getStartupInfo(): Record<string, any> {
  return {
    environment: import.meta.env.MODE,
    isDevelopment,
    logLevel,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    version: import.meta.env.VITE_APP_VERSION || 'unknown',
  };
}
