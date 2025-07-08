import { UserSession } from "../types";

/**
 * 会话存储库接口
 */
export interface ISessionRepository {
  save(session: UserSession): Promise<void>;
  findById(id: string): Promise<UserSession | null>;
  findByAccountId(accountId: string): Promise<UserSession[]>;
  findByToken(token: string): Promise<UserSession | null>;
  delete(id: string): Promise<void>;
  deleteByAccountId(accountId: string): Promise<void>;
  findActiveSessions(): Promise<UserSession[]>;
  cleanup(): Promise<void>; // 清理过期会话
}
