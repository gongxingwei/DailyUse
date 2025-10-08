/**
 * Schedule 模块客户端导出
 * @description Schedule 客户端现在直接使用 domain-core 的 ScheduleTask
 * 不再有客户端特定的扩展
 */

// 注意: ScheduleTask 现在从 @dailyuse/domain-core 导入
// export * from './aggregates/ScheduleTask'; // 已删除，使用 domain-core

// 导出空对象以确保这是一个有效的模块
export {};
