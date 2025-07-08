/**
 * User 实体
 * 用户个人信息实体
 */
export class User {
  private _id: string;
  private _firstName: string;
  private _lastName: string;
  private _avatar?: string;
  private _bio?: string;
  private _socialAccounts: Map<string, string>; // 社交账号映射

  constructor(
    id: string,
    firstName: string,
    lastName: string,
    avatar?: string,
    bio?: string
  ) {
    this._id = id;
    this._firstName = firstName;
    this._lastName = lastName;
    this._avatar = avatar;
    this._bio = bio;
    this._socialAccounts = new Map();
  }

  get id(): string {
    return this._id;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get fullName(): string {
    return `${this._firstName} ${this._lastName}`.trim();
  }

  get avatar(): string | undefined {
    return this._avatar;
  }

  get bio(): string | undefined {
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
}
