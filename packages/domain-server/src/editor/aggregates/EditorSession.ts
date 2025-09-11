import { EditorSessionCore, EditorGroupCore, EditorLayoutCore } from '@dailyuse/domain-core';
import { type EditorContracts } from '@dailyuse/contracts';

// 获取类型定义
type EditorSessionDTO = EditorContracts.EditorSessionDTO;

/**
 * 服务端 EditorSession 聚合根
 * 继承核心 EditorSession 类，添加服务端特有功能
 */
export class EditorSession extends EditorSessionCore {
  private _isActive: boolean;
  private _lastAccessedAt?: Date;
  private _workspaceRootPath?: string;
  private _configuration?: Record<string, any>;
  private _metadata?: Record<string, any>;

  constructor(params: {
    uuid?: string;
    accountUuid: string;
    name: string;
    groups?: EditorGroupCore[];
    activeGroupId?: string | null;
    layout: EditorLayoutCore;
    autoSave?: boolean;
    autoSaveInterval?: number;
    lastSavedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    // 服务端特有字段
    isActive?: boolean;
    lastAccessedAt?: Date;
    workspaceRootPath?: string;
    configuration?: Record<string, any>;
    metadata?: Record<string, any>;
  }) {
    super(params);

    this._isActive = params.isActive || false;
    this._lastAccessedAt = params.lastAccessedAt;
    this._workspaceRootPath = params.workspaceRootPath;
    this._configuration = params.configuration;
    this._metadata = params.metadata;
  }

  // ===== 实现抽象方法 =====

  /**
   * 转换为DTO
   */
  toDTO(): EditorSessionDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      name: this.name,
      groups: this.groups.map((group) => group.toDTO()),
      activeGroupId: this.activeGroupId,
      layout: this.layout.toDTO(),
      autoSave: this.autoSave,
      autoSaveInterval: this.autoSaveInterval,
      lastSavedAt: this.lastSavedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // ===== Getter 方法 =====
  get isActive(): boolean {
    return this._isActive;
  }
  get lastAccessedAt(): Date | undefined {
    return this._lastAccessedAt;
  }
  get workspaceRootPath(): string | undefined {
    return this._workspaceRootPath;
  }
  get configuration(): Record<string, any> | undefined {
    return this._configuration;
  }
  get metadata(): Record<string, any> | undefined {
    return this._metadata;
  }

  // ===== 服务端特有方法 =====

  /**
   * 激活会话
   */
  activate(): void {
    if (this._isActive) {
      throw new Error('会话已经处于激活状态');
    }
    this._isActive = true;
    this.updateLastAccessedAt();
  }

  /**
   * 停用会话
   */
  deactivate(): void {
    if (!this._isActive) {
      throw new Error('会话未处于激活状态');
    }
    this._isActive = false;
  }

  /**
   * 更新最后访问时间
   */
  updateLastAccessedAt(): void {
    this._lastAccessedAt = new Date();
    this.updateTimestamp(); // 更新updatedAt时间戳
  }

  /**
   * 设置工作区根路径
   */
  setWorkspaceRootPath(path: string): void {
    this._workspaceRootPath = path;
    this.updateTimestamp();
  }

  /**
   * 更新配置
   */
  updateConfiguration(config: Record<string, any>): void {
    this._configuration = { ...this._configuration, ...config };
    this.updateTimestamp();
  }

  /**
   * 更新元数据
   */
  updateMetadata(metadata: Record<string, any>): void {
    this._metadata = { ...this._metadata, ...metadata };
    this.updateTimestamp();
  }

  /**
   * 获取会话持久化数据
   */
  toPersistenceData(): Record<string, any> {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      name: this.name,
      groups: this.groups.map((group) => group.toDTO()),
      activeGroupId: this.activeGroupId,
      layout: this.layout.toDTO(),
      autoSave: this.autoSave,
      autoSaveInterval: this.autoSaveInterval,
      lastSavedAt: this.lastSavedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isActive: this._isActive,
      lastAccessedAt: this._lastAccessedAt,
      workspaceRootPath: this._workspaceRootPath,
      configuration: this._configuration,
      metadata: this._metadata,
    };
  }

  /**
   * 从持久化数据恢复会话
   */
  static fromPersistenceData(data: Record<string, any>): EditorSession {
    // 这里需要实际的EditorGroup和EditorLayout实现来恢复完整的对象
    // 暂时返回基本的EditorSession实例
    throw new Error('fromPersistenceData方法需要在实际使用时根据具体的持久化数据结构实现');
  }

  /**
   * 验证会话是否可以安全删除
   */
  canBeDeleted(): boolean {
    // 如果当前会话处于活跃状态，不能删除
    if (this._isActive) {
      return false;
    }
    // 检查是否有未保存的更改
    if (this.hasUnsavedChanges) {
      return false;
    }
    return true;
  }

  /**
   * 清理会话资源
   */
  cleanup(): void {
    this.deactivate();
    // 清理其他资源...
  }
}
