/**
 * Theme Module Events
 * @description 主题模块的领域事件定义
 * @author DailyUse Team
 * @date 2025-09-29
 */

import { ThemeType } from './types';

// ========== 基础事件接口 ==========

/**
 * 主题事件基础接口
 */
export interface ThemeEventBase {
  /** 事件ID */
  eventId: string;
  /** 用户ID */
  userId: string;
  /** 事件时间戳 */
  timestamp: Date;
  /** 事件版本 */
  version: number;
}

// ========== 主题相关事件 ==========

/**
 * 主题已创建事件
 */
export interface ThemeCreatedEvent extends ThemeEventBase {
  type: 'ThemeCreated';
  payload: {
    themeId: string;
    themeName: string;
    themeType: ThemeType;
    isBuiltIn: boolean;
    baseThemeId?: string;
    author: string;
  };
}

/**
 * 主题已更新事件
 */
export interface ThemeUpdatedEvent extends ThemeEventBase {
  type: 'ThemeUpdated';
  payload: {
    themeId: string;
    themeName: string;
    changedFields: string[];
    previousVersion: string;
    newVersion: string;
  };
}

/**
 * 主题已删除事件
 */
export interface ThemeDeletedEvent extends ThemeEventBase {
  type: 'ThemeDeleted';
  payload: {
    themeId: string;
    themeName: string;
    themeType: ThemeType;
    deletedBy: string;
  };
}

/**
 * 主题已应用事件
 */
export interface ThemeAppliedEvent extends ThemeEventBase {
  type: 'ThemeApplied';
  payload: {
    themeId: string;
    themeName: string;
    themeType: ThemeType;
    previousThemeId?: string;
    appliedScopes: string[];
    transitionDuration: number;
    appliedBy: string;
  };
}

/**
 * 主题自动切换事件
 */
export interface ThemeAutoSwitchedEvent extends ThemeEventBase {
  type: 'ThemeAutoSwitched';
  payload: {
    fromThemeId: string;
    toThemeId: string;
    switchReason: 'system' | 'time-based' | 'location-based';
    switchTime: Date;
  };
}

/**
 * 主题配置已更新事件
 */
export interface ThemeConfigUpdatedEvent extends ThemeEventBase {
  type: 'ThemeConfigUpdated';
  payload: {
    changedSettings: string[];
    previousConfig: Record<string, any>;
    newConfig: Record<string, any>;
    updatedBy: string;
  };
}

/**
 * 主题已导出事件
 */
export interface ThemeExportedEvent extends ThemeEventBase {
  type: 'ThemeExported';
  payload: {
    themeIds: string[];
    exportFormat: string;
    fileSize: number;
    exportedBy: string;
    exportPath?: string;
  };
}

/**
 * 主题已导入事件
 */
export interface ThemeImportedEvent extends ThemeEventBase {
  type: 'ThemeImported';
  payload: {
    importedThemes: Array<{
      themeId: string;
      themeName: string;
      success: boolean;
    }>;
    totalCount: number;
    successCount: number;
    failedCount: number;
    importSource: string;
    importedBy: string;
  };
}

/**
 * 主题验证失败事件
 */
export interface ThemeValidationFailedEvent extends ThemeEventBase {
  type: 'ThemeValidationFailed';
  payload: {
    themeId: string;
    themeName: string;
    validationErrors: string[];
    validationWarnings: string[];
    attemptedAction: 'create' | 'update' | 'apply' | 'import';
  };
}

/**
 * 主题使用统计事件
 */
export interface ThemeUsageTrackedEvent extends ThemeEventBase {
  type: 'ThemeUsageTracked';
  payload: {
    themeId: string;
    usageDuration: number; // 使用时长（分钟）
    sessionStart: Date;
    sessionEnd: Date;
    deviceInfo?: {
      platform: string;
      userAgent: string;
    };
  };
}

/**
 * 主题性能指标事件
 */
export interface ThemePerformanceEvent extends ThemeEventBase {
  type: 'ThemePerformance';
  payload: {
    themeId: string;
    metrics: {
      loadTime: number; // 加载时间（毫秒）
      applyTime: number; // 应用时间（毫秒）
      cssSize: number; // CSS大小（字节）
      variableCount: number; // CSS变量数量
    };
    performanceScore: number; // 性能评分（0-100）
  };
}

// ========== 事件联合类型 ==========

/**
 * 所有主题事件的联合类型
 */
export type ThemeEvent =
  | ThemeCreatedEvent
  | ThemeUpdatedEvent
  | ThemeDeletedEvent
  | ThemeAppliedEvent
  | ThemeAutoSwitchedEvent
  | ThemeConfigUpdatedEvent
  | ThemeExportedEvent
  | ThemeImportedEvent
  | ThemeValidationFailedEvent
  | ThemeUsageTrackedEvent
  | ThemePerformanceEvent;

/**
 * 主题事件类型字符串联合
 */
export type ThemeEventType = ThemeEvent['type'];

// ========== 事件处理器接口 ==========

/**
 * 主题事件处理器基础接口
 */
export interface ThemeEventHandler<T extends ThemeEvent = ThemeEvent> {
  /** 处理事件 */
  handle(event: T): Promise<void>;
  /** 事件类型 */
  eventType: T['type'];
  /** 处理器优先级 */
  priority?: number;
}

/**
 * 主题事件发布器接口
 */
export interface ThemeEventPublisher {
  /** 发布事件 */
  publish<T extends ThemeEvent>(event: T): Promise<void>;
  /** 批量发布事件 */
  publishBatch(events: ThemeEvent[]): Promise<void>;
  /** 订阅事件 */
  subscribe<T extends ThemeEvent>(eventType: T['type'], handler: ThemeEventHandler<T>): void;
  /** 取消订阅 */
  unsubscribe<T extends ThemeEvent>(eventType: T['type'], handler: ThemeEventHandler<T>): void;
}

/**
 * 主题事件存储接口
 */
export interface ThemeEventStore {
  /** 保存事件 */
  save(event: ThemeEvent): Promise<void>;
  /** 根据条件查询事件 */
  findEvents(criteria: {
    userId?: string;
    eventTypes?: ThemeEventType[];
    themeId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<ThemeEvent[]>;
  /** 获取事件统计 */
  getEventStatistics(criteria: { userId?: string; startDate?: Date; endDate?: Date }): Promise<{
    totalEvents: number;
    eventsByType: Record<ThemeEventType, number>;
    mostActiveThemes: Array<{
      themeId: string;
      eventCount: number;
    }>;
  }>;
}
