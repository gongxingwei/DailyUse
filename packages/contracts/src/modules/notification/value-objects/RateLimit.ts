/**
 * RateLimit Value Object
 * 频率限制值对象
 */

// ============ 接口定义 ============

/**
 * 频率限制 - Server 接口
 */
export interface IRateLimitServer {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;

  // 值对象方法
  equals(other: IRateLimitServer): boolean;
  with(
    updates: Partial<
      Omit<IRateLimitServer, 'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'>
    >,
  ): IRateLimitServer;

  // DTO 转换方法
  toServerDTO(): RateLimitServerDTO;
  toClientDTO(): RateLimitClientDTO;
  toPersistenceDTO(): RateLimitPersistenceDTO;
}

/**
 * 频率限制 - Client 接口
 */
export interface IRateLimitClient {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;

  // UI 辅助属性
  limitText: string; // "每小时最多10条，每天最多100条"

  // 值对象方法
  equals(other: IRateLimitClient): boolean;

  // DTO 转换方法
  toServerDTO(): RateLimitServerDTO;
}

// ============ DTO 定义 ============

/**
 * RateLimit Server DTO
 */
export interface RateLimitServerDTO {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;
}

/**
 * RateLimit Client DTO
 */
export interface RateLimitClientDTO {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;
  limitText: string;
}

/**
 * RateLimit Persistence DTO
 */
export interface RateLimitPersistenceDTO {
  enabled: boolean;
  max_per_hour: number;
  max_per_day: number;
}

// ============ 类型导出 ============

export type RateLimitServer = IRateLimitServer;
export type RateLimitClient = IRateLimitClient;
