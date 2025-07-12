import { Entity } from "@/shared/domain/entity";
import type { UserDTO } from "@/modules/Account/domain/types/account";
/**
 * User 实体
 * 用户个人信息实体
 */
export class User extends Entity {
  private _firstName: string | null;
  private _lastName: string | null;
  private _sex: string | null;
  private _avatar: string | null;
  private _bio: string | null;
  private _socialAccounts: Map<string, string>; // 社交账号映射

  constructor(
    id: string,
    firstName: string | null,
    lastName: string | null,
    sex: string | null,
    avatar: string | null,
    bio: string | null
  ) {
    super(id);
    this._firstName = firstName;
    this._lastName = lastName;
    this._sex = sex;
    this._avatar = avatar;
    this._bio = bio;
    this._socialAccounts = new Map();
  }

  get id(): string {
    return this._id;
  }

  get firstName(): string | null {
    return this._firstName;
  }

  get lastName(): string | null {
    return this._lastName;
  }

  get fullName(): string | null {
    return `${this._firstName} ${this._lastName}`.trim();
  }

  get sex(): string | null | undefined {
    return this._sex;
  }

  get avatar(): string | null | undefined {
    return this._avatar;
  }

  get bio(): string | null | undefined {
    return this._bio;
  }

  get socialAccounts(): Map<string, string> {
    return new Map(this._socialAccounts);
  }

  /**
   * 更新个人信息
   */
  updateProfile(firstName?: string, lastName?: string, bio?: string): void {
    if (firstName) this._firstName = firstName;
    if (lastName) this._lastName = lastName;
    if (bio !== undefined) this._bio = bio;
  }

  /**
   * 更新头像
   */
  updateAvatar(avatar: string): void {
    this._avatar = avatar;
  }

  /**
   * 当从 DTO 数据恢复 User 对象时，设置社交账号
   */
  setSocialAccounts(accounts: Map<string, string>): void {
    this._socialAccounts = accounts;
  }

  /**
   * 绑定社交账号
   */
  addSocialAccount(platform: string, accountId: string): void {
    this._socialAccounts.set(platform, accountId);
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

  toDTO(): UserDTO {
    return {
      id: this.id,
      firstName: this.firstName || null,
      lastName: this.lastName || null,
      sex: this.sex ||  null,
      avatar: this.avatar || null,
      bio: this.bio || null,
      socialAccounts: this.socialAccounts,
    };
  } 

  static fromDTO(dto: UserDTO): User { 
    const user = new User(
      dto.id,
      dto.firstName || null,
      dto.lastName || null,
      dto.sex || null,
      dto.avatar || null,
      dto.bio || null
    );
    user.setSocialAccounts(dto.socialAccounts);
    return user;
  }
  
}
