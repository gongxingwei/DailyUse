/**
 * Editor 领域仓储接口
 * 定义所有 Editor 相关实体的数据访问契约
 *
 * 注意：仓储层返回的是结构化数据（与DTO定义一致），而不是领域实体
 * 这样可以避免仓储层与领域层的紧耦合，并便于数据库直接映射
 */
import type { EditorContracts } from '@dailyuse/contracts';

export interface IEditorRepository {
  // ========================= EditorSession 相关 =========================

  /**
   * 创建编辑器会话
   */
  createEditorSession(
    accountUuid: string,
    sessionData: Omit<EditorContracts.EditorSessionDTO, 'uuid' | 'createdAt' | 'updatedAt'>,
  ): Promise<EditorContracts.EditorSessionDTO>;

  /**
   * 根据UUID获取编辑器会话
   */
  getEditorSessionByUuid(
    accountUuid: string,
    uuid: string,
  ): Promise<EditorContracts.EditorSessionDTO | null>;

  /**
   * 获取用户所有编辑器会话
   */
  getAllEditorSessions(
    accountUuid: string,
    params?: {
      page?: number;
      limit?: number;
      sortBy?: 'createdAt' | 'updatedAt' | 'name';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<{
    sessions: EditorContracts.EditorSessionDTO[];
    total: number;
  }>;

  /**
   * 更新编辑器会话
   */
  updateEditorSession(
    accountUuid: string,
    uuid: string,
    sessionData: Partial<EditorContracts.EditorSessionDTO>,
  ): Promise<EditorContracts.EditorSessionDTO>;

  /**
   * 删除编辑器会话
   */
  deleteEditorSession(accountUuid: string, uuid: string): Promise<boolean>;

  /**
   * 获取当前活动会话
   */
  getCurrentActiveSession(accountUuid: string): Promise<EditorContracts.EditorSessionDTO | null>;

  /**
   * 设置当前活动会话
   */
  setCurrentActiveSession(accountUuid: string, sessionUuid: string): Promise<boolean>;

  // ========================= EditorGroup 相关 =========================

  /**
   * 创建编辑器组
   */
  createEditorGroup(
    accountUuid: string,
    groupData: Omit<EditorContracts.EditorGroupDTO, 'uuid' | 'createdAt' | 'updatedAt'>,
  ): Promise<EditorContracts.EditorGroupDTO>;

  /**
   * 根据UUID获取编辑器组
   */
  getEditorGroupByUuid(
    accountUuid: string,
    uuid: string,
  ): Promise<EditorContracts.EditorGroupDTO | null>;

  /**
   * 根据会话UUID获取编辑器组列表
   */
  getEditorGroupsBySessionUuid(
    accountUuid: string,
    sessionUuid: string,
  ): Promise<EditorContracts.EditorGroupDTO[]>;

  /**
   * 更新编辑器组
   */
  updateEditorGroup(
    accountUuid: string,
    uuid: string,
    groupData: Partial<EditorContracts.EditorGroupDTO>,
  ): Promise<EditorContracts.EditorGroupDTO>;

  /**
   * 删除编辑器组
   */
  deleteEditorGroup(accountUuid: string, uuid: string): Promise<boolean>;

  /**
   * 批量更新编辑器组顺序
   */
  batchUpdateGroupOrder(
    accountUuid: string,
    groupOrders: Array<{ uuid: string; order: number }>,
  ): Promise<boolean>;

  // ========================= EditorTab 相关 =========================

  /**
   * 创建编辑器标签页
   */
  createEditorTab(
    accountUuid: string,
    tabData: Omit<EditorContracts.EditorTabDTO, 'uuid' | 'createdAt' | 'updatedAt'>,
  ): Promise<EditorContracts.EditorTabDTO>;

  /**
   * 根据UUID获取编辑器标签页
   */
  getEditorTabByUuid(
    accountUuid: string,
    uuid: string,
  ): Promise<EditorContracts.EditorTabDTO | null>;

  /**
   * 根据编辑器组UUID获取标签页列表
   */
  getEditorTabsByGroupUuid(
    accountUuid: string,
    groupUuid: string,
  ): Promise<EditorContracts.EditorTabDTO[]>;

  /**
   * 根据文件路径获取标签页
   */
  getEditorTabByPath(
    accountUuid: string,
    path: string,
  ): Promise<EditorContracts.EditorTabDTO | null>;

  /**
   * 更新编辑器标签页
   */
  updateEditorTab(
    accountUuid: string,
    uuid: string,
    tabData: Partial<EditorContracts.EditorTabDTO>,
  ): Promise<EditorContracts.EditorTabDTO>;

  /**
   * 删除编辑器标签页
   */
  deleteEditorTab(accountUuid: string, uuid: string): Promise<boolean>;

  /**
   * 获取所有未保存的标签页
   */
  getUnsavedTabs(accountUuid: string): Promise<EditorContracts.EditorTabDTO[]>;

  // ========================= EditorLayout 相关 =========================

  /**
   * 创建编辑器布局
   */
  createEditorLayout(
    accountUuid: string,
    layoutData: Omit<EditorContracts.EditorLayoutDTO, 'uuid' | 'createdAt' | 'updatedAt'>,
  ): Promise<EditorContracts.EditorLayoutDTO>;

  /**
   * 根据UUID获取编辑器布局
   */
  getEditorLayoutByUuid(
    accountUuid: string,
    uuid: string,
  ): Promise<EditorContracts.EditorLayoutDTO | null>;

  /**
   * 获取用户所有编辑器布局
   */
  getAllEditorLayouts(accountUuid: string): Promise<EditorContracts.EditorLayoutDTO[]>;

  /**
   * 更新编辑器布局
   */
  updateEditorLayout(
    accountUuid: string,
    uuid: string,
    layoutData: Partial<EditorContracts.EditorLayoutDTO>,
  ): Promise<EditorContracts.EditorLayoutDTO>;

  /**
   * 删除编辑器布局
   */
  deleteEditorLayout(accountUuid: string, uuid: string): Promise<boolean>;

  /**
   * 获取默认布局
   */
  getDefaultLayout(accountUuid: string): Promise<EditorContracts.EditorLayoutDTO | null>;

  /**
   * 设置默认布局
   */
  setDefaultLayout(accountUuid: string, layoutUuid: string): Promise<boolean>;

  // ========================= DDD聚合根控制方法 =========================

  /**
   * 加载完整的EditorSession聚合根
   * 包含会话、编辑器组、标签页、布局等所有子实体
   * 用于聚合根业务操作
   */
  loadEditorSessionAggregate(
    accountUuid: string,
    sessionUuid: string,
  ): Promise<{
    session: EditorContracts.EditorSessionDTO;
    groups: EditorContracts.EditorGroupDTO[];
    tabs: EditorContracts.EditorTabDTO[];
    layout: EditorContracts.EditorLayoutDTO | null;
  } | null>;

  /**
   * 原子性更新EditorSession聚合根
   * 在一个事务中更新会话及其所有子实体
   * 保证聚合一致性
   */
  updateEditorSessionAggregate(
    accountUuid: string,
    aggregateData: {
      session: Partial<EditorContracts.EditorSessionDTO>;
      groups?: Array<{
        action: 'create' | 'update' | 'delete';
        data: EditorContracts.EditorGroupDTO | Partial<EditorContracts.EditorGroupDTO>;
        uuid?: string;
      }>;
      tabs?: Array<{
        action: 'create' | 'update' | 'delete';
        data: EditorContracts.EditorTabDTO | Partial<EditorContracts.EditorTabDTO>;
        uuid?: string;
      }>;
      layout?: {
        action: 'create' | 'update' | 'link';
        data?: EditorContracts.EditorLayoutDTO | Partial<EditorContracts.EditorLayoutDTO>;
        uuid?: string;
      };
    },
  ): Promise<{
    session: EditorContracts.EditorSessionDTO;
    groups: EditorContracts.EditorGroupDTO[];
    tabs: EditorContracts.EditorTabDTO[];
    layout: EditorContracts.EditorLayoutDTO | null;
  }>;

  /**
   * 级联删除EditorSession聚合根
   * 删除会话及其所有相关子实体
   * 保证数据一致性
   */
  cascadeDeleteEditorSessionAggregate(
    accountUuid: string,
    sessionUuid: string,
  ): Promise<{
    deletedSession: EditorContracts.EditorSessionDTO;
    deletedGroups: EditorContracts.EditorGroupDTO[];
    deletedTabs: EditorContracts.EditorTabDTO[];
  }>;
}
