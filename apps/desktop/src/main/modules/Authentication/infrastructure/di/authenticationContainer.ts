import type { IAuthCredentialRepository } from '../../domain/repositories/authenticationRepository';
import type { ISessionRepository } from '../../domain/repositories/authenticationRepository';
import type { ITokenRepository } from '../../domain/repositories/authenticationRepository';
import type { IMFADeviceRepository } from '../../domain/repositories/authenticationRepository';
import { SqliteAuthCredentialRepository } from '../repositories/sqliteAuthCredentialRepository';
import { SqliteSessionRepository } from '../repositories/sqliteUserSessionRepository';
import { SqliteTokenRepository } from '../repositories/sqliteTokenRepository';
import { SqliteMFADeviceRepository } from '../repositories/sqliteMFADeviceRepository';

export class AuthenticationContainer {
  private static instance: AuthenticationContainer;
  private authCredentialRepository: IAuthCredentialRepository;
  private sessionRepository: ISessionRepository;
  private tokenRepository: ITokenRepository;
  private mfaDeviceRepository: IMFADeviceRepository;
  private constructor() {
    this.authCredentialRepository = new SqliteAuthCredentialRepository();
    this.sessionRepository = new SqliteSessionRepository();
    this.tokenRepository = new SqliteTokenRepository();
    this.mfaDeviceRepository = new SqliteMFADeviceRepository();
  }

  static async getInstance(): Promise<AuthenticationContainer> {
    if (!AuthenticationContainer.instance) {
      AuthenticationContainer.instance = new AuthenticationContainer();
    }
    return AuthenticationContainer.instance;
  }

  getAuthCredentialRepository(): IAuthCredentialRepository {
    return this.authCredentialRepository;
  }
  getSessionRepository(): ISessionRepository {
    return this.sessionRepository;
  }
  getTokenRepository(): ITokenRepository {
    return this.tokenRepository;
  }
  getMFADeviceRepository(): IMFADeviceRepository {
    return this.mfaDeviceRepository;
  }
}
