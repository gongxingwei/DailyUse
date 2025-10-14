/**
 * CredentialHistory Entity - Server Interface
 * 凭证历史实体 - 服务端接口
 */

// ============ DTO 定义 ============

/**
 * CredentialHistory Server DTO
 */
export interface CredentialHistoryServerDTO {
  uuid: string;
  credentialUuid: string;
  action: string;
  details?: any | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: number;
}

/**
 * CredentialHistory Persistence DTO
 */
export interface CredentialHistoryPersistenceDTO {
  uuid: string;
  credential_uuid: string;
  action: string;
  details?: string | null; // JSON
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: number;
}

// ============ 实体接口 ============

export interface CredentialHistoryServer {
  uuid: string;
  credentialUuid: string;
  action: string;
  details?: any | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: number;

  toServerDTO(): CredentialHistoryServerDTO;
  toPersistenceDTO(): CredentialHistoryPersistenceDTO;
}

export interface CredentialHistoryServerStatic {
  create(params: {
    credentialUuid: string;
    action: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): CredentialHistoryServer;
  fromServerDTO(dto: CredentialHistoryServerDTO): CredentialHistoryServer;
  fromPersistenceDTO(dto: CredentialHistoryPersistenceDTO): CredentialHistoryServer;
}
