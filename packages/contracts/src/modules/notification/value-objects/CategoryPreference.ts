/**
 * CategoryPreference Value Object
 * 分类偏好值对象
 */

import type { ImportanceLevel } from '../enums';

// ============ 接口定义 ============

/**
 * 渠道偏好设置
 */
export interface ChannelPreference {
  inApp: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
}

/**
 * 分类偏好 - Server 接口
 */
export interface ICategoryPreferenceServer {
  enabled: boolean;
  channels: ChannelPreference;
  importance: ImportanceLevel[]; // 只接收指定重要性级别的通知

  // 值对象方法
  equals(other: ICategoryPreferenceServer): boolean;
  with(
    updates: Partial<
      Omit<
        ICategoryPreferenceServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): ICategoryPreferenceServer;

  // DTO 转换方法
  toServerDTO(): CategoryPreferenceServerDTO;
  toClientDTO(): CategoryPreferenceClientDTO;
  toPersistenceDTO(): CategoryPreferencePersistenceDTO;
}

/**
 * 分类偏好 - Client 接口
 */
export interface ICategoryPreferenceClient {
  enabled: boolean;
  channels: ChannelPreference;
  importance: ImportanceLevel[];

  // UI 辅助属性
  enabledChannelsCount: number;
  enabledChannelsList: string[]; // ["应用内", "邮件"]
  importanceText: string; // "极其重要, 非常重要"

  // 值对象方法
  equals(other: ICategoryPreferenceClient): boolean;

  // DTO 转换方法
  toServerDTO(): CategoryPreferenceServerDTO;
}

// ============ DTO 定义 ============

/**
 * CategoryPreference Server DTO
 */
export interface CategoryPreferenceServerDTO {
  enabled: boolean;
  channels: ChannelPreference;
  importance: ImportanceLevel[];
}

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

/**
 * CategoryPreference Persistence DTO
 */
export interface CategoryPreferencePersistenceDTO {
  enabled: boolean;
  channels: string; // JSON.stringify(ChannelPreference)
  importance: string; // JSON.stringify(ImportanceLevel[])
}

// ============ 类型导出 ============

export type CategoryPreferenceServer = ICategoryPreferenceServer;
export type CategoryPreferenceClient = ICategoryPreferenceClient;
