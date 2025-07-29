/**
 * Role 实体
 * 角色实体
 */
export interface RoleDTO {
  uuid: string;
  name: string;
  description: string;
  permissions: string[];
}

export class Role {
  private _uuid: string;
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
    uuid: string;
    name: string;
    description?: string;
    permissions?: string[];
  }) {
    this._uuid = params.uuid;
    this._name = params.name;
    this._description = params.description ?? "";
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
   * 转为接口数据（DTO）
   */
  toDTO(): RoleDTO {
    return {
      uuid: this._uuid,
      name: this._name,
      description: this._description,
      permissions: Array.from(this._permissions),
    };
  }

  /**
   * 从接口数据创建实例
   */
  static fromDTO(dto: RoleDTO): Role {
    const role = new Role({
      uuid: dto.uuid,
      name: dto.name,
      description: dto.description,
      permissions: dto.permissions,
    });
    return role;
  }

  /**
   * 克隆当前对象
   */
  clone(): Role {
    return Role.fromDTO(this.toDTO());
  }

  /**
   * 创建一个初始化对象（用于新建表单）
   */
  static forCreate(): Role {
    return new Role({
      uuid: "",
      name: "",
      description: "",
      permissions: [],
    });
  }

  /**
   * 判断对象是否为 Role 实例
   */
  static isRole(obj: any): obj is Role {
    return (
      obj instanceof Role ||
      (obj &&
        typeof obj === "object" &&
        "uuid" in obj &&
        "name" in obj &&
        "permissions" in obj)
    );
  }

  /**
   * 保证返回 Role 实例或 null
   */
  static ensureRole(role: RoleDTO | Role | null): Role | null {
    if (Role.isRole(role)) {
      return role instanceof Role ? role : Role.fromDTO(role);
    } else {
      return null;
    }
  }

  /**
   * 保证返回 Role 实例，永不为 null
   */
  static ensureRoleNeverNull(role: RoleDTO | Role | null): Role {
    if (Role.isRole(role)) {
      return role instanceof Role ? role : Role.fromDTO(role);
    } else {
      return Role.forCreate();
    }
  }
}