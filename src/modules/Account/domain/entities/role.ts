/**
 * Role 实体
 * 角色实体
 */
export class Role {
  private _id: string;
  private _name: string;
  private _description: string;
  private _permissions: Set<string>; // 权限ID集合

  constructor(
    id: string,
    name: string,
    description: string,
    permissions: string[] = []
  ) {
    this._id = id;
    this._name = name;
    this._description = description;
    this._permissions = new Set(permissions);
  }

  get id(): string {
    return this._id;
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
}
