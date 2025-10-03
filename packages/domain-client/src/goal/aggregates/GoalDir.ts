import { GoalDirCore } from '@dailyuse/domain-core';
import { GoalContracts } from '@dailyuse/contracts';

// 枚举别名
const GoalDirStatusEnum = GoalContracts.GoalDirStatus;

/**
 * 客户端 GoalDir 实体
 * 继承核心 GoalDir 类，添加客户端特有功能
 */
export class GoalDir extends GoalDirCore {
  // 变更跟踪系统（为将来扩展预留）
  private _originalState: {
    name: string;
    description?: string;
    icon: string;
    color: string;
    parentUuid?: string;
    sortConfig?: {
      sortKey: GoalContracts.GoalSortField;
      sortOrder: number;
    };
  } | null = null;

  private _isDirty = false;

  constructor(params: {
    uuid?: string;
    name: string;
    description?: string;
    icon: string;
    color: string;
    parentUuid?: string;
    sortConfig?: {
      sortKey: GoalContracts.GoalSortField;
      sortOrder: number;
    };
    status?: GoalContracts.GoalDirStatus;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(params);
  }

  // ===== 变更跟踪系统 =====

  /**
   * 开始编辑模式 - 保存当前状态作为原始状态
   */
  startEditing(): void {
    this._originalState = {
      name: this._name,
      description: this._description,
      icon: this._icon,
      color: this._color,
      parentUuid: this._parentUuid,
      sortConfig: this._sortConfig ? { ...this._sortConfig } : undefined,
    };
    this._isDirty = false;
  }

  /**
   * 取消编辑 - 恢复到原始状态
   */
  cancelEditing(): void {
    if (this._originalState) {
      this._name = this._originalState.name;
      this._description = this._originalState.description;
      this._icon = this._originalState.icon;
      this._color = this._originalState.color;
      this._parentUuid = this._originalState.parentUuid;
      if (this._originalState.sortConfig) {
        this._sortConfig = { ...this._originalState.sortConfig };
      }
      this._isDirty = false;
    }
    this._originalState = null;
  }

  /**
   * 提交编辑 - 清除原始状态
   */
  commitEditing(): void {
    this._originalState = null;
    this._isDirty = false;
  }

  /**
   * 检查是否有未保存的更改
   */
  get hasUnsavedChanges(): boolean {
    return this._isDirty;
  }

  /**
   * 标记为已修改
   */
  markDirty(): void {
    this._isDirty = true;
  }

  // ===== 客户端特有方法 =====

  /**
   * 归档目录
   */
  archive(): void {
    this._lifecycle.status = GoalDirStatusEnum.ARCHIVED;
    this._lifecycle.updatedAt = new Date();
  }

  /**
   * 激活目录
   */
  activate(): void {
    this._lifecycle.status = GoalDirStatusEnum.ACTIVE;
    this._lifecycle.updatedAt = new Date();
  }

  // ===== 客户端特有计算属性 =====

  /**
   * 是否为系统目录
   */
  get isSystemDir(): boolean {
    return this.uuid.startsWith('system_');
  }

  /**
   * 是否可以编辑
   */
  get canEdit(): boolean {
    return !this.isSystemDir && this._lifecycle.status === 'active';
  }

  /**
   * 是否可以删除
   */
  get canDelete(): boolean {
    return !this.isSystemDir && this._lifecycle.status === 'archived';
  }

  /**
   * 获取显示图标
   */
  get displayIcon(): string {
    return this._icon || 'mdi-folder';
  }

  /**
   * 获取显示颜色
   */
  get displayColor(): string {
    return this._color || '#2196F3';
  }

  /**
   * 获取状态文本
   */
  get statusText(): string {
    return this._lifecycle.status === 'active' ? '活跃' : '已归档';
  }

  /**
   * 转换为表单数据（用于编辑表单）
   */
  toFormData(): {
    name: string;
    description: string;
    icon: string;
    color: string;
    parentUuid: string;
  } {
    return {
      name: this._name,
      description: this._description || '',
      icon: this._icon,
      color: this._color,
      parentUuid: this._parentUuid || '',
    };
  }

  // ===== 序列化方法 =====

  toDTO(): GoalContracts.GoalDirDTO {
    return {
      uuid: this._uuid,
      name: this._name,
      description: this._description,
      icon: this._icon,
      color: this._color,
      parentUuid: this._parentUuid,
      sortConfig: this._sortConfig,
      lifecycle: {
        status: this._lifecycle.status,
        createdAt: this._lifecycle.createdAt.getTime(),
        updatedAt: this._lifecycle.updatedAt.getTime(),
      },
    };
  }

  static fromDTO(dto: GoalContracts.GoalDirDTO): GoalDir {
    return new GoalDir({
      uuid: dto.uuid,
      name: dto.name,
      description: dto.description,
      icon: dto.icon,
      color: dto.color,
      parentUuid: dto.parentUuid,
      sortConfig: dto.sortConfig,
      status: dto.lifecycle.status,
      createdAt: new Date(dto.lifecycle.createdAt),
      updatedAt: new Date(dto.lifecycle.updatedAt),
    });
  }

  static fromResponse(response: GoalContracts.GoalDirResponse): GoalDir {
    return GoalDir.fromDTO(response);
  }

  /**
   * 从客户端 DTO 创建实体
   */
  static fromClientDTO(dto: GoalContracts.GoalDirClientDTO): GoalDir {
    // ClientDTO 包含计算属性，但我们只需要基础属性来创建实体
    return GoalDir.fromDTO({
      uuid: dto.uuid,
      name: dto.name,
      description: dto.description,
      icon: dto.icon,
      color: dto.color,
      parentUuid: dto.parentUuid,
      sortConfig: dto.sortConfig,
      lifecycle: dto.lifecycle,
    });
  }

  /**
   * 创建一个空的目录实例（用于新建表单）
   */
  static forCreate(): GoalDir {
    return new GoalDir({
      name: '',
      icon: 'mdi-folder',
      color: '#2196F3',
    });
  }

  /**
   * 克隆当前对象（深拷贝）
   * 用于表单编辑时避免直接修改原数据
   */
  clone(): GoalDir {
    return GoalDir.fromDTO(this.toDTO());
  }
}
