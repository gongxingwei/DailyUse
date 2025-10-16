/**
 * NotificationAction Value Object (Client)
 * åÍ\<ùa - ¢7ï
 */

import type { NotificationActionType } from '../enums';
import type { NotificationActionServerDTO } from './NotificationActionServer';

// ============ ¥ãšI ============

/**
 * åÍ\ - Client ¥ã
 */
export interface INotificationActionClient {
  id: string;
  label: string;
  type: NotificationActionType;
  payload?: any;

  // UI …©^'
  typeText: string; // "ü*", "API(", "sí", "êšI"
  icon: string;

  // <ùa¹Õ
  equals(other: INotificationActionClient): boolean;

  // DTO lb¹Õ
  toServerDTO(): NotificationActionServerDTO;
}

// ============ DTO šI ============

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

// ============ {‹üú ============

export type NotificationActionClient = INotificationActionClient;
