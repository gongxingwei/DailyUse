import { Database } from 'better-sqlite3';
import type { IAuthCredentialRepository } from "../../index";
import type { ISessionRepository } from "../../index";
import type { ITokenRepository } from "../../index";
import type { IMFADeviceRepository } from "../../index";
import { SqliteAuthCredentialRepository } from "../../index";
import { SqliteUserSessionRepository } from "../../index";
import { SqliteTokenRepository } from "../../index";
import { SqliteMFADeviceRepository } from "../../index";
import { getDatabase } from "../../../../shared/database/index";

export class AuthenticationContainer {
    private static instance: AuthenticationContainer;
    private authCredentialRepository: IAuthCredentialRepository;
    private sessionRepository: ISessionRepository;
    private tokenRepository: ITokenRepository;
    private mfaDeviceRepository: IMFADeviceRepository;
    private constructor(db: Database) {
        
        this.authCredentialRepository = new SqliteAuthCredentialRepository();
        this.sessionRepository = new SqliteUserSessionRepository(db);
        this.tokenRepository = new SqliteTokenRepository(db);
        this.mfaDeviceRepository = new SqliteMFADeviceRepository(db);
    }

    static async getInstance(): Promise<AuthenticationContainer> {
        if (!AuthenticationContainer.instance) {
            const db = await getDatabase();
            AuthenticationContainer.instance = new AuthenticationContainer(db);
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
