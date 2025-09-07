export * from './shared';

// 导出响应系统类型定义
export * from './response';

// 导出API层面的验证模式 (Zod schemas)
export * as AccountContracts from './schemas/account';
export { AccountStatus, AccountType } from './core/account';
export * as AuthContracts from './schemas/auth';

// 导出所有领域核心类型定义 (Core Contracts)
export * from './core';
export * as CoreContracts from './core';

// 导出所有事件相关的定义
export * from './events/index';
export * as EventContracts from './events/index';

// 导出前端相关的类型定义
export * from './frontend';
export * as FrontendContracts from './frontend';

// 确保导出新的认证类型
export type { LoginResponseDTO, UserInfoDTO } from './core/authentication';
