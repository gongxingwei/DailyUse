/**
 * NotificationMetadata Value Object (Server)
 * åCpn<ùa - ¡ï
 */

// ============ ¥ãšI ============

/**
 * åCpn - Server ¥ã
 */
export interface INotificationMetadataServer {
  icon?: string | null;
  image?: string | null;
  color?: string | null;
  sound?: string | null;
  badge?: number | null;
  data?: any; // êšIpn

  // <ùa¹Õ
  equals(other: INotificationMetadataServer): boolean;
  with(
    updates: Partial<
      Omit<
        INotificationMetadataServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): INotificationMetadataServer;

  // DTO lb¹Õ
  toServerDTO(): NotificationMetadataServerDTO;
  toClientDTO(): NotificationMetadataClientDTO;
  toPersistenceDTO(): NotificationMetadataPersistenceDTO;
}

// ============ DTO šI ============

/**
 * NotificationMetadata Server DTO
 */
export interface NotificationMetadataServerDTO {
  icon?: string | null;
  image?: string | null;
  color?: string | null;
  sound?: string | null;
  badge?: number | null;
  data?: any;
}

/**
 * NotificationMetadata Client DTO ((Ž Server -> Client lb)
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

/**
 * NotificationMetadata Persistence DTO
 */
export interface NotificationMetadataPersistenceDTO {
  icon?: string | null;
  image?: string | null;
  color?: string | null;
  sound?: string | null;
  badge?: number | null;
  data?: string | null; // JSON string
}

// ============ {‹üú ============

export type NotificationMetadataServer = INotificationMetadataServer;
