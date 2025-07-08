import { AggregateRoot } from "@/shared/domain/aggregateRoot";
import { TimeUtils } from "@/shared/utils/myDateTimeUtils";
import type { IGoalDir } from "../types/goal";

/**
 * 目标目录领域实体
 * 负责目标目录的业务逻辑和数据管理
 */
export class GoalDir extends AggregateRoot implements IGoalDir {
  private _name: string;
  private _icon: string;
  private _parentId?: string;
  private _lifecycle: IGoalDir['lifecycle'];

  constructor(
    id?: string,
    name?: string,
    icon?: string,
    parentId?: string
  ) {
    super(id || GoalDir.generateId());
    const now = TimeUtils.now();

    this._name = name || '';
    this._icon = icon || 'default-icon'; // 默认图标
    this._parentId = parentId;

    this._lifecycle = {
      createdAt: now,
      updatedAt: now,
      status: "active",
    };
  }

  // Getters
  get name(): string {
    return this._name;
  }

  get icon(): string {
    return this._icon;
  }

  get parentId(): string | undefined {
    return this._parentId;
  }

  get lifecycle(): IGoalDir['lifecycle'] {
    return this._lifecycle;
  }

  /**
   * 更新目录信息
   */
  updateInfo(updates: {
    name?: string;
    icon?: string;
    parentId?: string;
  }): void {
    if (updates.name !== undefined) {
      if (!updates.name.trim()) {
        throw new Error("目录名称不能为空");
      }
      this._name = updates.name;
    }

    if (updates.icon !== undefined) {
      this._icon = updates.icon;
    }

    if (updates.parentId !== undefined) {
      // 防止循环引用
      if (updates.parentId === this.id) {
        throw new Error("目录不能设置自己为父目录");
      }
      this._parentId = updates.parentId;
    }

    this._lifecycle.updatedAt = TimeUtils.now();
  }

  updateName(name: string): void {
    this._name = name;
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  updateIcon(icon: string): void {
    this._icon = icon;
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  updateParentId(parentId?: string): void {
    // 防止循环引用
    if (parentId === this.id) {
      throw new Error("目录不能设置自己为父目录");
    }
    this._parentId = parentId;
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  /**
   * 归档目录
   */
  archive(): void {
    this._lifecycle.status = "archived";
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  /**
   * 转换为数据传输对象
   */
  toDTO(): IGoalDir {
    const rawData = {
      id: this.id,
      name: this._name,
      icon: this._icon,
      parentId: this._parentId,
      lifecycle: this._lifecycle,
    };

    // 使用深度序列化确保返回纯净的 JSON 对象
    try {
      return JSON.parse(JSON.stringify(rawData));
    } catch (error) {
      console.error('❌ [GoalDir.toDTO] 序列化失败:', error);
      // 如果序列化失败，返回基本信息
      return {
        id: this.id,
        name: this._name,
        icon: this._icon,
        parentId: this._parentId,
        lifecycle: JSON.parse(JSON.stringify(this._lifecycle)),
      };
    }
  }

  /**
   * 导出完整数据（用于序列化）
   */
  toJSON(): IGoalDir {
    return this.toDTO();
  }

  /**
   * 从数据传输对象创建目录实例
   */
  static fromDTO(data: IGoalDir): GoalDir {
    const goalDir = new GoalDir(data.id, data.name, data.icon, data.parentId);
    goalDir._lifecycle = data.lifecycle;
    return goalDir;
  }

  /**
   * 从创建数据传输对象创建目录
   */
  static fromCreateDTO(id: string, data: IGoalDir): GoalDir {
    return new GoalDir(
      id,
      data.name,
      data.icon,
      data.parentId
    );
  }

  clone(): GoalDir {
    const clone = new GoalDir(
      this.id,
      this._name,
      this._icon,
      this._parentId
    );
    clone._lifecycle = { ...this._lifecycle }; // 浅拷贝生命周期数据
    return clone;
  }
  /**
   * 验证目录数据
   */
  static validate(data: IGoalDir): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.name?.trim()) {
      errors.push("目录名称不能为空");
    }

    if (!data.icon?.trim()) {
      errors.push("目录图标不能为空");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
