/**
 * CategoryPreference Value Object (Server)
 * {O}<ùa - ¡ï
 */

import type { ImportanceLevel } from '../enums';

// ============ q«{‹šI ============

/**
 *  SO}¾n
 */
export interface ChannelPreference {
  inApp: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
}

// ============ ¥ãšI ============

/**
 * {O} - Server ¥ã
 */
export interface ICategoryPreferenceServer {
  enabled: boolean;
  channels: ChannelPreference;
  importance: ImportanceLevel[]; // ê¥6šÍ'§+„å

  // <ùa¹Õ
  equals(other: ICategoryPreferenceServer): boolean;
  with(
    updates: Partial<
      Omit<
        ICategoryPreferenceServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): ICategoryPreferenceServer;

  // DTO lb¹Õ
  toServerDTO(): CategoryPreferenceServerDTO;
  toClientDTO(): CategoryPreferenceClientDTO;
  toPersistenceDTO(): CategoryPreferencePersistenceDTO;
}

// ============ DTO šI ============

/**
 * CategoryPreference Server DTO
 */
export interface CategoryPreferenceServerDTO {
  enabled: boolean;
  channels: ChannelPreference;
  importance: ImportanceLevel[];
}

/**
 * CategoryPreference Client DTO ((Ž Server -> Client lb)
 */
export interface CategoryPreferenceClientDTO {
  enabled: boolean;
  channels: ChannelPreference;
  importance: ImportanceLevel[];
  enabledChannelsCount: number;
  enabledChannelsList: string[];
  importanceText: string;
}

/**
 * CategoryPreference Persistence DTO
 */
export interface CategoryPreferencePersistenceDTO {
  enabled: boolean;
  channels: string; // JSON.stringify(ChannelPreference)
  importance: string; // JSON.stringify(ImportanceLevel[])
}

// ============ {‹üú ============

export type CategoryPreferenceServer = ICategoryPreferenceServer;
