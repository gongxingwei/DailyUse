/**
 * NotificationMetadata Value Object
 * 通知元数据值对象
 */

// ============ 接口定义 ============

/**
 * 通知元数据 - Server 接口
 */
export interface INotificationMetadataServer {
  icon?: string | null;
  image?: string | null;
  color?: string | null;
  sound?: string | null;
  badge?: number | null;
  data?: any; // 自定义数据

  // 值对象方法
  equals(other: INotificationMetadataServer): boolean;
  with(
    updates: Partial<
      Omit<
        INotificationMetadataServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): INotificationMetadataServer;

  // DTO 转换方法
  toServerDTO(): NotificationMetadataServerDTO;
  toClientDTO(): NotificationMetadataClientDTO;
  toPersistenceDTO(): NotificationMetadataPersistenceDTO;
}

/**
 * 通知元数据 - Client 接口
 */
export interface INotificationMetadataClient {
  icon?: string | null;
  image?: string | null;
  color?: string | null;
  sound?: string | null;
  badge?: number | null;
  data?: any;

  // UI 辅助属性
  hasIcon: boolean;
  hasImage: boolean;
  hasBadge: boolean;

  // 值对象方法
  equals(other: INotificationMetadataClient): boolean;

  // DTO 转换方法
  toServerDTO(): NotificationMetadataServerDTO;
}

// ============ DTO 定义 ============

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

// ============ 类型导出 ============

export type NotificationMetadataServer = INotificationMetadataServer;
export type NotificationMetadataClient = INotificationMetadataClient;
