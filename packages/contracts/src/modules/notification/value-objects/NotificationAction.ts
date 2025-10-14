/**
 * NotificationAction Value Object
 * 通知操作值对象
 */

import type { NotificationActionType } from '../enums';

// ============ 接口定义 ============

/**
 * 通知操作 - Server 接口
 */
export interface INotificationActionServer {
  id: string;
  label: string;
  type: NotificationActionType;
  payload?: any;

  // 值对象方法
  equals(other: INotificationActionServer): boolean;
  with(
    updates: Partial<
      Omit<
        INotificationActionServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): INotificationActionServer;

  // DTO 转换方法
  toServerDTO(): NotificationActionServerDTO;
  toClientDTO(): NotificationActionClientDTO;
  toPersistenceDTO(): NotificationActionPersistenceDTO;
}

/**
 * 通知操作 - Client 接口
 */
export interface INotificationActionClient {
  id: string;
  label: string;
  type: NotificationActionType;
  payload?: any;

  // UI 辅助属性
  typeText: string; // "导航", "API调用", "关闭", "自定义"
  icon: string;

  // 值对象方法
  equals(other: INotificationActionClient): boolean;

  // DTO 转换方法
  toServerDTO(): NotificationActionServerDTO;
}

// ============ DTO 定义 ============

/**
 * NotificationAction Server DTO
 */
export interface NotificationActionServerDTO {
  id: string;
  label: string;
  type: NotificationActionType;
  payload?: any;
}

/**
 * NotificationAction Client DTO
 */
export interface NotificationActionClientDTO {
  id: string;
  label: string;
  type: NotificationActionType;
  payload?: any;
  typeText: string;
  icon: string;
}

/**
 * NotificationAction Persistence DTO
 */
export interface NotificationActionPersistenceDTO {
  id: string;
  label: string;
  type: NotificationActionType;
  payload?: string | null; // JSON string
}

// ============ 类型导出 ============

export type NotificationActionServer = INotificationActionServer;
export type NotificationActionClient = INotificationActionClient;
