/**
 * RepositoryStatistics Aggregate Root - Client Interface
 * 仓储统计聚合根 - 客户端接口
 *
 * 用于前端显示仓储模块的统计数据
 */

import type { RepositoryStatisticsServerDTO } from './RepositoryStatisticsServer';

// ============ DTO 定义 ============

/**
 * RepositoryStatistics Client DTO
 * 仓储统计数据传输对象（客户端）
 *
 * 包含格式化后的数据，便于UI直接使用
 */
export interface RepositoryStatisticsClientDTO {
  /** 账户UUID */
  accountUuid: string;

  // ===== 仓库统计 =====
  /** 总仓库数 */
  totalRepositories: number;
  /** 活跃仓库数 */
  activeRepositories: number;
  /** 归档仓库数 */
  archivedRepositories: number;

  // ===== 资源统计 =====
  /** 总资源数 */
  totalResources: number;
  /** 文件数 */
  totalFiles: number;
  /** 文件夹数 */
  totalFolders: number;

  // ===== Git 统计 =====
  /** 启用Git的仓库数 */
  gitEnabledRepos: number;
  /** 总提交数 */
  totalCommits: number;

  // ===== 引用统计 =====
  /** 总引用数 */
  totalReferences: number;
  /** 总链接内容数 */
  totalLinkedContents: number;

  // ===== 存储统计 =====
  /** 总大小（字节） - 字符串格式 */
  totalSizeBytes: string;
  /** 格式化后的大小（如 "1.5 GB"） */
  formattedSize: string;

  // ===== 时间戳 =====
  /** 最后更新时间 (epoch ms) */
  lastUpdatedAt: number;
  /** 格式化后的最后更新时间 */
  formattedLastUpdated: string;
  /** 创建时间 (epoch ms) */
  createdAt: number;
  /** 格式化后的创建时间 */
  formattedCreatedAt: string;

  // ===== UI 辅助属性 =====
  /** 活跃仓库百分比 */
  activePercentage: number;
  /** 归档仓库百分比 */
  archivedPercentage: number;
  /** 平均仓库大小（字节） */
  averageRepositorySize: string;
  /** 平均仓库大小（格式化） */
  formattedAverageSize: string;
  /** 平均每个仓库的资源数 */
  averageResourcesPerRepository: number;
}

// ============ 实体接口 ============

/**
 * RepositoryStatistics Client Interface
 * 仓储统计聚合根接口（客户端）
 */
export interface RepositoryStatisticsClient {
  accountUuid: string;

  // 仓库统计
  totalRepositories: number;
  activeRepositories: number;
  archivedRepositories: number;

  // 资源统计
  totalResources: number;
  totalFiles: number;
  totalFolders: number;

  // Git 统计
  gitEnabledRepos: number;
  totalCommits: number;

  // 引用统计
  totalReferences: number;
  totalLinkedContents: number;

  // 存储统计
  totalSizeBytes: bigint;

  // 时间戳
  lastUpdatedAt: number;
  createdAt: number;

  // ===== 业务方法 =====

  /**
   * 转换为 Client DTO
   */
  toClientDTO(): RepositoryStatisticsClientDTO;

  /**
   * 计算活跃仓库百分比
   */
  calculateActivePercentage(): number;

  /**
   * 计算归档仓库百分比
   */
  calculateArchivedPercentage(): number;

  /**
   * 计算平均仓库大小
   */
  calculateAverageRepositorySize(): bigint;

  /**
   * 计算平均每个仓库的资源数
   */
  calculateAverageResourcesPerRepository(): number;

  /**
   * 格式化存储大小
   */
  formatSize(bytes: bigint): string;

  /**
   * 格式化时间戳
   */
  formatTimestamp(timestamp: number): string;
}

// ============ 辅助函数 ============

/**
 * 从 ServerDTO 创建 ClientDTO
 */
export function createRepositoryStatisticsClientDTO(
  serverDTO: RepositoryStatisticsServerDTO,
): RepositoryStatisticsClientDTO {
  const totalRepos = serverDTO.totalRepositories || 1; // 避免除零
  const sizeBytes = BigInt(serverDTO.totalSizeBytes || '0');

  return {
    accountUuid: serverDTO.accountUuid,

    // 基础统计
    totalRepositories: serverDTO.totalRepositories,
    activeRepositories: serverDTO.activeRepositories,
    archivedRepositories: serverDTO.archivedRepositories,
    totalResources: serverDTO.totalResources,
    totalFiles: serverDTO.totalFiles,
    totalFolders: serverDTO.totalFolders,
    gitEnabledRepos: serverDTO.gitEnabledRepos,
    totalCommits: serverDTO.totalCommits,
    totalReferences: serverDTO.totalReferences,
    totalLinkedContents: serverDTO.totalLinkedContents,

    // 存储统计
    totalSizeBytes: serverDTO.totalSizeBytes,
    formattedSize: formatBytes(sizeBytes),

    // 时间戳
    lastUpdatedAt: serverDTO.lastUpdatedAt,
    formattedLastUpdated: formatTimestamp(serverDTO.lastUpdatedAt),
    createdAt: serverDTO.createdAt,
    formattedCreatedAt: formatTimestamp(serverDTO.createdAt),

    // 计算属性
    activePercentage: Math.round((serverDTO.activeRepositories / totalRepos) * 100),
    archivedPercentage: Math.round((serverDTO.archivedRepositories / totalRepos) * 100),
    averageRepositorySize: (sizeBytes / BigInt(totalRepos)).toString(),
    formattedAverageSize: formatBytes(sizeBytes / BigInt(totalRepos)),
    averageResourcesPerRepository: Math.round(serverDTO.totalResources / totalRepos),
  };
}

/**
 * 格式化字节数为人类可读格式
 */
export function formatBytes(bytes: bigint): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = Number(bytes);
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * 格式化时间戳
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - timestamp;

  // 小于1分钟
  if (diff < 60000) {
    return '刚刚';
  }

  // 小于1小时
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}分钟前`;
  }

  // 小于24小时
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}小时前`;
  }

  // 小于7天
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}天前`;
  }

  // 超过7天显示具体日期
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
