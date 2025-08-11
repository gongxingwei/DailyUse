import { Entity } from '@dailyuse/utils';
import { type IRoleCore } from '../types';
export class RoleCore extends Entity implements IRoleCore {
  private _name: string;
  private _description: string;
  private _permissions: Set<string>;

  /**
   * 构造函数
   * @param params - 角色初始化参数
   * @example
   * new Role({ uuid: "xxx", name: "管理员", description: "系统管理员", permissions: ["p1", "p2"] })
   */
  constructor(params: {
    uuid?: string;
    name: string;
    description?: string;
    permissions?: string[];
  }) {
    super(params.uuid || Entity.generateUUID());
    this._name = params.name;
    this._description = params.description ?? '';
    this._permissions = new Set(params.permissions ?? []);
  }

  get id(): string {
    return this._uuid;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get permissions(): Set<string> {
    return new Set(this._permissions);
  }

  // ======================== 辅助方法 ========================

  /**
   * 创建一个初始化对象（用于新建表单）
   */
  static forCreate(): RoleCore {
    return new RoleCore({
      uuid: '',
      name: '',
      description: '',
      permissions: [],
    });
  }

  /**
   * 判断对象是否为 RoleCore 实例
   */
  static isRole(obj: any): obj is RoleCore {
    return (
      obj instanceof RoleCore ||
      (obj && typeof obj === 'object' && 'uuid' in obj && 'name' in obj && 'permissions' in obj)
    );
  }
}
