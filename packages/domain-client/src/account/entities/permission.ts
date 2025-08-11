import { PermissionCore } from '@dailyuse/domain-core';
import { type IPermissionClient } from '../types';

/**
 * 客户端权限实体 - 包含UI相关的权限操作
 */
export class Permission extends PermissionCore implements IPermissionClient {
  constructor(params: {
    uuid?: string;
    code: string;
    name: string;
    description?: string;
    module: string;
  }) {
    super(params);
  }

  // ===== IPermissionClient 方法 =====
  checkUIVisibility(): boolean {
    // 检查权限是否允许UI元素显示
    // 根据权限代码判断UI可见性
    const uiVisibilityMap: { [key: string]: boolean } = {
      'user:read': true,
      'user:write': true,
      'admin:read': true,
      'admin:write': false, // 需要特殊条件
      'settings:read': true,
      'settings:write': false,
    };

    return uiVisibilityMap[this.code] ?? false;
  }

  async showPermissionDialog(): Promise<boolean> {
    // 显示权限确认对话框
    return new Promise((resolve) => {
      console.log(`Showing permission dialog for: ${this.name}`);
      console.log(`Code: ${this.code}, Module: ${this.module}`);

      // 模拟用户确认权限
      setTimeout(() => {
        const userConfirmed = Math.random() > 0.2; // 80% 确认率

        if (userConfirmed) {
          console.log('Permission granted by user');
          this.cachePermissions();
          resolve(true);
        } else {
          console.log('Permission denied by user');
          resolve(false);
        }
      }, 1000);
    });
  }

  cachePermissions(): void {
    // 缓存权限信息到本地存储
    const permissionData = {
      uuid: this.uuid,
      code: this.code,
      name: this.name,
      description: this.description,
      module: this.module,
      grantedAt: new Date().toISOString(),
    };

    localStorage.setItem(`permission_${this.uuid}`, JSON.stringify(permissionData));
    console.log('Permission cached:', this.name);
  }

  isServer(): boolean {
    return false;
  }

  isClient(): boolean {
    return true;
  }

  // ===== 客户端特定的业务方法 =====
  getDisplayName(): string {
    return this.description || this.name;
  }

  getPermissionBadge(): string {
    const [, action] = this.code.split(':');
    const actionIcons: { [key: string]: string } = {
      read: '👁️',
      write: '✏️',
      delete: '🗑️',
      create: '➕',
      admin: '👨‍💼',
      manage: '⚙️',
    };

    const icon = actionIcons[action?.toLowerCase()] || '🔐';
    return `${icon} ${this.getDisplayName()}`;
  }

  getResourceType(): string {
    const [resource] = this.code.split(':');
    return resource || this.module;
  }

  getAction(): string {
    const [, action] = this.code.split(':');
    return action || '';
  }

  getAllowedActions(): string[] {
    // 根据当前权限推断允许的其他动作
    const resourceActions: { [key: string]: string[] } = {
      user: ['read', 'write', 'delete'],
      admin: ['read', 'write', 'manage'],
      settings: ['read', 'write'],
      data: ['read', 'write', 'export'],
    };

    const resourceType = this.getResourceType();
    return resourceActions[resourceType] || [];
  }

  canPerform(action: string): boolean {
    return this.getAllowedActions().includes(action);
  }

  // ===== 静态工厂方法 =====
  static create(params: {
    code: string;
    name: string;
    description?: string;
    module: string;
  }): Permission {
    const permission = new Permission(params);

    // 自动缓存新创建的权限
    permission.cachePermissions();

    return permission;
  }

  static fromCache(uuid: string): Permission | null {
    try {
      const cachedData = localStorage.getItem(`permission_${uuid}`);
      if (!cachedData) return null;

      const data = JSON.parse(cachedData);

      return new Permission({
        uuid: data.uuid,
        code: data.code,
        name: data.name,
        description: data.description,
        module: data.module,
      });
    } catch (error) {
      console.error('Failed to load permission from cache:', error);
      return null;
    }
  }

  static getCommonPermissions(): Permission[] {
    const commonPermissions = [
      { code: 'user:read', name: '查看用户', module: 'user' },
      { code: 'user:write', name: '编辑用户', module: 'user' },
      { code: 'settings:read', name: '查看设置', module: 'settings' },
      { code: 'settings:write', name: '修改设置', module: 'settings' },
      { code: 'admin:manage', name: '管理员权限', module: 'admin' },
    ];

    return commonPermissions.map((perm) => Permission.create(perm));
  }
}
