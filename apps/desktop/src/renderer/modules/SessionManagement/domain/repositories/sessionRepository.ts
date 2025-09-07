import { UserSession } from "../types";

/**
 * 会话存储库接口
 */
export interface ISessionRepository {
  save(session: UserSession): Promise<void>;
  findById(uuid: string): Promise<UserSession | null>;
  findByAccountUuid(accountUuid: string): Promise<UserSession[]>;
  findByToken(token: string): Promise<UserSession | null>;
  delete(uuid: string): Promise<void>;
  deleteByAccountUuid(accountUuid: string): Promise<void>;
  findActiveSessions(): Promise<UserSession[]>;
  cleanup(): Promise<void>; // 清理过期会话
}
