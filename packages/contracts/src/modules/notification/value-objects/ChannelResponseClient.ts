/**
 * ChannelResponse Value Object (Client)
 *  SÍ”<ùa - ¢7ï
 */

import type { ChannelResponseServerDTO } from './ChannelResponseServer';

// ============ ¥ãšI ============

/**
 *  SÍ” - Client ¥ã
 */
export interface IChannelResponseClient {
  messageId?: string | null;
  statusCode?: number | null;
  data?: any;

  // UI …©^'
  isSuccess: boolean;
  statusText: string;

  // <ùa¹Õ
  equals(other: IChannelResponseClient): boolean;

  // DTO lb¹Õ
  toServerDTO(): ChannelResponseServerDTO;
}

// ============ DTO šI ============

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

// ============ {‹üú ============

export type ChannelResponseClient = IChannelResponseClient;
