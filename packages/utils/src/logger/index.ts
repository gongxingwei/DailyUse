/**
 * 跨平台日志系统
 * 支持 Node.js (API/Desktop) 和浏览器 (Web)
 */

// 核心类型
export * from './types';

// Logger 实现
export { Logger } from './Logger';
export { LoggerFactory, createLogger } from './LoggerFactory';

// 传输器
export { ConsoleTransport } from './transports/ConsoleTransport';
export { FileTransport } from './transports/FileTransport';

// 便捷导出
export { createLogger as default } from './LoggerFactory';
