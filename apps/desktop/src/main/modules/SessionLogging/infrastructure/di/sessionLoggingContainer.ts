import { ISessionLoggingRepository } from '../../domain/repositories/sessionLoggingRepository';
import { SqliteSessionLoggingRepository } from '../repositories/sqliteSessionLoggingRepository';

export class SessionLoggingContainer {
  private static instance: SessionLoggingContainer;

  private sessionLoggingRepository: ISessionLoggingRepository;

  private constructor() {
    this.sessionLoggingRepository = new SqliteSessionLoggingRepository();
  }
  static getInstance(): SessionLoggingContainer {
    if (!SessionLoggingContainer.instance) {
      SessionLoggingContainer.instance = new SessionLoggingContainer();
    }
    return SessionLoggingContainer.instance;
  }

  getSessionLoggingRepository(): ISessionLoggingRepository {
    return this.sessionLoggingRepository;
  }
}

export const sessionLoggingContainer = SessionLoggingContainer.getInstance();
