import { UserCore } from '@dailyuse/domain-core';
import { type IUser } from '../types';
import { Sex } from '../valueObjects/Sex';

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
