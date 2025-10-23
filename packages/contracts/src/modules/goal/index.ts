/**
 * Goal Module Contracts
 * 目标模块契约导出
 *
 * 使用方式：
 * ```typescript
 * import { GoalContracts } from '@dailyuse/contracts';
 *
 * // 使用枚举
 * const status: GoalContracts.GoalStatus = GoalContracts.GoalStatus.ACTIVE;
 *
 * // 使用 DTO 类型
 * const goal: GoalContracts.GoalServerDTO = { ... };
 *
 * // 使用接口
 * const goalServer: GoalContracts.GoalServer = { ... };
 * ```
 */

// ============ 导出所有内容 ============

export * from './enums';
export * from './value-objects';
export * from './entities';
export * from './aggregates';
export * from './api-requests';
export * from './rules/StatusRule';