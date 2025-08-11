import { RoleCore } from '@dailyuse/domain-core';
import { type IRole } from '../types';
/**
 * 服务端角色实体
 * 继承核心角色实体，添加服务端特定的业务逻辑
 */
export class Role extends RoleCore implements IRole {
  isClient(): boolean {
    return false;
  }
  isServer(): boolean {
    return true;
  }

  /**
   * 检查角色是否为服务端特有的角色
   */
  isServerRole(): boolean {
    // 检查角色是否为服务端特有的角色
    const serverRoles = ['admin', 'moderator', 'system'];
    return serverRoles.includes(this.name.toLowerCase());
  }

  /**
   * 添加权限（服务端专用）
   */
  addPermission(permission: string): void {
    if (!permission || permission.trim() === '') {
      throw new Error('Permission cannot be empty');
    }

    const updatedPermissions = [...this.permissions, permission.trim()];
    // 由于权限集合是私有的，我们需要通过构造新实例来更新
    console.log(`Adding permission: ${permission} to role: ${this.name}`);
  }

  /**
   * 移除权限（服务端专用）
   */
  removePermission(permission: string): void {
    console.log(`Removing permission: ${permission} from role: ${this.name}`);
  }

  /**
   * 检查是否具有特定权限
   */
  hasPermission(permission: string): boolean {
    return this.permissions.has(permission);
  }

  /**
   * 检查是否具有管理员权限
   */
  isAdmin(): boolean {
    return this.hasPermission('admin') || this.name.toLowerCase() === 'admin';
  }

  /**
   * 保存到数据库（服务端专用）
   */
  async save(): Promise<void> {
    console.log(`Saving role: ${this.name} to database`);
    // 实现数据库保存逻辑
  }

  /**
   * 从数据库加载角色（服务端专用）
   */
  static async loadFromDatabase(uuid: string): Promise<Role | null> {
    console.log(`Loading role: ${uuid} from database`);
    // 实现数据库加载逻辑
    return null;
  }
}
