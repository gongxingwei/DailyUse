/**
 * RepositoryStatistics Aggregate Root - Server Interface
 * 仓储统计聚合根 - 服务端接口
 *
 * 用于快速查询仓储模块的统计数据，避免每次都遍历计算
 */

// ============ DTO 定义 ============

/**
 * RepositoryStatistics Server DTO
 * 仓储统计数据传输对象（服务端）
 */
export interface RepositoryStatisticsServerDTO {
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
  /** 总大小（字节） - 使用字符串存储BigInt */
  totalSizeBytes: string;

  // ===== 时间戳 =====
  /** 最后更新时间 (epoch ms) */
  lastUpdatedAt: number;
  /** 创建时间 (epoch ms) */
  createdAt: number;
}

/**
 * RepositoryStatistics Persistence DTO (数据库映射)
 * 用于 Prisma 映射
 */
export interface RepositoryStatisticsPersistenceDTO {
  id?: number; // 自增主键
  account_uuid: string;

  // 仓库统计
  total_repositories: number;
  active_repositories: number;
  archived_repositories: number;

  // 资源统计
  total_resources: number;
  total_files: number;
  total_folders: number;

  // Git 统计
  git_enabled_repos: number;
  total_commits: number;

  // 引用统计
  total_references: number;
  total_linked_contents: number;

  // 存储统计
  total_size_bytes: bigint; // PostgreSQL BigInt

  // 时间戳
  last_updated_at: Date;
  created_at: Date;
}

// ============ Request/Response 定义 ============

/**
 * 初始化统计请求（用于新账户）
 */
export interface InitializeStatisticsRequest {
  accountUuid: string;
}

/**
 * 重新计算统计请求（管理员功能）
 */
export interface RecalculateStatisticsRequest {
  accountUuid: string;
  /** 是否强制重算（即使已有数据） */
  force?: boolean;
}

/**
 * 重新计算统计响应
 */
export interface RecalculateStatisticsResponse {
  success: boolean;
  message: string;
  statistics: RepositoryStatisticsServerDTO;
}

// ============ 统计事件（用于事件驱动更新） ============
// 注意：事件定义已在 RepositoryServer.ts 中定义，此处仅作类型引用

/**
 * 统计更新事件类型
 */
export type StatisticsUpdateEventType =
  | 'repository.created'
  | 'repository.deleted'
  | 'repository.archived'
  | 'repository.activated'
  | 'resource.created'
  | 'resource.deleted'
  | 'reference.created'
  | 'reference.deleted'
  | 'linked_content.created'
  | 'linked_content.deleted'
  | 'git.enabled'
  | 'git.disabled'
  | 'commit.created';

/**
 * 统计更新事件负载（基础接口）
 */
export interface StatisticsUpdateEvent {
  type: StatisticsUpdateEventType;
  accountUuid: string;
  timestamp: number;
  payload: Record<string, any>;
}

// ============ Server Interface (用于依赖注入类型提示) ============

/**
 * RepositoryStatistics Aggregate Root Interface
 * 仓储统计聚合根接口（用于类型提示，不在运行时使用）
 */
export interface RepositoryStatisticsServer {
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
   * 处理仓库创建事件
   */
  onRepositoryCreated(event: StatisticsUpdateEvent): void;

  /**
   * 处理仓库删除事件
   */
  onRepositoryDeleted(event: StatisticsUpdateEvent): void;

  /**
   * 处理仓库归档事件
   */
  onRepositoryArchived(event: StatisticsUpdateEvent): void;

  /**
   * 处理仓库激活事件
   */
  onRepositoryActivated(event: StatisticsUpdateEvent): void;

  /**
   * 处理资源创建事件
   */
  onResourceCreated(event: StatisticsUpdateEvent): void;

  /**
   * 处理资源删除事件
   */
  onResourceDeleted(event: StatisticsUpdateEvent): void;

  /**
   * 增加引用数
   */
  incrementReferences(count?: number): void;

  /**
   * 减少引用数
   */
  decrementReferences(count?: number): void;

  /**
   * 增加链接内容数
   */
  incrementLinkedContents(count?: number): void;

  /**
   * 减少链接内容数
   */
  decrementLinkedContents(count?: number): void;

  /**
   * 启用Git时更新统计
   */
  onGitEnabled(): void;

  /**
   * 禁用Git时更新统计
   */
  onGitDisabled(): void;

  /**
   * 新增提交时更新统计
   */
  onCommitCreated(count?: number): void;

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): RepositoryStatisticsServerDTO;

  toClientDTO(): RepositoryStatisticsClientDTO;
  /**
   * 转换为持久化 DTO
   */
  toPersistenceDTO(): RepositoryStatisticsPersistenceDTO;
}
