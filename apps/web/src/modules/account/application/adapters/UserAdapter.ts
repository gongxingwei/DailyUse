// 使用@dailyuse/domain-client包导入
import { User as DomainUser } from '@dailyuse/domain-client';

/**
 * 用户适配器 - 将domain-client的User转换为应用层期望的格式
 * 解决DDD重构后的类型不匹配问题
 */

// 应用层期望的User接口
export interface ApplicationUser {
  id: string;
  username: string;
  email?: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  bio?: string;
  avatar?: string;
  sex?: string;
  birthday?: string;
  status: string;
  isProfileComplete: boolean;
  avatarInitials: string;
  fullName: string;
  createdAt: Date;
  updatedAt: Date;

  // 业务方法
  canEditProfile(): boolean;
  canDeactivate(): boolean;
  canChangePassword(): boolean;
}

export class UserAdapter {
  /**
   * 将domain-client的User转换为应用层的ApplicationUser
   */
  static toApplicationModel(domainUser: DomainUser): ApplicationUser {
    return {
      id: domainUser.uuid,
      username: domainUser.displayName,
      email: '', // 需要从Account聚合中获取
      displayName: domainUser.displayName,
      firstName: domainUser.firstName,
      lastName: domainUser.lastName,
      phoneNumber: '', // 需要从Account聚合中获取
      bio: domainUser.bio,
      avatar: domainUser.avatar,
      sex: domainUser.sex ? (domainUser.sex as any).value : undefined,
      birthday: undefined, // UserCore中没有此字段，需要扩展
      status: 'active', // 默认状态，需要从Account聚合中获取
      isProfileComplete: !!(domainUser.firstName && domainUser.lastName),
      avatarInitials:
        `${domainUser.firstName.charAt(0)}${domainUser.lastName.charAt(0)}`.toUpperCase(),
      fullName: `${domainUser.firstName} ${domainUser.lastName}`,
      createdAt: domainUser.createdAt,
      updatedAt: domainUser.updatedAt,

      // 业务方法
      canEditProfile: () => true, // 简化实现，实际应检查状态
      canDeactivate: () => true,
      canChangePassword: () => true,
    };
  }

  /**
   * 将domain-client的User转换为应用层的ApplicationUser（保持向后兼容）
   * @deprecated 使用 toApplicationModel 替代
   */
  static toDomainModel(domainUser: DomainUser): ApplicationUser {
    return this.toApplicationModel(domainUser);
  }

  /**
   * 批量转换用户列表
   */
  static toApplicationModelList(domainUsers: DomainUser[]): ApplicationUser[] {
    return domainUsers.map((user) => this.toApplicationModel(user));
  }

  /**
   * 批量转换用户列表（保持向后兼容）
   * @deprecated 使用 toApplicationModelList 替代
   */
  static toDomainModelList(domainUsers: DomainUser[]): ApplicationUser[] {
    return this.toApplicationModelList(domainUsers);
  }
}

// 重新导出适配后的User类型
export type { ApplicationUser as User };
