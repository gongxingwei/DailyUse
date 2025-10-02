import { AggregateRoot } from '@dailyuse/utils';
import { GoalContracts } from '@dailyuse/contracts';

// 类型导入
type GoalDirStatus = GoalContracts.GoalDirStatus;
type GoalSortField = GoalContracts.GoalSortField;

// 常量导入
const GoalDirStatusEnum = GoalContracts.GoalDirStatus;
const GoalSortFieldEnum = GoalContracts.GoalSortField;

/**
 * GoalDir核心基类 - 目标目录
 */
export abstract class GoalDirCore extends AggregateRoot implements GoalContracts.IGoalDir {
  protected _name: string;
  protected _description?: string;
  protected _icon: string;
  protected _color: string;
  protected _parentUuid?: string;
  protected _sortConfig: {
    sortKey: GoalSortField;
    sortOrder: number;
  };
  protected _lifecycle: {
    createdAt: Date;
    updatedAt: Date;
    status: GoalDirStatus;
  };

  constructor(params: {
    uuid?: string;
    name: string;
    description?: string;
    icon: string;
    color: string;
    parentUuid?: string;
    sortConfig?: {
      sortKey: GoalSortField;
      sortOrder: number;
    };
    status?: GoalDirStatus;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    const now = new Date();

    this._name = params.name;
    this._description = params.description;
    this._icon = params.icon;
    this._color = params.color;
    this._parentUuid = params.parentUuid;
    this._sortConfig = params.sortConfig || {
      sortKey: GoalSortFieldEnum.CREATED_AT,
      sortOrder: 0,
    };
    this._lifecycle = {
      createdAt: params.createdAt || now,
      updatedAt: params.updatedAt || now,
      status: params.status || GoalDirStatusEnum.ACTIVE,
    };
  }

  // ===== 共享只读属性 =====
  get name(): string {
    return this._name;
  }
  get description(): string | undefined {
    return this._description;
  }
  get icon(): string {
    return this._icon;
  }
  get color(): string {
    return this._color;
  }
  get parentUuid(): string | undefined {
    return this._parentUuid;
  }
  get sortConfig(): { sortKey: GoalSortField; sortOrder: number } {
    return this._sortConfig;
  }
  get lifecycle(): { createdAt: Date; updatedAt: Date; status: GoalDirStatus } {
    return this._lifecycle;
  }
  get status(): GoalDirStatus {
    return this._lifecycle.status;
  }
  get createdAt(): Date {
    return this._lifecycle.createdAt;
  }
  get updatedAt(): Date {
    return this._lifecycle.updatedAt;
  }

  // ===== 共享业务方法 =====

  /**
   * 更新目录信息
   */
  updateInfo(params: {
    name?: string;
    description?: string;
    icon?: string;
    color?: string;
    parentUuid?: string;
    sortConfig?: {
      sortKey: GoalSortField;
      sortOrder: number;
    };
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
      this.validateColor(params.color);
      this._color = params.color;
    }

    if (params.parentUuid !== undefined) {
      this._parentUuid = params.parentUuid;
    }

    if (params.sortConfig !== undefined) {
      this._sortConfig = params.sortConfig;
    }

    this._lifecycle.updatedAt = new Date();
  }

  // ===== 共享验证方法 =====
  protected validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('目录名称不能为空');
    }
    if (name.length > 50) {
      throw new Error('目录名称不能超过50个字符');
    }
  }

  protected validateColor(color: string): void {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!colorRegex.test(color)) {
      throw new Error('颜色格式不正确');
    }
  }

  // ===== 抽象方法（由子类实现）=====
  abstract toDTO(): GoalContracts.GoalDirDTO;
  abstract archive(): void;
  abstract activate(): void;
}
