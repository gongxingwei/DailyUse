/**
 * RateLimit Value Object (Server)
 * ‘‡P6<ùa - ¡ï
 */

// ============ ¥ãšI ============

/**
 * ‘‡P6 - Server ¥ã
 */
export interface IRateLimitServer {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;

  // <ùa¹Õ
  equals(other: IRateLimitServer): boolean;
  with(
    updates: Partial<
      Omit<IRateLimitServer, 'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'>
    >,
  ): IRateLimitServer;

  // DTO lb¹Õ
  toServerDTO(): RateLimitServerDTO;
  toClientDTO(): RateLimitClientDTO;
  toPersistenceDTO(): RateLimitPersistenceDTO;
}

// ============ DTO šI ============

/**
 * RateLimit Server DTO
 */
export interface RateLimitServerDTO {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;
}

/**
 * RateLimit Client DTO ((Ž Server -> Client lb)
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

// ============ {‹üú ============

export type RateLimitServer = IRateLimitServer;
