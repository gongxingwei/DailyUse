/**
 * Account 聚合根实现 (Client)
 * 兼容 AccountClient 接口
 */

import { AccountContracts, AccountStatus, ThemeType, ProfileVisibility, StorageQuotaType } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import { Subscription } from '../entities/Subscription';
import { AccountHistory } from '../entities/AccountHistory';

type IAccountClient = AccountContracts.AccountClient;
type AccountClientDTO = AccountContracts.AccountClientDTO;
type AccountServerDTO = AccountContracts.AccountServerDTO;
type Gender = AccountContracts.Gender;

/**
 * Account 聚合根 (Client)
 *
 * DDD 聚合根职责：
 * - 管理账户信息和状态
 * - 管理子实体（订阅、历史记录）
 * - 提供账户相关的业务逻辑
 */
export class Account extends AggregateRoot implements IAccountClient {
  // ===== 私有字段 =====
  private _username: string;
  private _email: string;
  private _emailVerified: boolean;
  private _phoneNumber: string | null;
  private _phoneVerified: boolean;
  private _status: AccountStatus;
  private _profile: {
    displayName: string;
    avatar?: string | null;
    bio?: string | null;
    location?: string | null;
    timezone: string;
    language: string;
    dateOfBirth?: number | null;
    gender?: Gender | null;
  };
  private _preferences: {
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
  };
  private _subscription: Subscription | null;
  private _storage: {
    used: number;
    quota: number;
    quotaType: StorageQuotaType;
  };
  private _security: {
    twoFactorEnabled: boolean;
    lastPasswordChange?: number | null;
    loginAttempts: number;
    lockedUntil?: number | null;
  };
  private _history: AccountHistory[];
  private _stats: {
    totalGoals: number;
    totalTasks: number;
    totalSchedules: number;
    totalReminders: number;
    lastLoginAt?: number | null;
    loginCount: number;
  };
  private _createdAt: number;
  private _updatedAt: number;
  private _lastActiveAt: number | null;
  private _deletedAt: number | null;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    username: string;
    email: string;
    emailVerified: boolean;
    phoneNumber?: string | null;
    phoneVerified: boolean;
    status: AccountStatus;
    profile: {
      displayName: string;
      avatar?: string | null;
      bio?: string | null;
      location?: string | null;
      timezone: string;
      language: string;
      dateOfBirth?: number | null;
      gender?: Gender | null;
    };
    preferences: {
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
    };
    subscription?: Subscription | null;
    storage: {
      used: number;
      quota: number;
      quotaType: StorageQuotaType;
    };
    security: {
      twoFactorEnabled: boolean;
      lastPasswordChange?: number | null;
      loginAttempts: number;
      lockedUntil?: number | null;
    };
    history: AccountHistory[];
    stats: {
      totalGoals: number;
      totalTasks: number;
      totalSchedules: number;
      totalReminders: number;
      lastLoginAt?: number | null;
      loginCount: number;
    };
    createdAt: number;
    updatedAt: number;
    lastActiveAt?: number | null;
    deletedAt?: number | null;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._username = params.username;
    this._email = params.email;
    this._emailVerified = params.emailVerified;
    this._phoneNumber = params.phoneNumber ?? null;
    this._phoneVerified = params.phoneVerified;
    this._status = params.status;
    this._profile = params.profile;
    this._preferences = params.preferences;
    this._subscription = params.subscription ?? null;
    this._storage = params.storage;
    this._security = params.security;
    this._history = params.history;
    this._stats = params.stats;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._lastActiveAt = params.lastActiveAt ?? null;
    this._deletedAt = params.deletedAt ?? null;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get username(): string {
    return this._username;
  }
  public get email(): string {
    return this._email;
  }
  public get emailVerified(): boolean {
    return this._emailVerified;
  }
  public get phoneNumber(): string | null {
    return this._phoneNumber;
  }
  public get phoneVerified(): boolean {
    return this._phoneVerified;
  }
  public get status(): AccountStatus {
    return this._status;
  }
  public get profile(): Account['_profile'] {
    return { ...this._profile };
  }
  public get preferences(): Account['_preferences'] {
    return JSON.parse(JSON.stringify(this._preferences));
  }
  public get subscription(): Subscription | null {
    return this._subscription;
  }
  public get storage(): Account['_storage'] {
    return { ...this._storage };
  }
  public get security(): Account['_security'] {
    return { ...this._security };
  }
  public get history(): AccountHistory[] {
    return [...this._history];
  }
  public get stats(): Account['_stats'] {
    return { ...this._stats };
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }
  public get lastActiveAt(): number | null {
    return this._lastActiveAt;
  }
  public get deletedAt(): number | null {
    return this._deletedAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新账户
   */
  public static create(params: {
    username: string;
    email: string;
    displayName: string;
    timezone?: string;
    language?: string;
  }): Account {
    const uuid = AggregateRoot.generateUUID();
    const now = Date.now();

    return new Account({
      uuid,
      username: params.username,
      email: params.email,
      emailVerified: false,
      phoneVerified: false,
      status: AccountStatus.ACTIVE,
      profile: {
        displayName: params.displayName,
        timezone: params.timezone || 'Asia/Shanghai',
        language: params.language || 'zh-CN',
      },
      preferences: {
        theme: ThemeType.AUTO,
        notifications: {
          email: true,
          push: true,
          sms: false,
          inApp: true,
        },
        privacy: {
          profileVisibility: ProfileVisibility.PUBLIC,
          showOnlineStatus: true,
          allowSearchByEmail: true,
        },
      },
      storage: {
        used: 0,
        quota: 1024 * 1024 * 1024, // 1GB for free tier
        quotaType: StorageQuotaType.FREE,
      },
      security: {
        twoFactorEnabled: false,
        loginAttempts: 0,
      },
      history: [],
      stats: {
        totalGoals: 0,
        totalTasks: 0,
        totalSchedules: 0,
        totalReminders: 0,
        loginCount: 0,
      },
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 克隆当前对象（深拷贝）
   */
  public clone(): Account {
    return Account.fromClientDTO(this.toClientDTO());
  }

  // ===== DTO 转换方法 =====

  public toClientDTO(): AccountClientDTO {
    return {
      uuid: this._uuid,
      username: this._username,
      email: this._email,
      emailVerified: this._emailVerified,
      phoneNumber: this._phoneNumber,
      phoneVerified: this._phoneVerified,
      status: this._status,
      profile: { ...this._profile },
      preferences: JSON.parse(JSON.stringify(this._preferences)),
      subscription: this._subscription?.toClientDTO() || null,
      storage: { ...this._storage },
      security: { ...this._security },
      history: this._history.map((h) => h.toClientDTO()),
      stats: { ...this._stats },
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      lastActiveAt: this._lastActiveAt,
      deletedAt: this._deletedAt,
    };
  }

  public static fromClientDTO(dto: AccountClientDTO): Account {
    return new Account({
      uuid: dto.uuid,
      username: dto.username,
      email: dto.email,
      emailVerified: dto.emailVerified,
      phoneNumber: dto.phoneNumber,
      phoneVerified: dto.phoneVerified,
      status: dto.status as AccountStatus,
      profile: {
        ...dto.profile,
        gender: dto.profile.gender as Gender | undefined,
      },
      preferences: {
        ...dto.preferences,
        theme: dto.preferences.theme as ThemeType,
        privacy: {
          ...dto.preferences.privacy,
          profileVisibility: dto.preferences.privacy.profileVisibility as ProfileVisibility,
        },
      },
      subscription: dto.subscription ? Subscription.fromClientDTO(dto.subscription) : null,
      storage: {
        ...dto.storage,
        quotaType: dto.storage.quotaType as StorageQuotaType,
      },
      security: { ...dto.security },
      history: dto.history.map((h) => AccountHistory.fromClientDTO(h)),
      stats: { ...dto.stats },
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      lastActiveAt: dto.lastActiveAt,
      deletedAt: dto.deletedAt,
    });
  }

  public static fromServerDTO(dto: AccountServerDTO): Account {
    return new Account({
      uuid: dto.uuid,
      username: dto.username,
      email: dto.email,
      emailVerified: dto.emailVerified,
      phoneNumber: dto.phoneNumber,
      phoneVerified: dto.phoneVerified,
      status: dto.status as AccountStatus,
      profile: {
        ...dto.profile,
        gender: dto.profile.gender as Gender | undefined,
      },
      preferences: {
        ...dto.preferences,
        theme: dto.preferences.theme as ThemeType,
        privacy: {
          ...dto.preferences.privacy,
          profileVisibility: dto.preferences.privacy.profileVisibility as ProfileVisibility,
        },
      },
      subscription: dto.subscription ? Subscription.fromClientDTO(dto.subscription) : null,
      storage: {
        ...dto.storage,
        quotaType: dto.storage.quotaType as StorageQuotaType,
      },
      security: { ...dto.security },
      history: dto.history.map((h) => AccountHistory.fromClientDTO(h)),
      stats: { ...dto.stats },
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      lastActiveAt: dto.lastActiveAt,
      deletedAt: dto.deletedAt,
    });
  }
}
