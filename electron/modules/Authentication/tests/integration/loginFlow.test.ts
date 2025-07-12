import { Database } from 'better-sqlite3';
import { EventBus } from '@/shared/events/eventBus';
import { AuthenticationLoginService } from '../../application/services/authenticationLoginService';
import { SqliteAuthCredentialRepository } from '../../infrastructure/repositories/sqliteAuthCredentialRepository';
import { AccountStatusVerificationHandler } from '../../../Account/application/eventHandlers/accountStatusVerificationHandler';
import { SessionLoggingEventHandler } from '../../../SessionLogging/application/eventHandlers/sessionLoggingEventHandler';
import { AuthCredential } from '../../domain/aggregates/authCredential';
import { Password } from '../../domain/valueObjects/password';
import { Account } from '../../../Account/domain/aggregates/account';
import { AccountType } from '../../../Account/domain/types/account';
import { User } from '../../../Account/domain/entities/user';
import { TimeUtils } from '../../../../shared/utils/myDateTimeUtils';

// Mock database for testing
const createTestDatabase = (): Database => {
  const db = new (require('better-sqlite3'))(':memory:');
  
  // Create test tables
  db.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      email TEXT,
      phone TEXT,
      accountType TEXT DEFAULT 'local',
      status TEXT DEFAULT 'pending_verification',
      roleIds TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      lastLoginAt INTEGER,
      emailVerificationToken TEXT,
      phoneVerificationCode TEXT
    )
  `);

  db.exec(`
    CREATE TABLE auth_credentials (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      password_algorithm TEXT NOT NULL DEFAULT 'bcrypt',
      password_created_at INTEGER NOT NULL,
      last_auth_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (account_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE session_logs (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      session_id TEXT,
      operation_type TEXT NOT NULL,
      device_info TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      ip_country TEXT,
      ip_region TEXT,
      ip_city TEXT,
      ip_latitude REAL,
      ip_longitude REAL,
      ip_timezone TEXT,
      ip_isp TEXT,
      user_agent TEXT,
      login_time INTEGER,
      logout_time INTEGER,
      duration INTEGER,
      risk_level TEXT NOT NULL DEFAULT 'low',
      risk_factors TEXT,
      is_anomalous BOOLEAN NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  return db;
};

describe('Authentication Login Integration Tests', () => {
  let db: Database;
  let eventBus: EventBus;
  let authCredentialRepository: SqliteAuthCredentialRepository;
  let authenticationLoginService: AuthenticationLoginService;
  let accountStatusHandler: AccountStatusVerificationHandler;
  let sessionLoggingHandler: SessionLoggingEventHandler;

  const testUser = {
    id: 'test-user-1',
    username: 'testuser',
    email: 'test@example.com',
    password: 'TestPassword123!'
  };

  beforeEach(() => {
    // Create test database
    db = createTestDatabase();
    
    // Initialize event bus
    eventBus = new EventBus();
    
    // Initialize repositories
    authCredentialRepository = new SqliteAuthCredentialRepository(db);
    
    // Initialize services
    authenticationLoginService = new AuthenticationLoginService(
      authCredentialRepository,
    );
    
    // Mock Account Repository and initialize handlers
    const mockAccountRepository = {
      findById: jest.fn(),
      findByUsername: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      existsByUsername: jest.fn(),
      existsByEmail: jest.fn()
    };

    accountStatusHandler = new AccountStatusVerificationHandler(
      mockAccountRepository,
    );

    // Mock SessionLogging Repository  
    const mockSessionLoggingRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByAccountId: jest.fn(),
      findBySessionId: jest.fn(),
      findByOperationType: jest.fn(),
      findAnomalous: jest.fn(),
      findByRiskLevel: jest.fn(),
      findByTimeRange: jest.fn(),
      findByAccountIdAndTimeRange: jest.fn(),
      delete: jest.fn(),
      deleteByAccountId: jest.fn(),
      deleteOlderThan: jest.fn()
    };

    sessionLoggingHandler = new SessionLoggingEventHandler(
      mockSessionLoggingRepository,
      eventBus
    );

    // Setup test data
    setupTestData();
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
  });

  const setupTestData = () => {
    // Insert test user
    const userStmt = db.prepare(`
      INSERT INTO users (id, username, email, accountType, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    userStmt.run(
      testUser.id,
      testUser.username,
      testUser.email,
      'local',
      'active',
      TimeUtils.toTimestamp(TimeUtils.now()),
      TimeUtils.toTimestamp(TimeUtils.now())
    );

    // Create and save test auth credential
    const password = new Password(testUser.password);
    const authCredential = new AuthCredential(
      'auth-cred-1',
      testUser.id,
      password
    );

    // Use synchronous version for test setup
    const credStmt = db.prepare(`
      INSERT INTO auth_credentials (
        id, account_id, password_hash, password_salt, password_algorithm,
        password_created_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const passwordInfo = authCredential.getPasswordInfo();
    credStmt.run(
      authCredential.id,
      authCredential.accountId,
      passwordInfo.hashedValue,
      passwordInfo.salt,
      passwordInfo.algorithm,
      TimeUtils.toTimestamp(passwordInfo.createdAt),
      TimeUtils.toTimestamp(authCredential.createdAt),
      TimeUtils.toTimestamp(authCredential.updatedAt)
    );

    // Setup mock account status response
    const mockAccount = new Account(
      testUser.id,
      new User('user-1', 'Test', 'User'),
      testUser.username,
      testUser.email
    );
    mockAccount.activate();
    
    (accountStatusHandler as any).accountRepository.findById.mockResolvedValue(mockAccount);
  };

  describe('Successful Login Flow', () => {
    it('should complete end-to-end login process', async () => {
      // Arrange
      const loginRequest = {
        username: testUser.username,
        password: testUser.password,
        deviceInfo: 'Test Device',
        ipAddress: '127.0.0.1',
        userAgent: 'Test User Agent',
        rememberMe: false
      };

      // Track events
      const eventsReceived: any[] = [];
      eventBus.subscribe('*', (event) => {
        eventsReceived.push(event);
      });

      // Act
      const result = await authenticationLoginService.login(loginRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.accountId).toBe(testUser.id);
      expect(result.sessionId).toBeDefined();

      // Verify events were published
      const eventTypes = eventsReceived.map(e => e.eventType);
      expect(eventTypes).toContain('AccountStatusVerificationRequested');
      expect(eventTypes).toContain('AccountStatusVerificationResponse');
      expect(eventTypes).toContain('LoginCredentialVerificationSucceeded');
      expect(eventTypes).toContain('UserLoggedIn');

      // Verify session logging was called
      expect(sessionLoggingHandler).toBeDefined();
    });

    it('should fail login with incorrect password', async () => {
      // Arrange
      const loginRequest = {
        username: testUser.username,
        password: 'wrongpassword',
        deviceInfo: 'Test Device',
        ipAddress: '127.0.0.1',
        userAgent: 'Test User Agent',
        rememberMe: false
      };

      // Track events
      const eventsReceived: any[] = [];
      eventBus.subscribe('*', (event) => {
        eventsReceived.push(event);
      });

      // Act
      const result = await authenticationLoginService.login(loginRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_CREDENTIALS');

      // Verify events were published
      const eventTypes = eventsReceived.map(e => e.eventType);
      expect(eventTypes).toContain('LoginCredentialVerificationFailed');
      expect(eventTypes).toContain('LoginAttemptFailed');
    });

    it('should fail login with inactive account', async () => {
      // Arrange - setup inactive account
      const inactiveAccount = new Account(
        testUser.id,
        new User('user-1', 'Test', 'User'),
        testUser.username,
        testUser.email
      );
      inactiveAccount.suspend('Test suspension');
      
      (accountStatusHandler as any).accountRepository.findById.mockResolvedValue(inactiveAccount);

      const loginRequest = {
        username: testUser.username,
        password: testUser.password,
        deviceInfo: 'Test Device',
        ipAddress: '127.0.0.1',
        userAgent: 'Test User Agent',
        rememberMe: false
      };

      // Track events
      const eventsReceived: any[] = [];
      eventBus.subscribe('*', (event) => {
        eventsReceived.push(event);
      });

      // Act
      const result = await authenticationLoginService.login(loginRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('ACCOUNT_SUSPENDED');

      // Verify events were published
      const eventTypes = eventsReceived.map(e => e.eventType);
      expect(eventTypes).toContain('AccountStatusVerificationRequested');
      expect(eventTypes).toContain('AccountStatusVerificationResponse');
    });

    it('should fail login with non-existent username', async () => {
      // Arrange
      const loginRequest = {
        username: 'nonexistentuser',
        password: testUser.password,
        deviceInfo: 'Test Device',
        ipAddress: '127.0.0.1',
        userAgent: 'Test User Agent',
        rememberMe: false
      };

      // Track events
      const eventsReceived: any[] = [];
      eventBus.subscribe('*', (event) => {
        eventsReceived.push(event);
      });

      // Act
      const result = await authenticationLoginService.login(loginRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('USER_NOT_FOUND');

      // Verify events were published
      const eventTypes = eventsReceived.map(e => e.eventType);
      expect(eventTypes).toContain('LoginAttemptFailed');
    });
  });

  describe('Event-driven Architecture', () => {
    it('should properly sequence events during login', async () => {
      // Arrange
      const loginRequest = {
        username: testUser.username,
        password: testUser.password,
        deviceInfo: 'Test Device',
        ipAddress: '127.0.0.1',
        userAgent: 'Test User Agent',
        rememberMe: false
      };

      const eventSequence: string[] = [];
      eventBus.subscribe('*', (event) => {
        eventSequence.push(event.eventType);
      });

      // Act
      await authenticationLoginService.login(loginRequest);

      // Assert - verify event sequence
      expect(eventSequence.indexOf('AccountStatusVerificationRequested'))
        .toBeLessThan(eventSequence.indexOf('AccountStatusVerificationResponse'));
      expect(eventSequence.indexOf('AccountStatusVerificationResponse'))
        .toBeLessThan(eventSequence.indexOf('LoginCredentialVerificationSucceeded'));
      expect(eventSequence.indexOf('LoginCredentialVerificationSucceeded'))
        .toBeLessThan(eventSequence.indexOf('UserLoggedIn'));
    });
  });
});
