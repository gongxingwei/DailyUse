/**
 * Workspace Repository Interface
 * 工作区仓储接口 - 定义工作区聚合根的数据访问契约
 */

import { EditorContracts } from '@dailyuse/contracts';

export interface IWorkspaceRepository {
  // ============ 基本CRUD操作 ============

  /**
   * 创建新工作区
   */
  create(
    accountUuid: string,
    workspaceData: Omit<EditorContracts.IEditorWorkspace, 'uuid' | 'lifecycle'>,
  ): Promise<EditorContracts.IEditorWorkspace>;

  /**
   * 根据UUID查找工作区
   */
  findByUuid(
    accountUuid: string,
    workspaceUuid: string,
  ): Promise<EditorContracts.IEditorWorkspace | null>;

  /**
   * 更新工作区
   */
  update(
    accountUuid: string,
    workspaceUuid: string,
    updates: Partial<EditorContracts.IEditorWorkspace>,
  ): Promise<EditorContracts.IEditorWorkspace>;

  /**
   * 删除工作区
   */
  delete(accountUuid: string, workspaceUuid: string): Promise<void>;

  // ============ 查询操作 ============

  /**
   * 获取用户的所有工作区
   */
  findByAccount(
    accountUuid: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: 'name' | 'createdAt' | 'updatedAt';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<EditorContracts.IEditorWorkspace[]>;

  /**
   * 根据仓库查找工作区
   */
  findByRepository(
    accountUuid: string,
    repositoryUuid: string,
  ): Promise<EditorContracts.IEditorWorkspace[]>;

  /**
   * 获取当前活跃的工作区
   */
  findActiveWorkspace(accountUuid: string): Promise<EditorContracts.IEditorWorkspace | null>;

  /**
   * 设置活跃工作区
   */
  setActiveWorkspace(accountUuid: string, workspaceUuid: string): Promise<void>;

  /**
   * 获取最近使用的工作区
   */
  findRecentlyUsed(
    accountUuid: string,
    limit?: number,
  ): Promise<EditorContracts.IEditorWorkspace[]>;

  // ============ 工作区状态管理 ============

  /**
   * 在工作区中打开文档
   */
  addOpenDocument(
    accountUuid: string,
    workspaceUuid: string,
    openDocument: EditorContracts.OpenDocument,
  ): Promise<EditorContracts.IEditorWorkspace>;

  /**
   * 从工作区关闭文档
   */
  removeOpenDocument(
    accountUuid: string,
    workspaceUuid: string,
    documentUuid: string,
  ): Promise<EditorContracts.IEditorWorkspace>;

  /**
   * 设置当前活跃文档
   */
  setCurrentDocument(
    accountUuid: string,
    workspaceUuid: string,
    documentUuid: string | undefined,
  ): Promise<EditorContracts.IEditorWorkspace>;

  /**
   * 更新打开的文档状态
   */
  updateOpenDocument(
    accountUuid: string,
    workspaceUuid: string,
    documentUuid: string,
    updates: Partial<EditorContracts.OpenDocument>,
  ): Promise<EditorContracts.IEditorWorkspace>;

  // ============ 布局和设置管理 ============

  /**
   * 更新工作区布局
   */
  updateLayout(
    accountUuid: string,
    workspaceUuid: string,
    layout: Partial<EditorContracts.WorkspaceLayout>,
  ): Promise<EditorContracts.IEditorWorkspace>;

  /**
   * 更新工作区设置
   */
  updateSettings(
    accountUuid: string,
    workspaceUuid: string,
    settings: Partial<EditorContracts.EditorSettings>,
  ): Promise<EditorContracts.IEditorWorkspace>;

  /**
   * 更新侧边栏状态
   */
  updateSidebarState(
    accountUuid: string,
    workspaceUuid: string,
    sidebarState: Partial<EditorContracts.SidebarState>,
  ): Promise<EditorContracts.IEditorWorkspace>;

  /**
   * 更新搜索状态
   */
  updateSearchState(
    accountUuid: string,
    workspaceUuid: string,
    searchState: Partial<EditorContracts.SearchState>,
  ): Promise<EditorContracts.IEditorWorkspace>;

  // ============ 统计操作 ============

  /**
   * 获取工作区总数
   */
  getCount(accountUuid: string): Promise<number>;

  /**
   * 获取工作区使用统计
   */
  getUsageStats(
    accountUuid: string,
    workspaceUuid: string,
  ): Promise<{
    totalDocuments: number;
    openDocuments: number;
    lastUsedAt: Date;
    totalUsageTime: number; // 毫秒
  }>;

  // ============ 批量操作 ============

  /**
   * 批量更新工作区
   */
  updateMany(
    accountUuid: string,
    updates: Array<{
      workspaceUuid: string;
      data: Partial<EditorContracts.IEditorWorkspace>;
    }>,
  ): Promise<EditorContracts.IEditorWorkspace[]>;

  /**
   * 清理不活跃的工作区
   */
  cleanupInactive(accountUuid: string, daysInactive: number): Promise<number>; // 返回清理的数量
}
