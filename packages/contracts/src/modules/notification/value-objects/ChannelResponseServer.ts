/**
 * ChannelResponse Value Object (Server)
 *  SÍ”<ùa - ¡ï
 */

// ============ ¥ãšI ============

/**
 *  SÍ” - Server ¥ã
 */
export interface IChannelResponseServer {
  messageId?: string | null;
  statusCode?: number | null;
  data?: any;

  // <ùa¹Õ
  equals(other: IChannelResponseServer): boolean;
  with(
    updates: Partial<
      Omit<
        IChannelResponseServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IChannelResponseServer;

  // DTO lb¹Õ
  toServerDTO(): ChannelResponseServerDTO;
  toClientDTO(): ChannelResponseClientDTO;
  toPersistenceDTO(): ChannelResponsePersistenceDTO;
}

// ============ DTO šI ============

/**
 * ChannelResponse Server DTO
 */
export interface ChannelResponseServerDTO {
  messageId?: string | null;
  statusCode?: number | null;
  data?: any;
}

/**
 * ChannelResponse Client DTO ((Ž Server -> Client lb)
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

// ============ {‹üú ============

export type ChannelResponseServer = IChannelResponseServer;
