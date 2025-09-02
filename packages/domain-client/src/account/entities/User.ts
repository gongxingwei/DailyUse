import { UserCore } from '@dailyuse/domain-core';
import { type IUserClient } from '../types';
import { Sex } from '../valueObjects/Sex';

/**
 * 客户端用户实体 - 包含UI相关的用户操作
 */
export class User extends UserCore implements IUserClient {
  constructor(params: {
    uuid?: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    bio?: string;
    sex?: Sex;
    socialAccounts?: { [key: string]: string };
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super({
      ...params,
      sex: params.sex as any,
      socialAccounts: params.socialAccounts || {},
    });
  }

  // ===== IUserClient 方法 =====
  displayAvatar(): string {
    if (this.avatar) {
      return this.avatar;
    }

    // 生成默认头像URL或返回默认图片
    const firstLetter = this.displayName.charAt(0).toUpperCase();
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="20" fill="#007ACC"/>
        <text x="20" y="26" text-anchor="middle" fill="white" font-size="16" font-family="Arial">
          ${firstLetter}
        </text>
      </svg>
    `)}`;
  }

  showProfile(): void {
    console.log(`Showing profile for user: ${this.displayName}`);

    const profileInfo = {
      uuid: this.uuid,
      firstName: this.firstName,
      lastName: this.lastName,
      displayName: this.displayName,
      avatar: this.displayAvatar(),
      sex: this.sex ? (this.sex as Sex).formatForDisplay() : 'Not specified',
      bio: this.bio,
      socialAccounts: this.socialAccounts,
      createdAt: this.createdAt.toISOString(),
    };

    console.log('User profile:', profileInfo);
  }

  showUserSettings(): void {
    console.log(`Showing user settings for: ${this.displayName}`);
    // 这里可以显示用户设置界面
  }

  updateLastActivity(): void {
    console.log('Updating last activity timestamp');
    // 更新最后活动时间
    localStorage.setItem(`user_activity_${this.uuid}`, new Date().toISOString());
  }

  cacheUserSession(): void {
    this.cacheUserData();
  }

  updateProfileInUI(data: any): void {
    console.log('Updating user profile in UI:', data);

    if (data.firstName && data.firstName !== this.firstName) {
      console.log('First name updated in UI');
    }

    if (data.lastName && data.lastName !== this.lastName) {
      console.log('Last name updated in UI');
    }

    if (data.avatar && data.avatar !== this.avatar) {
      console.log('Avatar updated in UI');
    }

    // 缓存更新的用户数据
    this.cacheUserData();
  }

  cacheUserData(): void {
    const userData = {
      uuid: this.uuid,
      firstName: this.firstName,
      lastName: this.lastName,
      displayName: this.displayName,
      avatar: this.avatar,
      bio: this.bio,
      sex: this.sex ? (this.sex as Sex).value : null,
      socialAccounts: this.socialAccounts,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };

    localStorage.setItem(`user_${this.uuid}`, JSON.stringify(userData));
    console.log('User data cached');
  }

  formatForDisplay(): string {
    const socialCount = Object.keys(this.socialAccounts).length;
    return `${this.displayName} - 社交账户: ${socialCount}`;
  }

  isServer(): boolean {
    return false;
  }

  isClient(): boolean {
    return true;
  }

  // ===== 客户端特定的业务方法 =====
  hasPermission(permissionName: string): boolean {
    // UserCore 没有 permissions 属性，这里返回基本实现
    return false; // 实际实现中可能需要通过其他方式检查权限
  }

  hasRole(roleName: string): boolean {
    // UserCore 没有 roles 属性，这里返回基本实现
    return false; // 实际实现中可能需要通过其他方式检查角色
  }

  getUserDisplayName(): string {
    return this.displayName || 'Unknown User';
  }

  // ===== 静态工厂方法 =====
  static fromCache(uuid: string): User | null {
    try {
      const cachedData = localStorage.getItem(`user_${uuid}`);
      if (!cachedData) return null;

      const data = JSON.parse(cachedData);
      console.log('User data found in cache:', data);

      return new User({
        uuid: data.uuid,
        firstName: data.firstName || data.displayName || '',
        lastName: data.lastName || '',
        avatar: data.avatar,
        sex: data.sex ? new Sex(data.sex) : undefined,
        bio: data.bio,
        socialAccounts: data.socialAccounts || {},
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      });
    } catch (error) {
      console.error('Failed to load user from cache:', error);
      return null;
    }
  }

  static create(params: {
    firstName: string;
    lastName: string;
    avatar?: string;
    sex?: 'male' | 'female' | 'other';
    bio?: string;
  }): User {
    const sex = params.sex ? new Sex(params.sex) : undefined;

    const user = new User({
      firstName: params.firstName,
      lastName: params.lastName,
      avatar: params.avatar,
      bio: params.bio,
      sex,
      socialAccounts: {},
    });

    // 自动缓存新创建的用户
    user.cacheUserData();

    return user;
  }
}
