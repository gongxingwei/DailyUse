import { Entity } from "@/shared/domain/entity";

/**
 * Role 实体
 * 角色实体
 */
export class Role extends Entity{

  private _name: string;
  private _description: string;
  private _permissions: Set<string>; // 权限ID集合

  constructor(
      
    name: string,
    description: string,
    permissions: string[] = [],
    uuid?: string
  ) {
    super(uuid || Role.generateId());
    this._name = name;
    this._description = description;
    this._permissions = new Set(permissions);
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

  /**
   * 添加权限
   */
  addPermission(permissionId: string): void {
    this._permissions.add(permissionId);
  }

  /**
   * 移除权限
   */
  removePermission(permissionId: string): void {
    this._permissions.delete(permissionId);
  }

  /**
   * 检查是否拥有某个权限
   */
  hasPermission(permissionId: string): boolean {
    return this._permissions.has(permissionId);
  }

  /**
   * 更新角色信息
   */
  updateInfo(name?: string, description?: string): void {
    if (name) this._name = name;
    if (description) this._description = description;
  }
}
