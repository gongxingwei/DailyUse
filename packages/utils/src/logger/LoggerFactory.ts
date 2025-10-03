/**
 * Logger 工厂
 * 管理全局 Logger 配置和实例
 */

import { Logger } from './Logger';
import { ConsoleTransport } from './transports/ConsoleTransport';
import type { ILogger, LoggerConfig, LogTransport } from './types';
import { LogLevel } from './types';

/**
 * 全局配置
 */
let globalConfig: LoggerConfig = {
  level: 'info',
  enableInProduction: false,
  transports: [
    new ConsoleTransport({
      level: LogLevel.DEBUG,
      colorize: true,
      timestamp: true,
    }),
  ],
};

/**
 * Logger 实例缓存
 */
const loggerCache = new Map<string, ILogger>();

/**
 * Logger 工厂类
 */
export class LoggerFactory {
  /**
   * 配置全局 Logger
   */
  static configure(config: Partial<LoggerConfig>): void {
    globalConfig = {
      ...globalConfig,
      ...config,
    };

    // 清除缓存，强制重新创建
    loggerCache.clear();
  }

  /**
   * 添加全局传输器
   */
  static addTransport(transport: LogTransport): void {
    if (!globalConfig.transports) {
      globalConfig.transports = [];
    }
    globalConfig.transports.push(transport);

    // 清除缓存
    loggerCache.clear();
  }

  /**
   * 创建 Logger 实例
   */
  static create(context: string, useCache = true): ILogger {
    if (useCache && loggerCache.has(context)) {
      return loggerCache.get(context)!;
    }

    const logger = new Logger(context, {
      ...globalConfig,
      transports: globalConfig.transports ? [...globalConfig.transports] : [],
    });

    if (useCache) {
      loggerCache.set(context, logger);
    }

    return logger;
  }

  /**
   * 获取全局配置
   */
  static getConfig(): LoggerConfig {
    return { ...globalConfig };
  }

  /**
   * 清除所有缓存的 Logger
   */
  static clearCache(): void {
    loggerCache.clear();
  }

  /**
   * 关闭所有 Logger
   */
  static async closeAll(): Promise<void> {
    const closePromises = Array.from(loggerCache.values()).map((logger) => {
      if (logger instanceof Logger) {
        return logger.close();
      }
      return Promise.resolve();
    });

    await Promise.all(closePromises);
    loggerCache.clear();
  }
}

/**
 * 便捷函数：创建 Logger
 */
export function createLogger(context: string): ILogger {
  return LoggerFactory.create(context);
}
