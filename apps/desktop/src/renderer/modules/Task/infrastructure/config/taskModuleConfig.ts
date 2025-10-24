/**
 * 渲染进程 Task 模块配置
 *
 * 统一配置和管理 Task 模块的数据持久化策略
 * 新架构：IPC 持久化 + Store 状态管理
 */

/**
 * 渲染进程 Task 模块配置
 *
 * 统一配置和管理 Task 模块的数据持久化策略
 * 新架构：IPC 持久化 + Store 状态管理
 */

/**
 * 数据获取策略枚举
 */
export enum DataFetchStrategy {
  /** 离线优先：先返回 Store 缓存，后台同步最新数据 */
  OFFLINE_FIRST = 'offline-first',
  /** 实时优先：直接通过 IPC 获取最新数据，失败时降级到 Store */
  REALTIME_FIRST = 'realtime-first',
  /** 仅缓存：只使用 Store 数据，不主动同步 */
  CACHE_ONLY = 'cache-only',
  /** 仅实时：强制通过 IPC 获取，不使用 Store 缓存 */
  REALTIME_ONLY = 'realtime-only',
}

/**
 * Task 模块配置选项
 * 新架构下，所有持久化操作都通过 IPC，Store 仅做状态管理
 */
export interface TaskModuleConfig {
  /** 数据获取策略 */
  dataFetchStrategy: DataFetchStrategy;
  /** 是否启用自动同步 */
  enableAutoSync: boolean;
  /** 同步间隔（毫秒） */
  syncInterval: number;
  /** 是否启用响应式状态管理 */
  enableReactiveState: boolean;
  /** IPC 超时时间（毫秒） */
  ipcTimeout: number;
  /** 是否启用错误重试 */
  enableRetry: boolean;
  /** 重试次数 */
  retryCount: number;
}

/**
 * 预定义配置方案
 */
export const TaskModulePresets = {
  /** 默认配置：离线优先 + 响应式状态 */
  DEFAULT: {
    dataFetchStrategy: DataFetchStrategy.OFFLINE_FIRST,
    enableAutoSync: true,
    syncInterval: 30000, // 30秒
    enableReactiveState: true,
    ipcTimeout: 5000, // 5秒
    enableRetry: true,
    retryCount: 3,
  } as TaskModuleConfig,

  /** 实时配置：数据一致性优先 */
  REALTIME: {
    dataFetchStrategy: DataFetchStrategy.REALTIME_FIRST,
    enableAutoSync: false,
    syncInterval: 0,
    enableReactiveState: true,
    ipcTimeout: 3000, // 3秒，更快的响应
    enableRetry: true,
    retryCount: 2,
  } as TaskModuleConfig,

  /** 离线配置：性能优先 */
  OFFLINE: {
    dataFetchStrategy: DataFetchStrategy.CACHE_ONLY,
    enableAutoSync: false,
    syncInterval: 0,
    enableReactiveState: true,
    ipcTimeout: 1000, // 1秒，快速失败
    enableRetry: false,
    retryCount: 0,
  } as TaskModuleConfig,

  /** 混合配置：平衡性能与一致性 */
  HYBRID: {
    dataFetchStrategy: DataFetchStrategy.OFFLINE_FIRST,
    enableAutoSync: true,
    syncInterval: 60000, // 1分钟
    enableReactiveState: true,
    ipcTimeout: 4000, // 4秒
    enableRetry: true,
    retryCount: 2,
  } as TaskModuleConfig,

  /** 高性能配置：最小化 IPC 调用 */
  PERFORMANCE: {
    dataFetchStrategy: DataFetchStrategy.CACHE_ONLY,
    enableAutoSync: true,
    syncInterval: 120000, // 2分钟
    enableReactiveState: true,
    ipcTimeout: 2000, // 2秒
    enableRetry: false,
    retryCount: 0,
  } as TaskModuleConfig,
};

/**
 * 配置验证器
 */
export class TaskModuleConfigValidator {
  static validate(config: TaskModuleConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.syncInterval < 0) {
      errors.push('同步间隔不能为负数');
    }

    if (config.ipcTimeout <= 0) {
      errors.push('IPC 超时时间必须大于 0');
    }

    if (config.retryCount < 0) {
      errors.push('重试次数不能为负数');
    }

    if (config.enableAutoSync && config.syncInterval === 0) {
      errors.push('启用自动同步时，同步间隔必须大于 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * 基础使用示例
 */
export function createTaskModuleConfig(override: Partial<TaskModuleConfig> = {}): TaskModuleConfig {
  const config = { ...TaskModulePresets.DEFAULT, ...override };

  const validation = TaskModuleConfigValidator.validate(config);
  if (!validation.isValid) {
    console.warn('Task 模块配置验证失败:', validation.errors);
  }

  return config;
}

/**
 * 根据网络状态获取推荐配置
 */
export function getRecommendedConfig(
  isOnline: boolean,
  isHighPerformance: boolean = false,
): TaskModuleConfig {
  if (!isOnline) {
    return TaskModulePresets.OFFLINE;
  }

  if (isHighPerformance) {
    return TaskModulePresets.PERFORMANCE;
  }

  return TaskModulePresets.DEFAULT;
}

/**
 * 配置说明文档
 */
export const TaskModuleConfigDocs = {
  dataFetchStrategy: {
    [DataFetchStrategy.OFFLINE_FIRST]: '适合大多数场景，提供良好的用户体验和数据一致性平衡',
    [DataFetchStrategy.REALTIME_FIRST]: '适合需要强一致性的场景，如多用户协作',
    [DataFetchStrategy.CACHE_ONLY]: '适合离线场景或性能要求极高的场景',
    [DataFetchStrategy.REALTIME_ONLY]: '适合数据一致性要求极高的场景，不推荐日常使用',
  },

  syncInterval: {
    '30000': '默认值，适合大多数场景',
    '60000': '较低频率同步，适合性能敏感场景',
    '10000': '高频同步，适合数据变化频繁的场景',
  },

  bestPractices: [
    '在网络不稳定的环境下使用 OFFLINE_FIRST 策略',
    '在需要实时协作的场景下使用 REALTIME_FIRST 策略',
    '在性能敏感的场景下使用 CACHE_ONLY 策略并延长同步间隔',
    '始终启用 enableReactiveState 以获得更好的用户体验',
    '根据网络状况调整 ipcTimeout 和 retryCount',
  ],
};
