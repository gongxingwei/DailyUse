/**
 * RefreshToken Entity - Server Interface
 * 刷新令牌实体 - 服务端接口
 */

// ============ DTO 定义 ============

/**
 * RefreshToken Server DTO
 */
export interface RefreshTokenServerDTO {
  uuid: string;
  sessionUuid: string;
  token: string;
  expiresAt: number;
  createdAt: number;
  usedAt?: number | null;
}

/**
 * RefreshToken Persistence DTO
 */
export interface RefreshTokenPersistenceDTO {
  uuid: string;
  session_uuid: string;
  token: string;
  expires_at: number;
  created_at: number;
  used_at?: number | null;
}

// ============ 实体接口 ============

export interface RefreshTokenServer {
  uuid: string;
  sessionUuid: string;
  token: string;
  expiresAt: number;
  createdAt: number;
  usedAt?: number | null;

  isExpired(): boolean;
  markAsUsed(): void;

  toServerDTO(): RefreshTokenServerDTO;
  toPersistenceDTO(): RefreshTokenPersistenceDTO;
}

export interface RefreshTokenServerStatic {
  create(params: {
    sessionUuid: string;
    token: string;
    expiresInDays?: number;
  }): RefreshTokenServer;
  fromServerDTO(dto: RefreshTokenServerDTO): RefreshTokenServer;
  fromPersistenceDTO(dto: RefreshTokenPersistenceDTO): RefreshTokenServer;
}
