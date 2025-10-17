/**
 * Active Time Config Value Object
 * 生效时间配置值对象
 */

// ============ 接口定义 ============

/**
 * 生效时间配置 - Server 接口
 */
export interface IActiveTimeConfigServer {
  /** 生效开始日期 (epoch ms) */
  startDate: number;
  /** 生效结束日期 (epoch ms)（可选，无期限则为 null） */
  endDate?: number | null;

  // 值对象方法
  equals(other: IActiveTimeConfigServer): boolean;
  with(
    updates: Partial<
      Omit<
        IActiveTimeConfigServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IActiveTimeConfigServer;

  // DTO 转换方法
  toServerDTO(): ActiveTimeConfigServerDTO;
  toClientDTO(): ActiveTimeConfigClientDTO;
  toPersistenceDTO(): ActiveTimeConfigPersistenceDTO;
}

/**
 * 生效时间配置 - Client 接口
 */
export interface IActiveTimeConfigClient {
  startDate: number;
  endDate?: number | null;

  // UI 辅助属性
  displayText: string; // "2024-01-01 至 2024-12-31" | "从 2024-01-01 开始"
  isActive: boolean; // 当前是否在生效期内

  // 值对象方法
  equals(other: IActiveTimeConfigClient): boolean;

  // DTO 转换方法
  toServerDTO(): ActiveTimeConfigServerDTO;
}

// ============ DTO 定义 ============

/**
 * Active Time Config Server DTO
 */
export interface ActiveTimeConfigServerDTO {
  startDate: number;
  endDate?: number | null;
}

/**
 * Active Time Config Client DTO
 */
export interface ActiveTimeConfigClientDTO {
  startDate: number;
  endDate?: number | null;
  displayText: string;
  isActive: boolean;
}

/**
 * Active Time Config Persistence DTO
 */
export interface ActiveTimeConfigPersistenceDTO {
  startDate: number;
  endDate?: number | null;
}

// ============ 类型导出 ============

export type ActiveTimeConfigServer = IActiveTimeConfigServer;
export type ActiveTimeConfigClient = IActiveTimeConfigClient;
