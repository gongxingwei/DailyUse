/**
 * DoNotDisturbConfig Value Object (Server)
 * MSpMn<ùa - ¡ï
 */

// ============ ¥ãšI ============

/**
 * MSpMn - Server ¥ã
 */
export interface IDoNotDisturbConfigServer {
  enabled: boolean;
  startTime: string; // 'HH:mm' format
  endTime: string; // 'HH:mm' format
  daysOfWeek: number[]; // 0-6 (0=Sunday)

  // <ùa¹Õ
  equals(other: IDoNotDisturbConfigServer): boolean;
  with(
    updates: Partial<
      Omit<
        IDoNotDisturbConfigServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IDoNotDisturbConfigServer;

  // ¡¹Õ
  isInPeriod(timestamp: number): boolean;

  // DTO lb¹Õ
  toServerDTO(): DoNotDisturbConfigServerDTO;
  toClientDTO(): DoNotDisturbConfigClientDTO;
  toPersistenceDTO(): DoNotDisturbConfigPersistenceDTO;
}

// ============ DTO šI ============

/**
 * DoNotDisturbConfig Server DTO
 */
export interface DoNotDisturbConfigServerDTO {
  enabled: boolean;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
}

/**
 * DoNotDisturbConfig Client DTO ((Ž Server -> Client lb)
 */
export interface DoNotDisturbConfigClientDTO {
  enabled: boolean;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  timeRangeText: string;
  daysOfWeekText: string;
  isActive: boolean;
}

/**
 * DoNotDisturbConfig Persistence DTO
 */
export interface DoNotDisturbConfigPersistenceDTO {
  enabled: boolean;
  start_time: string;
  end_time: string;
  days_of_week: string; // JSON.stringify(number[])
}

// ============ {‹üú ============

export type DoNotDisturbConfigServer = IDoNotDisturbConfigServer;
