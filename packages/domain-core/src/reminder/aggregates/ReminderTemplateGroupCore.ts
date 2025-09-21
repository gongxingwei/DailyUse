import { AggregateRoot } from '@dailyuse/utils';
import { ReminderContracts } from '@dailyuse/contracts';
import type { ReminderTemplateCore } from './ReminderTemplateCore';

/**
 * ReminderTemplateGroup核心基类 - 包含共享属性和基础计算
 * 管理一组ReminderTemplate的集合和启用状态
 */
export abstract class ReminderTemplateGroupCore extends AggregateRoot {
  protected _name: string;
  protected _description?: string;
  protected _enabled: boolean;
  protected _enableMode: ReminderContracts.ReminderTemplateEnableMode;
  protected _parentUuid?: string;
  protected _icon?: string;
  protected _color?: string;
  protected _sortOrder: number;
  protected _lifecycle: {
    createdAt: Date;
    updatedAt: Date;
  };

  // 聚合根关联的模板 - 由子类实现具体类型
  abstract templates: ReminderTemplateCore[];

  constructor(params: {
    uuid?: string;
    name: string;
    description?: string;
    enabled?: boolean;
    enableMode?: ReminderContracts.ReminderTemplateEnableMode;
    parentUuid?: string;
    icon?: string;
    color?: string;
    sortOrder?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    const uuid = params.uuid || AggregateRoot.generateUUID();
    super(uuid);

    const now = new Date();

    this._name = params.name;
    this._description = params.description;
    this._enabled = params.enabled ?? true;
    this._enableMode = params.enableMode || ReminderContracts.ReminderTemplateEnableMode.GROUP;
    this._parentUuid = params.parentUuid;
    this._icon = params.icon;
    this._color = params.color;
    this._sortOrder = params.sortOrder || 0;
    this._lifecycle = {
      createdAt: params.createdAt || now,
      updatedAt: params.updatedAt || now,
    };
  }

  // ===== 共享只读属性 =====
  get name(): string {
    return this._name;
  }

  get description(): string | undefined {
    return this._description;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get enableMode(): ReminderContracts.ReminderTemplateEnableMode {
    return this._enableMode;
  }

  get parentUuid(): string | undefined {
    return this._parentUuid;
  }

  get icon(): string | undefined {
    return this._icon;
  }

  get color(): string | undefined {
    return this._color;
  }

  get sortOrder(): number {
    return this._sortOrder;
  }

  get createdAt(): Date {
    return this._lifecycle.createdAt;
  }

  get updatedAt(): Date {
    return this._lifecycle.updatedAt;
  }

  // ===== 共享计算属性 =====

  /**
   * 获取有效的（启用的）模板数量
   */
  get activeTemplateCount(): number {
    return this.templates.filter((template) => template.enabled).length;
  }

  /**
   * 获取模板总数
   */
  get templateCount(): number {
    return this.templates.length;
  }

  /**
   * 检查组是否有效（至少有一个启用的模板）
   */
  get isEffective(): boolean {
    return this._enabled && this.activeTemplateCount > 0;
  }

  /**
   * 获取组的层级深度（通过parentUuid计算）
   */
  get depth(): number {
    // 这里简化处理，实际应该通过递归查找parent链计算
    return this._parentUuid ? 1 : 0;
  }

  /**
   * 检查是否为根组
   */
  get isRootGroup(): boolean {
    return !this._parentUuid;
  }

  /**
   * 检查是否为子组
   */
  get isSubGroup(): boolean {
    return !!this._parentUuid;
  }

  // ===== 共享验证方法 =====

  protected validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('组名称不能为空');
    }
    if (name.length > 100) {
      throw new Error('组名称不能超过100个字符');
    }
  }

  protected validateSortOrder(sortOrder: number): void {
    if (sortOrder < 0) {
      throw new Error('排序顺序不能为负数');
    }
  }

  protected validateParentUuid(parentUuid: string, currentUuid: string): void {
    if (parentUuid === currentUuid) {
      throw new Error('组不能设置自己为父组');
    }
  }

  // ===== 共享业务方法 =====

  /**
   * 更新组的基本信息
   */
  updateBasicInfo(params: {
    name?: string;
    description?: string;
    icon?: string;
    color?: string;
    sortOrder?: number;
  }): void {
    if (params.name !== undefined) {
      this.validateName(params.name);
      this._name = params.name;
    }

    if (params.description !== undefined) {
      this._description = params.description;
    }

    if (params.icon !== undefined) {
      this._icon = params.icon;
    }

    if (params.color !== undefined) {
      this._color = params.color;
    }

    if (params.sortOrder !== undefined) {
      this.validateSortOrder(params.sortOrder);
      this._sortOrder = params.sortOrder;
    }

    this.updateTimestamp();
  }

  /**
   * 启用/禁用整个组
   */
  toggleEnabled(enabled: boolean): void {
    if (this._enabled === enabled) {
      return;
    }

    this._enabled = enabled;
    this.updateTimestamp();

    // 根据启用模式处理组内模板
    if (this._enableMode === ReminderContracts.ReminderTemplateEnableMode.GROUP) {
      // 组模式：组的启用状态影响所有模板
      this.templates.forEach((template) => {
        template.toggleEnabled(enabled);
      });
    }
  }

  /**
   * 更新组的启用模式
   */
  updateEnableMode(enableMode: ReminderContracts.ReminderTemplateEnableMode): void {
    if (this._enableMode === enableMode) {
      return;
    }

    const oldMode = this._enableMode;
    this._enableMode = enableMode;
    this.updateTimestamp();

    // 如果切换到组模式，同步所有模板的启用状态
    if (enableMode === ReminderContracts.ReminderTemplateEnableMode.GROUP) {
      this.templates.forEach((template) => {
        template.toggleEnabled(this._enabled);
      });
    }
  }

  /**
   * 移动到新的父组
   */
  moveToParent(parentUuid?: string): void {
    if (parentUuid) {
      this.validateParentUuid(parentUuid, this.uuid);
    }

    this._parentUuid = parentUuid;
    this.updateTimestamp();
  }

  // ===== 抽象方法（由子类实现）=====

  /**
   * 添加模板到组中（抽象方法）
   */
  abstract addTemplate(template: ReminderTemplateCore): void;

  /**
   * 从组中移除模板（抽象方法）
   */
  abstract removeTemplate(templateUuid: string): void;

  /**
   * 批量操作组内模板（抽象方法）
   */
  abstract batchUpdateTemplates(
    operation: 'enable' | 'disable' | 'delete',
    templateUuids: string[],
  ): void;

  /**
   * 获取指定模板（抽象方法）
   */
  abstract getTemplate(templateUuid: string): ReminderTemplateCore | undefined;

  /**
   * 克隆组（抽象方法）
   */
  abstract clone(): ReminderTemplateGroupCore;

  // ===== 共享辅助方法 =====

  protected updateTimestamp(): void {
    this._lifecycle.updatedAt = new Date();
  }

  // ===== 序列化方法 =====

  toDTO(): ReminderContracts.IReminderTemplateGroup {
    return {
      uuid: this.uuid,
      name: this._name,
      description: this._description,
      enabled: this._enabled,
      enableMode: this._enableMode,
      parentUuid: this._parentUuid,
      icon: this._icon,
      color: this._color,
      sortOrder: this._sortOrder,
      createdAt: this._lifecycle.createdAt,
      updatedAt: this._lifecycle.updatedAt,
    };
  }

  static fromDTO(dto: ReminderContracts.IReminderTemplateGroup): ReminderTemplateGroupCore {
    throw new Error('Method not implemented. Use subclass implementations.');
  }
}
