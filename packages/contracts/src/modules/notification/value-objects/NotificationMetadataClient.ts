/**
 * NotificationMetadata Value Object (Client)
 * ÂCpn<˘a - ¢7Ô
 */

import type { NotificationMetadataServerDTO } from './NotificationMetadataServer';

// ============ •„öI ============

/**
 * ÂCpn - Client •„
 */
export interface INotificationMetadataClient {
  icon?: string | null;
  image?: string | null;
  color?: string | null;
  sound?: string | null;
  badge?: number | null;
  data?: any;

  // UI Ö©^'
  hasIcon: boolean;
  hasImage: boolean;
  hasBadge: boolean;

  // <˘aπ’
  equals(other: INotificationMetadataClient): boolean;

  // DTO lbπ’
  toServerDTO(): NotificationMetadataServerDTO;
}

// ============ DTO öI ============

/**
 * NotificationMetadata Client DTO
 */
export interface NotificationMetadataClientDTO {
  icon?: string | null;
  image?: string | null;
  color?: string | null;
  sound?: string | null;
  badge?: number | null;
  data?: any;
  hasIcon: boolean;
  hasImage: boolean;
  hasBadge: boolean;
}

// ============ {ã¸˙ ============

export type NotificationMetadataClient = INotificationMetadataClient;
