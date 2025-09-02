import { Entity } from '@dailyuse/utils';
import { type IUserCore, type ISexCore, type UserDTO  } from '../types';
import { SexCore } from '../valueObjects/SexCore';
/**
 * 用户核心实体
 */
export class UserCore extends Entity implements IUserCore {
  protected _firstName?: string;
  protected _lastName?: string;
  protected _sex: ISexCore;
  protected _avatar?: string;
  protected _bio?: string;
  protected _socialAccounts: { [key: string]: string };
  protected _createdAt: Date;
  protected _updatedAt: Date;

  constructor(params: {
    uuid?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    sex?: number | ISexCore;
    socialAccounts?: { [key: string]: string };
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(params.uuid || Entity.generateUUID());
    this._firstName = params.firstName;
    this._lastName = params.lastName;
    this._avatar = params.avatar;
    this._bio = params.bio;
    this._sex = params.sex instanceof SexCore ? params.sex : new SexCore(params.sex as number | undefined);
    this._createdAt = params.createdAt || new Date();
    this._updatedAt = params.updatedAt || new Date();
    this._socialAccounts = params.socialAccounts || {};
  }

  // ===== 共享只读属性 =====
  get firstName(): string | undefined {
    return this._firstName;
  }
  get lastName(): string | undefined {
    return this._lastName;
  }
  get sex(): ISexCore {
    return this._sex;
  }
  get avatar(): string | undefined {
    return this._avatar;
  }
  get bio(): string | undefined {
    return this._bio;
  }
  get socialAccounts(): { [key: string]: string } {
    return this._socialAccounts;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ===== 共享计算属性 =====
  get fullName(): string {
    return `${this._firstName} ${this._lastName}`.trim();
  }

  get displayName(): string {
    return this.fullName || this._firstName || this._lastName || 'Unknown User';
  }

  get hasAvatar(): boolean {
    return Boolean(this._avatar);
  }

  // ===== 序列化方法 =====
  toDTO(): UserDTO {
    return {
      uuid: this._uuid,
      firstName: this._firstName,
      lastName: this._lastName,
      avatar: this._avatar,
      bio: this._bio,
      sex: this._sex.value,
      socialAccounts: this._socialAccounts,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  static fromDTO(dto: UserDTO): UserCore {
    return new UserCore({
      uuid: dto.uuid,
      firstName: dto.firstName,
      lastName: dto.lastName,
      avatar: dto.avatar,
      bio: dto.bio,
      sex: dto.sex,
      socialAccounts: dto.socialAccounts,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : new Date(),
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : new Date(),
    });
  }

  static forCreate(): UserCore {
    return new UserCore({
      firstName: '',
      lastName: '',
    });
  }
}
