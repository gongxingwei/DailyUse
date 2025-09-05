import { UserCore } from '@dailyuse/domain-core';
import { type IUser } from '../types';
import { Sex } from '../valueObjects/Sex';
import type { UserProfilePersistenceDTO } from '@dailyuse/contracts';

export class User extends UserCore implements IUser {
  isClient(): boolean {
    return false;
  }

  isServer(): boolean {
    return true;
  }

  static create({
    firstName,
    lastName,
    avatar,
    bio,
    sex,
    socialAccounts = {},
  }: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    sex?: number;
    socialAccounts?: { [key: string]: string };
  }): User {
    return new User({
      firstName: firstName || '',
      lastName: lastName || '',
      avatar,
      bio,
      sex: new Sex(sex),
      socialAccounts,
    });
  }

  toPersistence(accountUuid: string): UserProfilePersistenceDTO {
    return {
      uuid: this.uuid,
      accountUuid,
      firstName: this.firstName || '',
      lastName: this.lastName || '',
      displayName: this.displayName || '',
      avatarUrl: this.avatar || '',
      bio: this.bio || '',
      sex: this.sex.value,
      socialAccounts: JSON.stringify(this.socialAccounts) || '{}',
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * 从持久化 DTO 创建用户领域对象
   * 仅处理数据转换逻辑，确保领域对象构造的完整性
   */
  static fromPersistenceDTO(dto: UserProfilePersistenceDTO): User {
    // Parse social accounts from JSON string
    let socialAccounts = {};
    if (dto.socialAccounts) {
      try {
        socialAccounts = JSON.parse(dto.socialAccounts);
      } catch (error) {
        console.warn('Failed to parse social accounts:', error);
        socialAccounts = {};
      }
    }

    return new User({
      uuid: dto.uuid,
      firstName: dto.firstName || '',
      lastName: dto.lastName || '',
      avatar: dto.avatarUrl || undefined,
      bio: dto.bio || undefined,
      sex: new Sex(dto.sex || 2), // 默认 'other'
      socialAccounts,
    });
  }

  /**
   * 更新用户资料信息
   */
  updateProfile(firstName?: string, lastName?: string, bio?: string): void {
    if (firstName !== undefined) {
      (this as any)._firstName = firstName;
    }
    if (lastName !== undefined) {
      (this as any)._lastName = lastName;
    }
    if (bio !== undefined) {
      (this as any)._bio = bio;
    }
    (this as any)._updatedAt = new Date();
  }

  /**
   * 更新用户头像
   */
  updateAvatar(avatar?: string): void {
    (this as any)._avatar = avatar;
    (this as any)._updatedAt = new Date();
  }

  /**
   * 从DTO数据创建实例
   */
  static fromDTO(data: any): User {
    return UserCore.fromDTO(data) as User;
  }
}
