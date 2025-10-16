/**
 * CategoryPreference Value Object (Client)
 * {O}<ùa - ¢7ï
 */

import type { ImportanceLevel } from '../enums';
import type {
  ChannelPreference,
  CategoryPreferenceServerDTO,
} from './CategoryPreferenceServer';

// ============ ¥ãšI ============

/**
 * {O} - Client ¥ã
 */
export interface ICategoryPreferenceClient {
  enabled: boolean;
  channels: ChannelPreference;
  importance: ImportanceLevel[];

  // UI …©^'
  enabledChannelsCount: number;
  enabledChannelsList: string[]; // ["”(…", "®ö"]
  importanceText: string; // "vÍ, ^8Í"

  // <ùa¹Õ
  equals(other: ICategoryPreferenceClient): boolean;

  // DTO lb¹Õ
  toServerDTO(): CategoryPreferenceServerDTO;
}

// ============ DTO šI ============

/**
 * CategoryPreference Client DTO
 */
export interface CategoryPreferenceClientDTO {
  enabled: boolean;
  channels: ChannelPreference;
  importance: ImportanceLevel[];
  enabledChannelsCount: number;
  enabledChannelsList: string[];
  importanceText: string;
}

// ============ {‹üú ============

export type CategoryPreferenceClient = ICategoryPreferenceClient;
