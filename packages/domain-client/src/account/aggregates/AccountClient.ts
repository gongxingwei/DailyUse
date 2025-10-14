/**
 * Account Aggregate Root - Client Implementation
 * 账户聚合根 - 客户端实现
 */

import { AggregateRoot } from '@dailyuse/utils';
import { AccountContracts as AC } from '@dailyuse/contracts';
import { SubscriptionClient } from '../entities/SubscriptionClient';
import { AccountHistoryClient } from '../entities/AccountHistoryClient';

type AccountStatus = AC.AccountStatus;
type Gender = AC.Gender;
type ThemeType = AC.ThemeType;
type ProfileVisibility = AC.ProfileVisibility;
type StorageQuotaType = AC.StorageQuotaType;

const AccountStatus = AC.AccountStatus;
const Gender = AC.Gender;
const ThemeType = AC.ThemeType;
const ProfileVisibility = AC.ProfileVisibility;
const StorageQuotaType = AC.StorageQuotaType;

/**
 * 账户聚合根客户端实现
 */
export class AccountClient extends AggregateRoot implements AC.AccountClient {
  constructor(
    uuid: string,
    public readonly username: string,
    public readonly email: string,
    public readonly emailVerified: boolean,
    public readonly phoneNumber: string | null | undefined,
    public readonly phoneVerified: boolean,
    public readonly status: AccountStatus,
    public readonly profile: {
      displayName: string;
      avatar?: string | null;
      bio?: string | null;
      location?: string | null;
      timezone: string;
      language: string;
      dateOfBirth?: number | null;
      gender?: Gender | null;
    },
    public readonly preferences: {
      theme: ThemeType;
      accentColor?: string | null;
      notifications: {
        email: boolean;
        push: boolean;
        sms: boolean;
        inApp: boolean;
      };
      privacy: {
        profileVisibility: ProfileVisibility;
        showOnlineStatus: boolean;
        allowSearchByEmail: boolean;
      };
    },
    public readonly subscription: SubscriptionClient | null | undefined,
    public readonly storage: {
      used: number;
      quota: number;
      quotaType: StorageQuotaType;
    },
    public readonly security: {
      twoFactorEnabled: boolean;
      lastPasswordChange?: number | null;
      loginAttempts: number;
      lockedUntil?: number | null;
    },
    public readonly history: AccountHistoryClient[],
    public readonly stats: {
      totalGoals: number;
      totalTasks: number;
      totalSchedules: number;
      totalReminders: number;
      lastLoginAt?: number | null;
      loginCount: number;
    },
    public readonly createdAt: number,
    public readonly updatedAt: number,
    public readonly lastActiveAt: number | null | undefined,
    public readonly deletedAt: number | null | undefined,
  ) {
    super(uuid);
  }

  // ========== UI 计算属性 ==========

  /**
   * 获取显示名称
   */
  get displayName(): string {
    return this.profile.displayName || this.username;
  }

  /**
   * 获取账户状态显示文本
   */
  get statusText(): string {
    const statusMap = {
      [AccountStatus.ACTIVE]: '活跃',
      [AccountStatus.INACTIVE]: '未激活',
      [AccountStatus.SUSPENDED]: '已暂停',
      [AccountStatus.DELETED]: '已删除',
    };
    return statusMap[this.status];
  }

  /**
   * 获取性别显示文本
   */
  get genderText(): string {
    if (!this.profile.gender) {
      return '未设置';
    }
    const genderMap = {
      [Gender.MALE]: '男',
      [Gender.FEMALE]: '女',
      [Gender.OTHER]: '其他',
      [Gender.PREFER_NOT_TO_SAY]: '不愿透露',
    };
    return genderMap[this.profile.gender];
  }

  /**
   * 获取主题显示文本
   */
  get themeText(): string {
    const themeMap = {
      [ThemeType.LIGHT]: '浅色',
      [ThemeType.DARK]: '深色',
      [ThemeType.AUTO]: '跟随系统',
    };
    return themeMap[this.preferences.theme];
  }

  /**
   * 获取隐私可见性显示文本
   */
  get privacyText(): string {
    const privacyMap = {
      [ProfileVisibility.PUBLIC]: '公开',
      [ProfileVisibility.PRIVATE]: '私密',
      [ProfileVisibility.FRIENDS_ONLY]: '仅好友',
    };
    return privacyMap[this.preferences.privacy.profileVisibility];
  }

  /**
   * 是否为活跃账户
   */
  get isActive(): boolean {
    return this.status === AccountStatus.ACTIVE;
  }

