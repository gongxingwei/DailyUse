/**
 * 认证模块事件定义
 * Authentication Module Events
 */

import { eventBus, createEvent } from '@dailyuse/utils';

// ===== 事件类型常量 =====
export const AUTH_EVENTS = {
  USER_LOGGED_IN: 'auth:user-logged-in',
  USER_LOGGED_OUT: 'auth:user-logged-out',
  AUTH_STATE_CHANGED: 'auth:state-changed',
  TOKEN_REFRESHED: 'auth:token-refreshed',
} as const;

// ===== 事件负载类型定义 =====

/**
 * 用户登录成功事件负载
 */
export interface UserLoggedInEventPayload {
  accountUuid: string;
  username: string;
  sessionUuid: string;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  loginTime: Date;
}

/**
 * 用户登出事件负载
 */
export interface UserLoggedOutEventPayload {
  accountUuid?: string;
  username?: string;
  reason: 'manual' | 'token-expired' | 'force-logout';
  logoutTime: Date;
}

/**
 * 认证状态变更事件负载
 */
export interface AuthStateChangedEventPayload {
  isAuthenticated: boolean;
  accountUuid?: string;
  username?: string;
  timestamp: Date;
}

/**
 * Token刷新事件负载
 */
export interface TokenRefreshedEventPayload {
  accountUuid: string;
  newAccessToken: string;
  newRefreshToken?: string;
  expiresIn: number;
  refreshTime: Date;
}

// ===== 事件发布函数 =====

/**
 * 发布用户登录成功事件
 */
export function publishUserLoggedInEvent(payload: UserLoggedInEventPayload): void {
  console.log('🎉 [AuthEvents] 发布用户登录成功事件', {
    accountUuid: payload.accountUuid,
    username: payload.username,
  });

  // 直接发送 payload，而不是包装成事件对象
  eventBus.send(AUTH_EVENTS.USER_LOGGED_IN, payload);
}

/**
 * 发布用户登出事件
 */
export function publishUserLoggedOutEvent(payload: UserLoggedOutEventPayload): void {
  console.log('👋 [AuthEvents] 发布用户登出事件', { reason: payload.reason });

  // 直接发送 payload，而不是包装成事件对象
  eventBus.send(AUTH_EVENTS.USER_LOGGED_OUT, payload);
}

/**
 * 发布认证状态变更事件
 */
export function publishAuthStateChangedEvent(payload: AuthStateChangedEventPayload): void {
  console.log('🔄 [AuthEvents] 发布认证状态变更事件', { isAuthenticated: payload.isAuthenticated });

  // 直接发送 payload，而不是包装成事件对象
  eventBus.send(AUTH_EVENTS.AUTH_STATE_CHANGED, payload);
}

/**
 * 发布Token刷新事件
 */
export function publishTokenRefreshedEvent(payload: TokenRefreshedEventPayload): void {
  console.log('🔄 [AuthEvents] 发布Token刷新事件', { accountUuid: payload.accountUuid });

  // 直接发送 payload，而不是包装成事件对象
  eventBus.send(AUTH_EVENTS.TOKEN_REFRESHED, payload);
}
