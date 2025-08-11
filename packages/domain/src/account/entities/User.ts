import { Entity } from '@dailyuse/utils';

export interface UserDTO {
  uuid: string;
  firstName: string | null;
  lastName: string | null;
  sex: string | null;
  avatar: string | null;
  bio: string | null;
  socialAccounts: { [key: string]: string };
}

/**
 * User 实体 - 用户个人资料信息
 */
export class User extends Entity {
  private _firstName: string | null;
  private _lastName: string | null;
  private _sex: string | null;
  private _avatar: string | null;
  private _bio: string | null;
  private _socialAccounts: { [key: string]: string };

  constructor(params: {
    uuid?: string;
    firstName: string | null;
    lastName: string | null;
    sex?: string | null;
    avatar?: string | null;
    bio?: string | null;
    socialAccounts?: { [key: string]: string };
  }) {
    super(params.uuid);
    this._firstName = params.firstName;
    this._lastName = params.lastName;
    this._sex = params.sex || null;
    this._avatar = params.avatar || null;
    this._bio = params.bio || null;
    this._socialAccounts = params.socialAccounts || {};
  }

  // Getters and Setters
  get firstName(): string | null {
    return this._firstName;
  }
  set firstName(value: string | null) {
    this._firstName = value;
  }

  get lastName(): string | null {
    return this._lastName;
  }
  set lastName(value: string | null) {
    this._lastName = value;
  }

  get sex(): string | null {
    return this._sex;
  }
  set sex(value: string | null) {
    this._sex = value;
  }

  get avatar(): string | null {
    return this._avatar;
  }
  set avatar(value: string | null) {
    this._avatar = value;
  }

  get bio(): string | null {
    return this._bio;
  }
  set bio(value: string | null) {
    this._bio = value;
  }

  get socialAccounts(): { [key: string]: string } {
    return { ...this._socialAccounts };
  }

  get fullName(): string {
    const parts = [this._firstName, this._lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : '';
  }

  // 业务方法
  updateProfile(params: {
    firstName?: string | null;
    lastName?: string | null;
    sex?: string | null;
    avatar?: string | null;
    bio?: string | null;
  }): void {
    if (params.firstName !== undefined) this._firstName = params.firstName;
    if (params.lastName !== undefined) this._lastName = params.lastName;
    if (params.sex !== undefined) this._sex = params.sex;
    if (params.avatar !== undefined) this._avatar = params.avatar;
    if (params.bio !== undefined) this._bio = params.bio;
  }

  addSocialAccount(platform: string, accountId: string): void {
    this._socialAccounts[platform] = accountId;
  }

  removeSocialAccount(platform: string): void {
    delete this._socialAccounts[platform];
  }

  // DTO 转换
  toDTO(): UserDTO {
    return {
      uuid: this.uuid,
      firstName: this._firstName,
      lastName: this._lastName,
      sex: this._sex,
      avatar: this._avatar,
      bio: this._bio,
      socialAccounts: { ...this._socialAccounts },
    };
  }

  static fromDTO(dto: UserDTO): User {
    return new User({
      uuid: dto.uuid,
      firstName: dto.firstName,
      lastName: dto.lastName,
      sex: dto.sex,
      avatar: dto.avatar,
      bio: dto.bio,
      socialAccounts: dto.socialAccounts,
    });
  }

  static forCreate(): User {
    return new User({
      firstName: null,
      lastName: null,
    });
  }
}