  /**
   * 是否已删除
   */
  get isDeleted(): boolean {
    return this.status === AccountStatus.DELETED;
  }

  /**
   * 是否已暂停
   */
  get isSuspended(): boolean {
    return this.status === AccountStatus.SUSPENDED;
  }

  /**
   * 是否已锁定
   */
  get isLocked(): boolean {
    if (!this.security.lockedUntil) {
      return false;
    }
    return Date.now() < this.security.lockedUntil;
  }

  /**
   * 邮箱是否已验证
   */
  get isEmailVerified(): boolean {
    return this.emailVerified;
  }

  /**
   * 手机是否已验证
   */
  get isPhoneVerified(): boolean {
    return this.phoneVerified;
  }

  /**
   * 是否启用两步验证
   */
  get isTwoFactorEnabled(): boolean {
    return this.security.twoFactorEnabled;
  }

  /**
   * 是否有有效订阅
   */
  get hasActiveSubscription(): boolean {
    return this.subscription?.isActive ?? false;
  }

  /**
   * 存储使用百分比
   */
  get storageUsagePercent(): number {
    if (this.storage.quota === 0) {
      return 0;
    }
    return (this.storage.used / this.storage.quota) * 100;
  }

  /**
   * 存储使用显示文本
   */
  get storageUsageText(): string {
    const used = this.formatBytes(this.storage.used);
    const quota = this.formatBytes(this.storage.quota);
    return `${used} / ${quota}`;
  }

  /**
   * 是否接近存储配额
   */
  get isStorageNearLimit(): boolean {
    return this.storageUsagePercent > 80;
  }

  /**
   * 是否超出存储配额
   */
  get isStorageOverLimit(): boolean {
    return this.storageUsagePercent >= 100;
  }

