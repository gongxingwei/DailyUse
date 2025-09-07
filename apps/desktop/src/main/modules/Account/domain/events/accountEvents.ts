import { DomainEvent } from "@dailyuse/utils";
import { AccountDTO } from "@common/modules/account/types/account";
/**
 * 账号注册事件载荷
 */
export interface AccountRegisteredEventPayload {
  accountUuid: string;
  username: string;
  password?: string;
  email?: string;
  phone?: string;
  accountType: string;
  userUuid: string; // 关联的 User 实体 ID
  userProfile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    bio?: string;
  };
  status: string;
  createdAt: Date;
  requiresAuthentication: boolean; // 标识需要创建认证凭证
}

/**
 * 账号注册事件
 */
export interface AccountRegisteredEvent extends DomainEvent<AccountRegisteredEventPayload> {
  eventType: 'AccountRegistered';
  payload: AccountRegisteredEventPayload;
}

/**
 * 账号创建事件载荷（用于非注册场景，如系统创建）
 */
export interface AccountCreatedEventPayload {
  accountUuid: string;
  username: string;
  email?: string;
  phone?: string;
  accountType: string;
  userId: string; // 关联的 User 实体 ID
  createdAt: Date;
}

/**
 * 账号创建事件
 */
export interface AccountCreatedEvent extends DomainEvent<AccountCreatedEventPayload> {
  eventType: 'AccountCreated';
  payload: AccountCreatedEventPayload;
}

/**
 * 账号状态变更事件载荷
 */
export interface AccountStatusChangedEventPayload {
  accountUuid: string;
  username: string;
  oldStatus: string;
  newStatus: string;
  changedAt: Date;
}

/**
 * 账号状态变更事件
 */
export interface AccountStatusChangedEvent extends DomainEvent<AccountStatusChangedEventPayload> {
  eventType: 'AccountStatusChanged';
  payload: AccountStatusChangedEventPayload;
}

/**
 * 账号信息更新事件载荷
 */
export interface AccountUpdatedEventPayload {
  accountUuid: string;
  username: string;
  updatedFields: string[];
  updatedAt: Date;
}

/**
 * 账号信息更新事件
 */
export interface AccountUpdatedEvent extends DomainEvent<AccountUpdatedEventPayload> {
  eventType: 'AccountUpdated';
  payload: AccountUpdatedEventPayload;
}

/**
 * 账号状态验证响应事件载荷
 */
export interface AccountStatusVerificationResponseEventPayload {
  accountUuid: string;
  username: string;
  requestId: string; // 关联原始请求
  accountStatus: 'active' | 'inactive' | 'locked' | 'suspended' | 'not_found';
  isLoginAllowed: boolean;
  statusMessage?: string;
  verifiedAt: Date;
}

/**
 * 账号状态验证响应事件
 */
export interface AccountStatusVerificationResponseEvent extends DomainEvent<AccountStatusVerificationResponseEventPayload> {
  eventType: 'AccountStatusVerificationResponse';
  payload: AccountStatusVerificationResponseEventPayload;
}

/**
 * 
 */
export interface AccountUuidGetterResponseEventPayload {
  accountUuid: string | null;
  username: string;
  requestId: string; // 关联原始请求
}

export interface AccountUuidGetterResponseEvent extends DomainEvent<AccountUuidGetterResponseEventPayload> {
  eventType: 'AccountUuidGetterResponse';
  payload: AccountUuidGetterResponseEventPayload;
}

export interface AccountInfoGetterResponseEventPayload {
  accountDTO: AccountDTO;
  requestId: string;
}
export interface AccountInfoGetterResponseEvent extends DomainEvent<AccountInfoGetterResponseEventPayload> {
  eventType: 'AccountInfoGetterResponse';
  payload: AccountInfoGetterResponseEventPayload;
}
