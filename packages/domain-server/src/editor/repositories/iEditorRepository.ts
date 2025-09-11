import { EditorSession } from '../aggregates/EditorSession';
import { EditorGroup } from '../aggregates/EditorGroup';
import { EditorTab } from '../entities/EditorTab';
import { EditorLayout } from '../aggregates/EditorLayout';

/**
 * 编辑器会话仓储接口
 */
export interface IEditorSessionRepository {
  /**
   * 根据ID查找会话
   */
  findById(id: string): Promise<EditorSession | null>;

  /**
   * 根据账户UUID查找所有会话
   */
  findByAccountUuid(accountUuid: string): Promise<EditorSession[]>;

  /**
   * 查找活动会话
   */
  findActiveSession(accountUuid: string): Promise<EditorSession | null>;

  /**
   * 保存会话
   */
  save(session: EditorSession): Promise<EditorSession>;

  /**
   * 删除会话
   */
  delete(id: string): Promise<void>;

  /**
   * 检查会话是否存在
   */
  exists(id: string): Promise<boolean>;
}

/**
 * 编辑器组仓储接口
 */
export interface IEditorGroupRepository {
  /**
   * 根据ID查找组
   */
  findById(id: string): Promise<EditorGroup | null>;

  /**
   * 根据会话ID查找所有组
   */
  findBySessionId(sessionId: string): Promise<EditorGroup[]>;

  /**
   * 保存组
   */
  save(group: EditorGroup): Promise<EditorGroup>;

  /**
   * 删除组
   */
  delete(id: string): Promise<void>;

  /**
   * 批量保存组
   */
  saveBatch(groups: EditorGroup[]): Promise<EditorGroup[]>;
}

/**
 * 编辑器标签页仓储接口
 */
export interface IEditorTabRepository {
  /**
   * 根据ID查找标签页
   */
  findById(id: string): Promise<EditorTab | null>;

  /**
   * 根据组ID查找所有标签页
   */
  findByGroupId(groupId: string): Promise<EditorTab[]>;

  /**
   * 根据文件路径查找标签页
   */
  findByPath(path: string): Promise<EditorTab | null>;

  /**
   * 查找所有脏标签页
   */
  findDirtyTabs(accountUuid: string): Promise<EditorTab[]>;

  /**
   * 保存标签页
   */
  save(tab: EditorTab): Promise<EditorTab>;

  /**
   * 删除标签页
   */
  delete(id: string): Promise<void>;

  /**
   * 批量保存标签页
   */
  saveBatch(tabs: EditorTab[]): Promise<EditorTab[]>;
}

/**
 * 编辑器布局仓储接口
 */
export interface IEditorLayoutRepository {
  /**
   * 根据ID查找布局
   */
  findById(id: string): Promise<EditorLayout | null>;

  /**
   * 根据账户UUID查找所有布局
   */
  findByAccountUuid(accountUuid: string): Promise<EditorLayout[]>;

  /**
   * 查找默认布局
   */
  findDefaultLayout(accountUuid: string): Promise<EditorLayout | null>;

  /**
   * 保存布局
   */
  save(layout: EditorLayout): Promise<EditorLayout>;

  /**
   * 删除布局
   */
  delete(id: string): Promise<void>;

  /**
   * 设置默认布局
   */
  setAsDefault(id: string, accountUuid: string): Promise<void>;
}
