/**
 * ChannelError Value Object (Server)
 *  Sï<ùa - ¡ï
 */

// ============ ¥ãšI ============

/**
 *  Sï - Server ¥ã
 */
export interface IChannelErrorServer {
  code: string;
  message: string;
  details?: any;

  // <ùa¹Õ
  equals(other: IChannelErrorServer): boolean;
  with(
    updates: Partial<
      Omit<
        IChannelErrorServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IChannelErrorServer;

  // DTO lb¹Õ
  toServerDTO(): ChannelErrorServerDTO;
  toClientDTO(): ChannelErrorClientDTO;
  toPersistenceDTO(): ChannelErrorPersistenceDTO;
}

// ============ DTO šI ============

/**
 * ChannelError Server DTO
 */
export interface ChannelErrorServerDTO {
  code: string;
  message: string;
  details?: any;
}

/**
 * ChannelError Client DTO ((Ž Server -> Client lb)
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

// ============ {‹üú ============

export type ChannelErrorServer = IChannelErrorServer;
