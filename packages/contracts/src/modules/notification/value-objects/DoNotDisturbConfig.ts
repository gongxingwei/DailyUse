/**
 * DoNotDisturbConfig Value Object
 * 免打扰配置值对象
 */

// ============ 接口定义 ============

/**
 * 免打扰配置 - Server 接口
 */
export interface IDoNotDisturbConfigServer {
  enabled: boolean;
  startTime: string; // 'HH:mm' format
  endTime: string; // 'HH:mm' format
  daysOfWeek: number[]; // 0-6 (0=Sunday)

  // 值对象方法
  equals(other: IDoNotDisturbConfigServer): boolean;
  with(
    updates: Partial<
      Omit<
        IDoNotDisturbConfigServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IDoNotDisturbConfigServer;

  // 业务方法
  isInPeriod(timestamp: number): boolean;

  // DTO 转换方法
  toServerDTO(): DoNotDisturbConfigServerDTO;
  toClientDTO(): DoNotDisturbConfigClientDTO;
  toPersistenceDTO(): DoNotDisturbConfigPersistenceDTO;
}

/**
 * 免打扰配置 - Client 接口
 */
export interface IDoNotDisturbConfigClient {
  enabled: boolean;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];

  // UI 辅助属性
  timeRangeText: string; // "22:00 - 08:00"
  daysOfWeekText: string; // "周一, 周二, 周三"
  isActive: boolean; // 当前是否在免打扰时间段内

  // 值对象方法
  equals(other: IDoNotDisturbConfigClient): boolean;

  // DTO 转换方法
  toServerDTO(): DoNotDisturbConfigServerDTO;
}

// ============ DTO 定义 ============

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
 * DoNotDisturbConfig Client DTO
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

// ============ 类型导出 ============

export type DoNotDisturbConfigServer = IDoNotDisturbConfigServer;
export type DoNotDisturbConfigClient = IDoNotDisturbConfigClient;
