/**
 * Notification Module - Contracts
 * 通知模块契约定义
 *
 * 统一导出所有 Notification 模块的契约定义
 */

// ============ 枚举 ============
export * from './enums';

// ============ 聚合根 ============
export * from './aggregates/NotificationServer';
export * from './aggregates/NotificationClient';
export * from './aggregates/NotificationTemplateServer';
export * from './aggregates/NotificationTemplateClient';
export * from './aggregates/NotificationPreferenceServer';
export * from './aggregates/NotificationPreferenceClient';

// ============ 实体 ============
export * from './entities/NotificationChannelServer';
export * from './entities/NotificationChannelClient';
export * from './entities/NotificationHistoryServer';
export * from './entities/NotificationHistoryClient';

// ============ 值对象 ============
export * from './value-objects';

// ============ API 请求/响应类型 ============
export * from './api-requests';

// 注意：领域事件已在聚合根文件中定义并导出
