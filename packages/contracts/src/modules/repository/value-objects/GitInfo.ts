/**
 * Git Info Value Object
 * Git 信息值对象
 */

// ============ 接口定义 ============

/**
 * Git 信息 - Server 接口
 */
export interface IGitInfoServer {
  isGitRepo: boolean;
  currentBranch?: string | null;
  hasChanges?: boolean | null;
  remoteUrl?: string | null;

  // 值对象方法
  equals(other: IGitInfoServer): boolean;
  with(
    updates: Partial<
      Omit<IGitInfoServer, 'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'>
    >,
  ): IGitInfoServer;

  // DTO 转换方法
  toServerDTO(): GitInfoServerDTO;
  toClientDTO(): GitInfoClientDTO;
  toPersistenceDTO(): GitInfoPersistenceDTO;
}

/**
 * Git 信息 - Client 接口
 */
export interface IGitInfoClient {
  isGitRepo: boolean;
  currentBranch?: string | null;
  hasChanges?: boolean | null;

  // UI 辅助属性
  branchIcon: string;
  statusText: string; // "已同步" / "有变更"
  statusColor: string;

  // 值对象方法
  equals(other: IGitInfoClient): boolean;

  // DTO 转换方法
  toServerDTO(): GitInfoServerDTO;
}

// ============ DTO 定义 ============

/**
 * Git Info Server DTO
 */
export interface GitInfoServerDTO {
  isGitRepo: boolean;
  currentBranch?: string | null;
  hasChanges?: boolean | null;
  remoteUrl?: string | null;
}

/**
 * Git Info Client DTO
 */
export interface GitInfoClientDTO {
  isGitRepo: boolean;
  currentBranch?: string | null;
  hasChanges?: boolean | null;
  branchIcon: string;
  statusText: string;
  statusColor: string;
}

/**
 * Git Info Persistence DTO
 */
export interface GitInfoPersistenceDTO {
  is_git_repo: boolean;
  current_branch?: string | null;
  has_changes?: boolean | null;
  remote_url?: string | null;
}

// ============ 类型导出 ============

export type GitInfoServer = IGitInfoServer;
export type GitInfoClient = IGitInfoClient;
