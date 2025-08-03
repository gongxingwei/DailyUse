import { Entity } from "@common/shared/domain/entity";
import type { UserDTO } from "@/modules/Account/domain/types/account";

/**
 * User 实体
 * 用户个人信息实体
 * 
 * 构造参数说明：
 * - uuid: 用户唯一标识
 * - firstName?: 名
 * - lastName?: 姓
 * - sex?: 性别
 * - avatar?: 头像
 * - bio?: 个人简介
 * - socialAccounts?: 社交账号映射
 */
export class User extends Entity {
  private _firstName: string | null;
  private _lastName: string | null;
  private _sex: string | null;
  private _avatar: string | null;
  private _bio: string | null;
  private _socialAccounts: Map<string, string>;

  constructor(params: {
    uuid: string;
    firstName?: string | null;
    lastName?: string | null;
    sex?: string | null;
    avatar?: string | null;
    bio?: string | null;
    socialAccounts?: Map<string, string>;
  }) {
    super(params.uuid);
    this._firstName = params.firstName ?? null;
    this._lastName = params.lastName ?? null;
    this._sex = params.sex ?? null;
    this._avatar = params.avatar ?? null;
    this._bio = params.bio ?? null;
    this._socialAccounts = params.socialAccounts ?? new Map();
  }

  // ======================== Getter/Setter ========================
  get uuid(): string { return this._uuid; }
  get firstName(): string | null { return this._firstName; }
  set firstName(value: string | null) { this._firstName = value; }

  get lastName(): string | null { return this._lastName; }
  set lastName(value: string | null) { this._lastName = value; }

  get fullName(): string | null {
    return `${this._firstName ?? ""} ${this._lastName ?? ""}`.trim();
  }

  get sex(): string | null | undefined { return this._sex; }
  set sex(value: string | null | undefined) { this._sex = value ?? null; }

  get avatar(): string | null | undefined { return this._avatar; }
  set avatar(value: string | null | undefined) { this._avatar = value ?? null; }

  get bio(): string | null | undefined { return this._bio; }
  set bio(value: string | null | undefined) { this._bio = value ?? null; }

  get socialAccounts(): Map<string, string> {
    return new Map(this._socialAccounts);
  }
  set socialAccounts(accounts: Map<string, string>) {
    this._socialAccounts = accounts;
  }

  // ======================== 业务方法 ========================

  /**
   * 更新个人信息
   */
  updateProfile(firstName?: string, lastName?: string, bio?: string): void {
    if (firstName !== undefined) this._firstName = firstName;
    if (lastName !== undefined) this._lastName = lastName;
    if (bio !== undefined) this._bio = bio;
  }

  /**
   * 更新头像
   */
  updateAvatar(avatar: string): void {
    this._avatar = avatar;
  }

  /**
   * 设置社交账号
   */
  setSocialAccounts(accounts: Map<string, string>): void {
    this._socialAccounts = accounts;
  }

  /**
   * 绑定社交账号
   */
  addSocialAccount(platform: string, accountUuid: string): void {
    this._socialAccounts.set(platform, accountUuid);
  }

  /**
   * 解绑社交账号
   */
  removeSocialAccount(platform: string): void {
    this._socialAccounts.delete(platform);
  }

  /**
   * 获取特定平台的社交账号
   */
  getSocialAccount(platform: string): string | undefined {
    return this._socialAccounts.get(platform);
  }

  // ======================== 辅助方法 ========================

  /**
   * 判断对象是否为 User 实例
   * @param obj - 任意对象
   * @returns 是否为 User
   */
  static isUser(obj: any): obj is User {
    return (
      obj instanceof User ||
      (obj &&
        typeof obj === "object" &&
        "uuid" in obj &&
        ("firstName" in obj || "lastName" in obj))
    );
  }

  /**
   * 保证返回 User 实例或 null
   * @param user - 可能为 DTO、实体或 null
   * @returns User 或 null
   */
  static ensureUser(user: UserDTO | User | null): User | null {
    if (User.isUser(user)) {
      return user instanceof User ? user : User.fromDTO(user);
    } else {
      return null;
    }
  }

  /**
   * 保证返回 User 实例，永不为 null
   * @param user - 可能为 DTO、实体或 null
   * @returns User
   */
  static ensureUserNeverNull(user: UserDTO | User | null): User {
    if (User.isUser(user)) {
      return user instanceof User ? user : User.fromDTO(user);
    } else {
      return User.forCreate();
    }
  }

  /**
   * 转为接口数据（DTO）
   * @returns UserDTO 对象
   */
  toDTO(): UserDTO {
  return {
    uuid: this.uuid,
    firstName: this.firstName ?? null,
    lastName: this.lastName ?? null,
    sex: this.sex ?? null,
    avatar: this.avatar ?? null,
    bio: this.bio ?? null,
    // Map 转为普通对象，便于序列化和跨进程传输
    socialAccounts: Object.fromEntries(this.socialAccounts),
  };
}

  /**
 * 从接口数据创建实例
 * @param dto - UserDTO 对象
 * @returns User 实体
 */
static fromDTO(dto: any): User {
  let socialAccounts: Map<string, string>;
  if (dto.socialAccounts instanceof Map) {
    socialAccounts = dto.socialAccounts;
  } else if (Array.isArray(dto.socialAccounts)) {
    socialAccounts = new Map(dto.socialAccounts);
  } else if (dto.socialAccounts && typeof dto.socialAccounts === 'object') {
    socialAccounts = new Map(Object.entries(dto.socialAccounts));
  } else {
    socialAccounts = new Map();
  }
  return new User({
    uuid: dto.uuid,
    firstName: dto.firstName ?? null,
    lastName: dto.lastName ?? null,
    sex: dto.sex ?? null,
    avatar: dto.avatar ?? null,
    bio: dto.bio ?? null,
    socialAccounts,
  });
}

  /**
   * 克隆当前对象（深拷贝）
   * @returns User 实体
   */
  clone(): User {
    return User.fromDTO(this.toDTO());
  }

  /**
   * 创建一个初始化对象（用于新建表单）
   * @returns User 实体
   */
  static forCreate(): User {
    return new User({
      uuid: Entity.generateId(),
      firstName: "",
      lastName: "",
      sex: "2",
      avatar: "",
      bio: "",
      socialAccounts: new Map(),
    });
  }
}