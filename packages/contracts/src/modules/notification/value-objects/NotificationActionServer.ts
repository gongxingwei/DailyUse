/**
 * NotificationAction Value Object (Server)
 * åÍ\<ùa - ¡ï
 */

import type { NotificationActionType } from '../enums';

// ============ ¥ãšI ============

/**
 * åÍ\ - Server ¥ã
 */
export interface INotificationActionServer {
  id: string;
  label: string;
  type: NotificationActionType;
  payload?: any;

  // <ùa¹Õ
  equals(other: INotificationActionServer): boolean;
  with(
    updates: Partial<
      Omit<
        INotificationActionServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): INotificationActionServer;

  // DTO lb¹Õ
  toServerDTO(): NotificationActionServerDTO;
  toClientDTO(): NotificationActionClientDTO;
  toPersistenceDTO(): NotificationActionPersistenceDTO;
}

// ============ DTO šI ============

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
 * NotificationAction Client DTO ((Ž Server -> Client lb)
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

// ============ {‹üú ============

export type NotificationActionServer = INotificationActionServer;
