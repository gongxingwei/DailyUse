import { AggregateRoot } from '@dailyuse/utils';
import { type GoalContracts } from '@dailyuse/contracts';
import type { IGoalDir } from '@dailyuse/contracts';

/**
 * GoalDir核心基类 - 目标目录
 */
export abstract class GoalDirCore extends AggregateRoot implements IGoalDir {
  protected _accountUuid: string;
  protected _name: string;
  protected _description?: string;
  protected _icon: string;
  protected _color: string;
  protected _parentUuid?: string;
  protected _sortConfig: {
    sortKey: string;
    sortOrder: number;
  };
  protected _lifecycle: {
    createdAt: Date;
    updatedAt: Date;
    status: 'active' | 'archived';
  };

  constructor(params: {
    uuid?: string;
    accountUuid: string;
    name: string;
    description?: string;
    icon: string;
    color: string;
    parentUuid?: string;
    sortConfig?: {
      sortKey: string;
      sortOrder: number;
    };
    status?: 'active' | 'archived';
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    const now = new Date();

    this._accountUuid = params.accountUuid;
    this._name = params.name;
    this._description = params.description;
    this._icon = params.icon;
    this._color = params.color;
    this._parentUuid = params.parentUuid;
    this._sortConfig = params.sortConfig || {
      sortKey: 'createdAt',
      sortOrder: 0,
    };
    this._lifecycle = {
      createdAt: params.createdAt || now,
      updatedAt: params.updatedAt || now,
      status: params.status || 'active',
    };
  }

  // ===== 共享只读属性 =====
  get accountUuid(): string {
    return this._accountUuid;
  }
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
  get sortConfig(): { sortKey: string; sortOrder: number } {
    return this._sortConfig;
  }
  get lifecycle(): { createdAt: Date; updatedAt: Date; status: 'active' | 'archived' } {
    return this._lifecycle;
  }
  get status(): 'active' | 'archived' {
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
      sortKey: string;
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

  // ===== 序列化方法 =====
  toDTO(): GoalContracts.GoalDirDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      description: this._description,
      icon: this._icon,
      color: this._color,
      parentUuid: this._parentUuid,
      sortConfig: this._sortConfig,
      lifecycle: {
        createdAt: this._lifecycle.createdAt.getTime(),
        updatedAt: this._lifecycle.updatedAt.getTime(),
        status: this._lifecycle.status,
      },
    };
  }

  static fromDTO(dto: GoalContracts.GoalDirDTO): GoalDirCore {
    throw new Error('Method not implemented. Use subclass implementations.');
  }

  // ===== 抽象方法（由子类实现）=====
  abstract archive(): void;
  abstract activate(): void;
}
