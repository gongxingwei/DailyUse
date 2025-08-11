import { RoleCore } from '@dailyuse/domain-core';
import { type IRoleClient } from '../types';
import { Permission } from './Permission';

/**
 * 客户端角色实体 - 包含UI相关的角色操作
 */
export class Role extends RoleCore implements IRoleClient {
  // 在客户端缓存完整的 Permission 对象
  private _permissionObjects: Map<string, Permission> = new Map();

  constructor(params: {
    uuid?: string;
    name: string;
    description?: string;
    permissions?: string[];
    permissionObjects?: Permission[];
  }) {
    super({
      uuid: params.uuid,
      name: params.name,
      description: params.description,
      permissions: params.permissions,
    });

    // 缓存权限对象
    if (params.permissionObjects) {
      params.permissionObjects.forEach((perm) => {
        this._permissionObjects.set(perm.uuid, perm);
      });
    }
  }

  // ===== IRoleClient 方法 =====
  displayRoleBadge(): string {
    const roleIcons: { [key: string]: string } = {
      admin: '👨‍💼',
      administrator: '👨‍💼',
      user: '👤',
      guest: '👥',
      moderator: '🛡️',
      manager: '📊',
      viewer: '👁️',
      editor: '✏️',
    };

    const roleName = this.name.toLowerCase();
    const icon = roleIcons[roleName] || '🎭';

    return `${icon} ${this.name}`;
  }

  showRolePermissions(): void {
    console.log(`Showing permissions for role: ${this.name}`);

    const permissionList = Array.from(this._permissionObjects.values()).map((permission) => {
      return {
        code: permission.code,
        name: permission.name,
        module: permission.module,
        badge: permission.getPermissionBadge(),
      };
    });

    console.log('Role permissions:', permissionList);

    // 这里可以触发UI显示权限列表
    this.cacheRoleData();
  }

  getUIPermissions(): string[] {
    // 获取可以在UI中显示的权限列表
    return Array.from(this._permissionObjects.values())
      .filter((permission) => permission.checkUIVisibility())
      .map((permission) => permission.code);
  }

  isServer(): boolean {
    return false;
  }

  isClient(): boolean {
    return true;
  }

  // ===== 客户端特定的业务方法 =====
  cacheRoleData(): void {
    const roleData = {
      uuid: this.uuid,
      name: this.name,
      description: this.description,
      permissionCodes: Array.from(this.permissions),
      cachedAt: new Date().toISOString(),
    };

    localStorage.setItem(`role_${this.uuid}`, JSON.stringify(roleData));
    console.log('Role data cached:', this.name);
  }

  getDisplayName(): string {
    return this.description || this.name;
  }

  hasPermissionCode(permissionCode: string): boolean {
    return this.permissions.has(permissionCode);
  }

  hasAnyPermission(permissionCodes: string[]): boolean {
    return permissionCodes.some((code) => this.hasPermissionCode(code));
  }

  hasAllPermissions(permissionCodes: string[]): boolean {
    return permissionCodes.every((code) => this.hasPermissionCode(code));
  }

  getPermissionsByModule(module: string): Permission[] {
    return Array.from(this._permissionObjects.values()).filter(
      (permission) => permission.module === module,
    );
  }

  canAccessModule(module: string): boolean {
    return this.getPermissionsByModule(module).length > 0;
  }

  getAccessibleModules(): string[] {
    const modules = new Set<string>();
    Array.from(this._permissionObjects.values()).forEach((permission) => {
      modules.add(permission.module);
    });
    return Array.from(modules);
  }

  isHighPrivilege(): boolean {
    // 检查是否为高权限角色
    const highPrivilegePermissions = ['admin:manage', 'user:delete', 'settings:write'];
    return this.hasAnyPermission(highPrivilegePermissions);
  }

  // ===== 权限对象管理 =====
  addPermissionObject(permission: Permission): void {
    this._permissionObjects.set(permission.uuid, permission);
  }

  getPermissionObjects(): Permission[] {
    return Array.from(this._permissionObjects.values());
  }

  // ===== 静态工厂方法 =====
  static create(params: { name: string; description?: string; permissions?: Permission[] }): Role {
    // 将 Permission 对象转换为权限代码数组
    const permissionCodes: string[] = [];
    const permissionObjects: Permission[] = [];

    if (params.permissions) {
      params.permissions.forEach((permission) => {
        permissionCodes.push(permission.code);
        permissionObjects.push(permission);
      });
    }

    const role = new Role({
      name: params.name,
      description: params.description,
      permissions: permissionCodes,
      permissionObjects,
    });

    // 自动缓存新创建的角色
    role.cacheRoleData();

    return role;
  }

  static fromCache(uuid: string): Role | null {
    try {
      const cachedData = localStorage.getItem(`role_${uuid}`);
      if (!cachedData) return null;

      const data = JSON.parse(cachedData);

      return new Role({
        uuid: data.uuid,
        name: data.name,
        description: data.description,
        permissions: data.permissionCodes || [],
      });
    } catch (error) {
      console.error('Failed to load role from cache:', error);
      return null;
    }
  }

  static getPredefinedRoles(): Role[] {
    const adminPermissions = Permission.getCommonPermissions();

    const roles = [
      {
        name: '管理员',
        description: '系统管理员，拥有所有权限',
        permissions: adminPermissions,
      },
      {
        name: '用户',
        description: '普通用户，拥有基本权限',
        permissions: adminPermissions.filter((p) => p.getAction() === 'read'),
      },
      {
        name: '访客',
        description: '访客用户，只能查看基本信息',
        permissions: adminPermissions.filter(
          (p) => p.getAction() === 'read' && p.module !== 'admin',
        ),
      },
    ];

    return roles.map((roleData) => Role.create(roleData));
  }

  static createAdminRole(): Role {
    const adminPermissions = Permission.getCommonPermissions();

    return Role.create({
      name: '管理员',
      description: '系统管理员角色，拥有所有系统权限',
      permissions: adminPermissions,
    });
  }

  static createUserRole(): Role {
    const userPermissions = Permission.getCommonPermissions().filter(
      (p) => p.getAction() !== 'delete' && p.module !== 'admin',
    );

    return Role.create({
      name: '用户',
      description: '普通用户角色，拥有基本操作权限',
      permissions: userPermissions,
    });
  }

  static createGuestRole(): Role {
    const guestPermissions = Permission.getCommonPermissions().filter(
      (p) => p.getAction() === 'read' && p.module !== 'admin',
    );

    return Role.create({
      name: '访客',
      description: '访客角色，只能查看公开信息',
      permissions: guestPermissions,
    });
  }
}
