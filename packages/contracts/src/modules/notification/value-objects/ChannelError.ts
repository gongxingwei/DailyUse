/**
 * ChannelError Value Object
 * 渠道错误值对象
 */

// ============ 接口定义 ============

/**
 * 渠道错误 - Server 接口
 */
export interface IChannelErrorServer {
  code: string;
  message: string;
  details?: any;

  // 值对象方法
  equals(other: IChannelErrorServer): boolean;
  with(
    updates: Partial<
      Omit<
        IChannelErrorServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IChannelErrorServer;

  // DTO 转换方法
  toServerDTO(): ChannelErrorServerDTO;
  toClientDTO(): ChannelErrorClientDTO;
  toPersistenceDTO(): ChannelErrorPersistenceDTO;
}

/**
 * 渠道错误 - Client 接口
 */
export interface IChannelErrorClient {
  code: string;
  message: string;
  details?: any;

  // UI 辅助属性
  displayMessage: string; // 用户友好的错误消息
  isRetryable: boolean; // 是否可重试

  // 值对象方法
  equals(other: IChannelErrorClient): boolean;

  // DTO 转换方法
  toServerDTO(): ChannelErrorServerDTO;
}

// ============ DTO 定义 ============

/**
 * ChannelError Server DTO
 */
export interface ChannelErrorServerDTO {
  code: string;
  message: string;
  details?: any;
}

/**
 * ChannelError Client DTO
 */
export interface ChannelErrorClientDTO {
  code: string;
  message: string;
  details?: any;
  displayMessage: string;
  isRetryable: boolean;
}

/**
 * ChannelError Persistence DTO
 */
export interface ChannelErrorPersistenceDTO {
  code: string;
  message: string;
  details?: string | null; // JSON string
}

// ============ 类型导出 ============

export type ChannelErrorServer = IChannelErrorServer;
export type ChannelErrorClient = IChannelErrorClient;
