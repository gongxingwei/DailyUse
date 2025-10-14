/**
 * ChannelResponse Value Object
 * 渠道响应值对象
 */

// ============ 接口定义 ============

/**
 * 渠道响应 - Server 接口
 */
export interface IChannelResponseServer {
  messageId?: string | null;
  statusCode?: number | null;
  data?: any;

  // 值对象方法
  equals(other: IChannelResponseServer): boolean;
  with(
    updates: Partial<
      Omit<
        IChannelResponseServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IChannelResponseServer;

  // DTO 转换方法
  toServerDTO(): ChannelResponseServerDTO;
  toClientDTO(): ChannelResponseClientDTO;
  toPersistenceDTO(): ChannelResponsePersistenceDTO;
}

/**
 * 渠道响应 - Client 接口
 */
export interface IChannelResponseClient {
  messageId?: string | null;
  statusCode?: number | null;
  data?: any;

  // UI 辅助属性
  isSuccess: boolean;
  statusText: string;

  // 值对象方法
  equals(other: IChannelResponseClient): boolean;

  // DTO 转换方法
  toServerDTO(): ChannelResponseServerDTO;
}

// ============ DTO 定义 ============

/**
 * ChannelResponse Server DTO
 */
export interface ChannelResponseServerDTO {
  messageId?: string | null;
  statusCode?: number | null;
  data?: any;
}

/**
 * ChannelResponse Client DTO
 */
export interface ChannelResponseClientDTO {
  messageId?: string | null;
  statusCode?: number | null;
  data?: any;
  isSuccess: boolean;
  statusText: string;
}

/**
 * ChannelResponse Persistence DTO
 */
export interface ChannelResponsePersistenceDTO {
  message_id?: string | null;
  status_code?: number | null;
  data?: string | null; // JSON string
}

// ============ 类型导出 ============

export type ChannelResponseServer = IChannelResponseServer;
export type ChannelResponseClient = IChannelResponseClient;
