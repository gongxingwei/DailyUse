import { AuthenticationLoginService } from '../../application/services/authenticationLoginService';
import { SqliteAuthCredentialRepository } from '../../infrastructure/repositories/sqliteAuthCredentialRepository';
import { AuthCredential } from '../../domain/aggregates/authCredential';
import { Password } from '../../domain/valueObjects/password';
import { TimeUtils } from '../../../../shared/utils/myDateTimeUtils';

// Mock implementation for basic testing
class MockDatabase {
  prepare(sql: string) {
    return {
      run: (...params: any[]) => {
        // Mock implementation
        console.log('SQL:', sql, 'Params:', params);
      },
      get: (param: any) => {
        // Mock get implementation
        if (sql.includes('WHERE username = ?') && param === 'testuser') {
          return {
            id: 'auth-cred-1',
            account_id: 'test-user-1',
            password_hash: 'mock-hash',
            password_salt: 'mock-salt',
            password_algorithm: 'bcrypt',
            password_created_at: TimeUtils.toTimestamp(TimeUtils.now()),
            created_at: TimeUtils.toTimestamp(TimeUtils.now()),
            updated_at: TimeUtils.toTimestamp(TimeUtils.now()),
            last_auth_at: null
          };
        }
        return null;
      },
      all: () => []
    };
  }
}

describe('Authentication Login Integration', () => {
  let mockDb: MockDatabase;
  let authCredentialRepository: SqliteAuthCredentialRepository;
  let authenticationLoginService: AuthenticationLoginService;

  beforeEach(() => {
    mockDb = new MockDatabase();
    authCredentialRepository = new SqliteAuthCredentialRepository(mockDb as any);
    authenticationLoginService = new AuthenticationLoginService(
      authCredentialRepository
    );
  });

  test('should have basic service structure', () => {
    expect(authenticationLoginService).toBeDefined();
    expect(authCredentialRepository).toBeDefined();
  });

  test('should create password with proper validation', () => {
    const password = new Password('TestPassword123!');
    expect(password).toBeDefined();
    expect(password.verify('TestPassword123!')).toBe(true);
    expect(password.verify('wrongpassword')).toBe(false);
  });

  test('should create auth credential', () => {
    const password = new Password('TestPassword123!');
    const authCredential = new AuthCredential(
      'auth-cred-1',
      'test-user-1',
      password
    );
    
    expect(authCredential).toBeDefined();
    expect(authCredential.id).toBe('auth-cred-1');
    expect(authCredential.accountId).toBe('test-user-1');
    expect(authCredential.verifyPassword('TestPassword123!')).toBe(true);
  });

  test('should get password info for persistence', () => {
    const password = new Password('TestPassword123!');
    const authCredential = new AuthCredential(
      'auth-cred-1',
      'test-user-1',
      password
    );
    
    const passwordInfo = authCredential.getPasswordInfo();
    expect(passwordInfo).toBeDefined();
    expect(passwordInfo.hashedValue).toBeDefined();
    expect(passwordInfo.salt).toBeDefined();
    expect(passwordInfo.algorithm).toBe('bcrypt');
    expect(passwordInfo.createdAt).toBeDefined();
  });

  test('should restore auth credential from persistence', () => {
    const now = TimeUtils.now();
    const authCredential = AuthCredential.restoreFromPersistence(
      'auth-cred-1',
      'test-user-1',
      'mock-hash',
      'mock-salt',
      'bcrypt',
      now,
      now,
      now
    );
    
    expect(authCredential).toBeDefined();
    expect(authCredential.id).toBe('auth-cred-1');
    expect(authCredential.accountId).toBe('test-user-1');
  });

  test('should handle repository save operation', async () => {
    const password = new Password('TestPassword123!');
    const authCredential = new AuthCredential(
      'auth-cred-1',
      'test-user-1',
      password
    );
    
    // This should not throw
    await authCredentialRepository.save(authCredential);
  });

  test('should find credential by username', async () => {
    const credential = await authCredentialRepository.findByUsername('testuser');
    expect(credential).toBeDefined();
    if (credential) {
      expect(credential.accountId).toBe('test-user-1');
    }
  });
});
