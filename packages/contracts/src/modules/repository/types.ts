/**
 * Repository Module Types
 * 仓储模块类型定义
 */

// ============ Core Repository Types ============

/**
 * 仓储接口
 */
export interface IRepository {
  /** 唯一标识符 */
  uuid: string;
  /** 仓储名称 */
  name: string;
  /** 仓储路径 */
  path: string;
  /** 描述 */
  description?: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 关联的目标ID列表 */
  relatedGoals?: string[];
  /** 仓储状态 */
  status?: RepositoryStatus;
  /** 是否为Git仓储 */
  isGitRepo?: boolean;
  /** Git分支 */
  currentBranch?: string;
  /** 是否有未提交的更改 */
  hasChanges?: boolean;
  /** 最后访问时间 */
  lastAccessedAt?: Date;
}

/**
 * 仓储状态枚举
 */
export enum RepositoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
  ERROR = 'error',
}

/**
 * Git状态信息
 */
export interface IGitStatus {
  /** 当前分支 */
  current: string;
  /** 跟踪分支 */
  tracking?: string;
  /** 领先提交数 */
  ahead: number;
  /** 落后提交数 */
  behind: number;
  /** 暂存的文件 */
  staged: string[];
  /** 未暂存的文件 */
  unstaged: string[];
  /** 未跟踪的文件 */
  not_added: string[];
  /** 创建的文件 */
  created: string[];
  /** 修改的文件 */
  modified: string[];
  /** 删除的文件 */
  deleted: string[];
  /** 冲突的文件 */
  conflicted: string[];
  /** 是否干净 */
  isClean: boolean;
  /** 是否分离 */
  detached: boolean;
}

/**
 * Git提交信息
 */
export interface IGitCommit {
  /** 提交哈希 */
  hash: string;
  /** 提交时间 */
  date: string;
  /** 提交消息 */
  message: string;
  /** 引用 */
  refs?: string;
  /** 提交体 */
  body?: string;
  /** 作者姓名 */
  author_name: string;
  /** 作者邮箱 */
  author_email: string;
}

/**
 * Git日志响应
 */
export interface IGitLogResponse {
  /** 提交列表 */
  commits: IGitCommit[];
  /** 总数 */
  total?: number;
}

// ============ Repository Commands ============

/**
 * 创建仓储命令
 */
export interface ICreateRepositoryCommand {
  /** 仓储名称 */
  name: string;
  /** 仓储路径 */
  path: string;
  /** 描述 */
  description?: string;
  /** 关联的目标ID列表 */
  relatedGoals?: string[];
  /** 是否初始化Git */
  initializeGit?: boolean;
}

/**
 * 更新仓储命令
 */
export interface IUpdateRepositoryCommand {
  /** 仓储ID */
  uuid: string;
  /** 仓储名称 */
  name?: string;
  /** 仓储路径 */
  path?: string;
  /** 描述 */
  description?: string;
  /** 关联的目标ID列表 */
  relatedGoals?: string[];
  /** 仓储状态 */
  status?: RepositoryStatus;
}

/**
 * 删除仓储命令
 */
export interface IDeleteRepositoryCommand {
  /** 仓储ID */
  uuid: string;
  /** 是否删除文件 */
  deleteFiles?: boolean;
}

/**
 * Git操作命令基类
 */
export interface IGitCommand {
  /** 仓储路径 */
  repositoryPath: string;
}

/**
 * Git初始化命令
 */
export interface IGitInitCommand extends IGitCommand {
  /** 是否裸仓储 */
  bare?: boolean;
}

/**
 * Git添加文件命令
 */
export interface IGitAddCommand extends IGitCommand {
  /** 文件路径列表 */
  files: string[];
}

/**
 * Git提交命令
 */
export interface IGitCommitCommand extends IGitCommand {
  /** 提交消息 */
  message: string;
  /** 是否添加所有文件 */
  addAll?: boolean;
}

/**
 * Git分支命令
 */
export interface IGitBranchCommand extends IGitCommand {
  /** 分支名称 */
  branchName: string;
  /** 是否切换到新分支 */
  checkout?: boolean;
}

// ============ Repository Events ============

/**
 * 仓储事件基类
 */
export interface IRepositoryEvent {
  /** 事件类型 */
  type: string;
  /** 事件时间戳 */
  timestamp: Date;
  /** 仓储ID */
  repositoryId: string;
  /** 事件数据 */
  data?: any;
}

/**
 * 仓储创建事件
 */
export interface IRepositoryCreatedEvent extends IRepositoryEvent {
  type: 'repository-created';
  data: {
    repository: IRepository;
  };
}

/**
 * 仓储更新事件
 */
export interface IRepositoryUpdatedEvent extends IRepositoryEvent {
  type: 'repository-updated';
  data: {
    repository: IRepository;
    changes: Partial<IRepository>;
  };
}

/**
 * 仓储删除事件
 */
export interface IRepositoryDeletedEvent extends IRepositoryEvent {
  type: 'repository-deleted';
  data: {
    repositoryId: string;
  };
}

/**
 * Git状态变化事件
 */
export interface IGitStatusChangedEvent extends IRepositoryEvent {
  type: 'git-status-changed';
  data: {
    status: IGitStatus;
  };
}

/**
 * Git提交事件
 */
