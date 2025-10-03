/**
 * API 日志配置
 * 使用 @dailyuse/utils 的跨平台日志系统
 */

import { LoggerFactory, ConsoleTransport, FileTransport, LogLevel } from '@dailyuse/utils';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const logLevel = (process.env.LOG_LEVEL as any) || (isProduction ? 'info' : 'debug');

// 日志文件目录
const logDir = path.join(__dirname, '../../logs');

/**
 * 初始化日志系统
 */
export function initializeLogger(): void {
  const transports: Array<ConsoleTransport | FileTransport> = [
    // 控制台传输器（开发环境启用彩色输出）
    new ConsoleTransport({
      level: LogLevel.DEBUG,
      colorize: true,
      timestamp: true,
    }),
  ];

  // 生产环境添加文件传输器
  if (isProduction) {
    transports.push(
      // 所有日志
      new FileTransport({
        filename: path.join(logDir, 'combined.log'),
        level: LogLevel.INFO,
        json: true,
      }),

      // 仅错误日志
      new FileTransport({
        filename: path.join(logDir, 'error.log'),
        level: LogLevel.ERROR,
        json: true,
      }),
    );
  }

  // 开发环境也可选择性记录文件日志
  if (isDevelopment && process.env.ENABLE_FILE_LOGS === 'true') {
    transports.push(
      new FileTransport({
        filename: path.join(logDir, 'dev.log'),
        level: LogLevel.DEBUG,
        json: true,
      }),
    );
  }

  LoggerFactory.configure({
    level: logLevel,
    enableInProduction: true,
    transports,
  });
}

/**
 * 获取应用启动信息
 */
export function getStartupInfo(): Record<string, any> {
  return {
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: process.platform,
    logLevel,
    timestamp: new Date().toISOString(),
  };
}
