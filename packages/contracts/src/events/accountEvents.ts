import { DomainEvent, AccountStatus } from './types';
import { EVENT_TYPES } from './constants';
import { IAccount } from '../core';

// =================== 账户状态验证事件 ===================
export interface AccountStatusVerificationResponse
  extends DomainEvent<{
    requestId: string;
    accountUuid: string;
    accountStatus: AccountStatus | null;
  }> {
  eventType: typeof EVENT_TYPES.ACCOUNT.STATUS_VERIFICATION_RESPONSE;
}

// =================== 账户信息响应事件 ===================
export interface AccountInfoGetterByUuidResponse
  extends DomainEvent<{
    requestId: string;
    account: IAccount | null;
  }> {
  eventType: typeof EVENT_TYPES.ACCOUNT.INFO_GETTER_BY_UUID_RESPONSE;
}

export interface AccountInfoGetterByUsernameResponse
  extends DomainEvent<{
    requestId: string;
    account: IAccount | null;
  }> {
  eventType: typeof EVENT_TYPES.ACCOUNT.INFO_GETTER_BY_USERNAME_RESPONSE;
}

export interface AccountUuidGetterResponse
  extends DomainEvent<{
    requestId: string;
    accountUuid: string | null;
  }> {
  eventType: typeof EVENT_TYPES.ACCOUNT.UUID_GETTER_RESPONSE;
}

// =================== 账户状态变更事件 ===================
export interface AccountStatusChangedEvent
  extends DomainEvent<{
    accountUuid: string;
    previousStatus: AccountStatus;
    currentStatus: AccountStatus;
    reason: string;
    changedBy: string | null; // 操作者UUID
  }> {
  eventType: typeof EVENT_TYPES.ACCOUNT.STATUS_CHANGED;
}

// =================== 账户创建和注册事件 ===================
export interface AccountRegisteredEvent
  extends DomainEvent<{
    account: IAccount;
  }> {
  eventType: typeof EVENT_TYPES.ACCOUNT.REGISTERED;
}

export interface AccountCreatedEvent
  extends DomainEvent<{
    account: IAccount;
  }> {
  eventType: typeof EVENT_TYPES.ACCOUNT.CREATED;
}

// =================== 账户信息更新事件 ===================
export interface AccountUpdatedEvent
  extends DomainEvent<{
    accountUuid: string;
    updatedFields: Partial<IAccount>;
    updatedBy: string | null; // 操作者UUID
  }> {
  eventType: typeof EVENT_TYPES.ACCOUNT.UPDATED;
}