export interface IGitCommittedEvent extends IRepositoryEvent {
  type: 'git-committed';
  data: {
    commit: IGitCommit;
    message: string;
  };
}

// ============ Repository Service Interfaces ============

/**
 * 仓储服务接口
 */
export interface IRepositoryService {
  /** 创建仓储 */
  createRepository(command: ICreateRepositoryCommand): Promise<IRepository>;

  /** 更新仓储 */
  updateRepository(command: IUpdateRepositoryCommand): Promise<IRepository>;

  /** 删除仓储 */
  deleteRepository(command: IDeleteRepositoryCommand): Promise<void>;

  /** 获取仓储 */
  getRepository(uuid: string): Promise<IRepository | null>;

  /** 获取所有仓储 */
  getAllRepositories(): Promise<IRepository[]>;

  /** 按名称获取仓储 */
  getRepositoryByName(name: string): Promise<IRepository | null>;

  /** 按路径获取仓储 */
  getRepositoryByPath(path: string): Promise<IRepository | null>;

  /** 获取关联目标的仓储 */
  getRepositoriesByGoal(goalId: string): Promise<IRepository[]>;

  /** 验证仓储路径 */
  validateRepositoryPath(path: string): Promise<boolean>;

  /** 检查仓储是否存在 */
  repositoryExists(name: string): Promise<boolean>;
}

/**
 * Git服务接口
 */
export interface IGitService {
  /** 检查是否为Git仓储 */
  checkIsRepo(path: string): Promise<boolean>;

  /** 初始化Git仓储 */
  initRepository(command: IGitInitCommand): Promise<void>;

  /** 获取Git状态 */
  getStatus(repositoryPath: string): Promise<IGitStatus>;

  /** 添加文件到暂存区 */
  addFiles(command: IGitAddCommand): Promise<void>;

  /** 提交更改 */
  commit(command: IGitCommitCommand): Promise<IGitCommit>;

  /** 获取提交历史 */
  getLog(repositoryPath: string, limit?: number): Promise<IGitLogResponse>;

  /** 创建分支 */
  createBranch(command: IGitBranchCommand): Promise<void>;

  /** 切换分支 */
  checkoutBranch(repositoryPath: string, branchName: string): Promise<void>;

  /** 获取分支列表 */
  getBranches(repositoryPath: string): Promise<string[]>;

  /** 暂存所有更改 */
  stageAll(repositoryPath: string): Promise<void>;

  /** 取消暂存所有更改 */
  unstageAll(repositoryPath: string): Promise<void>;

  /** 丢弃所有更改 */
  discardAll(repositoryPath: string): Promise<void>;
}

// ============ Query/Response DTOs ============

/**
 * 仓储查询参数
 */
export interface IRepositoryQuery {
  /** 关键字搜索 */
  keyword?: string;
  /** 状态过滤 */
  status?: RepositoryStatus;
  /** 关联目标ID */
  goalId?: string;
  /** 是否为Git仓储 */
  isGitRepo?: boolean;
  /** 分页偏移 */
  offset?: number;
  /** 分页限制 */
  limit?: number;
  /** 排序字段 */
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastAccessedAt';
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 仓储查询响应
 */
export interface IRepositoryQueryResponse {
  /** 仓储列表 */
  repositories: IRepository[];
  /** 总数 */
  total: number;
  /** 分页偏移 */
  offset: number;
  /** 分页限制 */
  limit: number;
}

/**
 * 仓储统计响应
 */
export interface IRepositoryStatsResponse {
  /** 总仓储数 */
  totalRepositories: number;
  /** 活跃仓储数 */
  activeRepositories: number;
  /** Git仓储数 */
  gitRepositories: number;
  /** 有更改的仓储数 */
  repositoriesWithChanges: number;
  /** 按状态分组的统计 */
  statusStats: Record<RepositoryStatus, number>;
}

/**
 * Git API响应基类
 */
export interface IGitApiResponse<T = any> {
  /** 是否成功 */
  success: boolean;
  /** 数据 */
  data?: T;
  /** 错误信息 */
  error?: string;
}

// ============ Error Types ============

/**
 * 仓储错误基类
 */
export class RepositoryError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

/**
 * 仓储未找到错误
 */
export class RepositoryNotFoundError extends RepositoryError {
  constructor(identifier: string) {
    super(`Repository not found: ${identifier}`, 'REPOSITORY_NOT_FOUND', { identifier });
    this.name = 'RepositoryNotFoundError';
  }
}

/**
 * 仓储已存在错误
 */
export class RepositoryExistsError extends RepositoryError {
  constructor(name: string) {
    super(`Repository already exists: ${name}`, 'REPOSITORY_EXISTS', { name });
    this.name = 'RepositoryExistsError';
  }
}

/**
 * Git操作错误
 */
export class GitOperationError extends RepositoryError {
  constructor(
    message: string,
    public operation: string,
    public repositoryPath: string,
  ) {
    super(message, 'GIT_OPERATION_ERROR', { operation, repositoryPath });
    this.name = 'GitOperationError';
  }
}

/**
 * 路径验证错误
 */
export class PathValidationError extends RepositoryError {
  constructor(path: string, reason: string) {
    super(`Invalid path: ${path} - ${reason}`, 'PATH_VALIDATION_ERROR', { path, reason });
    this.name = 'PathValidationError';
  }
}