  /**
   * 最后登录时间显示文本
   */
  get lastLoginText(): string {
    if (!this.stats.lastLoginAt) {
      return '从未登录';
    }
    const date = new Date(this.stats.lastLoginAt);
    const now = Date.now();
    const diff = now - this.stats.lastLoginAt;

    if (diff < 60 * 1000) {
      return '刚刚';
    }
    if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))} 分钟前`;
    }
    if (diff < 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 60 * 1000))} 小时前`;
    }
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (24 * 60 * 60 * 1000))} 天前`;
    }
    return date.toLocaleDateString('zh-CN');
  }

  /**
   * 账户创建时间显示文本
   */
  get createdAtText(): string {
    const date = new Date(this.createdAt);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * 账户年龄（天数）
   */
  get accountAgeDays(): number {
    const now = Date.now();
    const diff = now - this.createdAt;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * 订阅计划显示文本
   */
  get subscriptionPlanText(): string {
    return this.subscription?.planText ?? '免费版';
  }

  // ========== UI 方法 ==========

  /**
   * 获取状态徽章配置
   */
  getStatusBadge(): { text: string; variant: string; icon: string } {
    if (this.isActive) {
      return { text: '活跃', variant: 'success', icon: 'check-circle' };
    }
    if (this.isSuspended) {
      return { text: '已暂停', variant: 'warning', icon: 'pause-circle' };
    }
    if (this.isDeleted) {
      return { text: '已删除', variant: 'danger', icon: 'trash-2' };
    }
    return { text: '未激活', variant: 'secondary', icon: 'x-circle' };
  }

  /**
   * 获取验证状态徽章
   */
  getVerificationBadge(): {
    email: { text: string; variant: string };
    phone: { text: string; variant: string };
  } {
    return {
      email: this.isEmailVerified
        ? { text: '已验证', variant: 'success' }
        : { text: '未验证', variant: 'warning' },
      phone: this.isPhoneVerified
        ? { text: '已验证', variant: 'success' }
        : { text: '未验证', variant: 'warning' },
    };
  }

  /**
   * 获取存储使用徽章
   */
  getStorageBadge(): { text: string; variant: string; icon: string } {
    if (this.isStorageOverLimit) {
      return { text: '已满', variant: 'danger', icon: 'alert-circle' };
    }
    if (this.isStorageNearLimit) {
      return { text: '接近上限', variant: 'warning', icon: 'alert-triangle' };
    }
    return { text: '正常', variant: 'success', icon: 'check-circle' };
  }

  /**
   * 获取头像URL（带默认值）
   */
  getAvatarUrl(): string {
    return (
      this.profile.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(this.displayName)}`
    );
  }

  /**
   * 格式化字节大小
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  // ========== 权限检查 ==========

  /**
   * 是否可以编辑个人资料
   */
  canEditProfile(): boolean {
    return this.isActive && !this.isLocked;
  }

  /**
   * 是否可以更改邮箱
   */
  canChangeEmail(): boolean {
    return this.isActive && !this.isLocked;
  }

  /**
   * 是否可以更改密码
   */
  canChangePassword(): boolean {
    return this.isActive && !this.isLocked;
  }

  /**
   * 是否可以删除账户
   */
  canDeleteAccount(): boolean {
    return this.isActive;
  }

  /**
   * 是否可以升级订阅
   */
  canUpgradeSubscription(): boolean {
    return this.isActive && this.subscription?.canUpgrade() !== false;
  }

  /**
   * 是否需要验证邮箱
   */
  needsEmailVerification(): boolean {
    return !this.isEmailVerified;
  }

  /**
   * 是否需要验证手机
   */
  needsPhoneVerification(): boolean {
    return !!this.phoneNumber && !this.isPhoneVerified;
  }

  // ========== DTO 转换 ==========

  toClientDTO(): AC.AccountClientDTO {
    return {
      uuid: this.uuid,
      username: this.username,
      email: this.email,
      emailVerified: this.emailVerified,
      phoneNumber: this.phoneNumber ?? null,
      phoneVerified: this.phoneVerified,
      status: this.status,
      profile: {
        displayName: this.profile.displayName,
        avatar: this.profile.avatar ?? null,
        bio: this.profile.bio ?? null,
        location: this.profile.location ?? null,
        timezone: this.profile.timezone,
        language: this.profile.language,
        dateOfBirth: this.profile.dateOfBirth ?? null,
        gender: this.profile.gender ?? null,
      },
      preferences: {
        theme: this.preferences.theme,
        accentColor: this.preferences.accentColor ?? null,
        notifications: {
          email: this.preferences.notifications.email,
          push: this.preferences.notifications.push,
          sms: this.preferences.notifications.sms,
          inApp: this.preferences.notifications.inApp,
        },
        privacy: {
          profileVisibility: this.preferences.privacy.profileVisibility,
          showOnlineStatus: this.preferences.privacy.showOnlineStatus,
          allowSearchByEmail: this.preferences.privacy.allowSearchByEmail,
        },
      },
      subscription: this.subscription ?? null,
      storage: {
        used: this.storage.used,
        quota: this.storage.quota,
        quotaType: this.storage.quotaType,
      },
      security: {
        twoFactorEnabled: this.security.twoFactorEnabled,
        lastPasswordChange: this.security.lastPasswordChange ?? null,
        loginAttempts: this.security.loginAttempts,
        lockedUntil: this.security.lockedUntil ?? null,
      },
      history: this.history,
      stats: {
        totalGoals: this.stats.totalGoals,
        totalTasks: this.stats.totalTasks,
        totalSchedules: this.stats.totalSchedules,
        totalReminders: this.stats.totalReminders,
        lastLoginAt: this.stats.lastLoginAt ?? null,
        loginCount: this.stats.loginCount,
      },
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastActiveAt: this.lastActiveAt ?? null,
      deletedAt: this.deletedAt ?? null,
    };
  }

  static fromClientDTO(dto: AC.AccountClientDTO): AccountClient {
    return new AccountClient(
      dto.uuid,
      dto.username,
      dto.email,
      dto.emailVerified,
      dto.phoneNumber,
      dto.phoneVerified,
      dto.status as AccountStatus,
      {
        displayName: dto.profile.displayName,
        avatar: dto.profile.avatar,
        bio: dto.profile.bio,
        location: dto.profile.location,
        timezone: dto.profile.timezone,
        language: dto.profile.language,
        dateOfBirth: dto.profile.dateOfBirth,
        gender: dto.profile.gender as Gender | null | undefined,
      },
      {
        theme: dto.preferences.theme as ThemeType,
        accentColor: dto.preferences.accentColor,
        notifications: dto.preferences.notifications,
        privacy: {
          profileVisibility: dto.preferences.privacy.profileVisibility as ProfileVisibility,
          showOnlineStatus: dto.preferences.privacy.showOnlineStatus,
          allowSearchByEmail: dto.preferences.privacy.allowSearchByEmail,
        },
      },
      dto.subscription ? SubscriptionClient.fromClientDTO(dto.subscription) : null,
      {
        used: dto.storage.used,
        quota: dto.storage.quota,
        quotaType: dto.storage.quotaType as StorageQuotaType,
      },
      dto.security,
      dto.history.map((h) => AccountHistoryClient.fromClientDTO(h)),
      dto.stats,
      dto.createdAt,
      dto.updatedAt,
      dto.lastActiveAt,
      dto.deletedAt,
    );
  }
}
