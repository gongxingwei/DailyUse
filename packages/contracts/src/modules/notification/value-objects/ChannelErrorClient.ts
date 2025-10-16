/**
 * ChannelError Value Object (Client)
 *  Sï<ùa - ¢7ï
 */

import type { ChannelErrorServerDTO } from './ChannelErrorServer';

// ============ ¥ãšI ============

/**
 *  Sï - Client ¥ã
 */
export interface IChannelErrorClient {
  code: string;
  message: string;
  details?: any;

  // UI …©^'
  displayMessage: string; // (7Ë}„ïˆo
  isRetryable: boolean; // /&ïÍÕ

  // <ùa¹Õ
  equals(other: IChannelErrorClient): boolean;

  // DTO lb¹Õ
  toServerDTO(): ChannelErrorServerDTO;
}

// ============ DTO šI ============

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

// ============ {‹üú ============

export type ChannelErrorClient = IChannelErrorClient;
