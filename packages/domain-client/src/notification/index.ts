/**
 * Notification Module Exports (Client)
 * 通知模块导出
 */

// ===== 聚合根 =====
export * from './aggregates';

// ===== 值对象 =====
export * from './value-objects';

// ===== 实体 =====
// export * from './entities'; // 暂不导出，客户端通常不需要子实体

// Note: 客户端简化实现，子实体（channels, history）通常通过 API 按需加载
// 不在客户端维护完整的子实体集合
