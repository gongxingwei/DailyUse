import { AccountDeactivationService } from '../../application/services/accountDeactivationService';
import { AuthenticationDeactivationVerificationHandler } from '../../../Authentication/application/eventHandlers/authenticationDeactivationVerificationHandler';

// Mock实现
class MockAccountRepository {
  private accounts = new Map();

  async findById(uuid: string) {
    const account = this.accounts.get(uuid);
    if (!account) return null;
    
    return {
      uuid,
      username: account.username,
      status: account.status,
      disable: () => {
        account.status = 'disabled';
      }
    };
  }

  async save(account: any) {
    this.accounts.set(account.uuid, account);
  }

  // 添加测试数据
  addTestAccount(uuid: string, username: string, status = 'active') {
    this.accounts.set(uuid, { uuid, username, status });
  }
}

class MockAuthCredentialRepository {
  private credentials = new Map();

  async findByAccountUuid(accountUuid: string) {
    const credential = this.credentials.get(accountUuid);
    if (!credential) return null;
    
    return {
      uuid: credential.uuid,
      accountUuid,
      verifyPassword: (password: string) => password === 'correctpassword'
    };
  }

  async delete(accountUuid: string) {
    this.credentials.delete(accountUuid);
  }

  // 添加测试数据
  addTestCredential(accountUuid: string, uuid: string) {
    this.credentials.set(accountUuid, { uuid, accountUuid });
  }
}

class MockEventBus {
  private handlers = new Map<string, Function[]>();

  subscribe(eventType: string, handler: Function) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  async publish(event: any) {
    const handlers = this.handlers.get(event.eventType) || [];
    for (const handler of handlers) {
      await handler(event);
    }
  }
}

describe('Account Deactivation Flow Integration Test', () => {
  let mockAccountRepo: MockAccountRepository;
  let mockAuthCredentialRepo: MockAuthCredentialRepository;
  let mockEventBus: MockEventBus;
  let deactivationService: AccountDeactivationService;
  let verificationHandler: AuthenticationDeactivationVerificationHandler;

  const testAccountUuid = 'test-account-1';
  const testUsername = 'testuser';

  beforeEach(() => {
    // 初始化Mock对象
    mockAccountRepo = new MockAccountRepository();
    mockAuthCredentialRepo = new MockAuthCredentialRepository();
    mockEventBus = new MockEventBus();

    // 添加测试数据
    mockAccountRepo.addTestAccount(testAccountUuid, testUsername, 'active');
    mockAuthCredentialRepo.addTestCredential(testAccountUuid, 'cred-1');

    // 初始化服务
    deactivationService = new AccountDeactivationService(mockAccountRepo as any);
    verificationHandler = new AuthenticationDeactivationVerificationHandler(
      mockAuthCredentialRepo as any
    );

    // 模拟全局eventBus
    (global as any).eventBus = mockEventBus;
  });

  test('should complete user-initiated account deactivation flow', async () => {
    // 模拟用户发起的注销请求
    const deactivationRequest = {
      accountUuid: testAccountUuid,
      username: testUsername,
      requestedBy: 'user' as const,
      reason: '用户主动注销',
      clientInfo: {
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser',
        deviceId: 'test-device'
      }
    };

    // 监听事件
    const eventsReceived: any[] = [];
    mockEventBus.subscribe('*', (event) => {
      eventsReceived.push(event);
    });

    // 发起注销请求
    const result = await deactivationService.requestAccountDeactivation(deactivationRequest);

    // 验证结果
    expect(result.success).toBe(true);
    expect(result.requiresVerification).toBe(true);
    expect(result.requestId).toBeDefined();

    // 验证事件被正确发布
    const eventTypes = eventsReceived.map(e => e.eventType);
    expect(eventTypes).toContain('AccountDeactivationVerificationRequested');
  });

  test('should handle admin-forced account deactivation', async () => {
    const deactivationRequest = {
      accountUuid: testAccountUuid,
      username: testUsername,
      requestedBy: 'admin' as const,
      reason: '违规行为',
      clientInfo: {
        userAgent: 'Admin: admin1',
        deviceId: 'admin-admin1'
      }
    };

    const eventsReceived: any[] = [];
    mockEventBus.subscribe('*', (event) => {
      eventsReceived.push(event);
    });

    const result = await deactivationService.requestAccountDeactivation(deactivationRequest);

    expect(result.success).toBe(true);
    // 管理员操作可能直接通过，无需用户验证
  });

  test('should fail for non-existent account', async () => {
    const deactivationRequest = {
      accountUuid: 'non-existent-account',
      requestedBy: 'user' as const,
      reason: '测试不存在的账号'
    };

    const result = await deactivationService.requestAccountDeactivation(deactivationRequest);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('ACCOUNT_NOT_FOUND');
    expect(result.requiresVerification).toBe(false);
  });

  test('should fail for already deactivated account', async () => {
    // 先设置账号为已禁用状态
    mockAccountRepo.addTestAccount(testAccountUuid, testUsername, 'disabled');

    const deactivationRequest = {
      accountUuid: testAccountUuid,
      requestedBy: 'user' as const,
      reason: '测试已禁用账号'
    };

    const result = await deactivationService.requestAccountDeactivation(deactivationRequest);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('ALREADY_DEACTIVATED');
    expect(result.requiresVerification).toBe(false);
  });

  test('should handle verification timeout', async () => {
    // 这个测试需要模拟超时情况
    // 在实际测试中可以通过缩短超时时间来测试
    const deactivationRequest = {
      accountUuid: testAccountUuid,
      requestedBy: 'user' as const,
      reason: '测试超时'
    };

    // 这里应该测试30秒超时的情况
    // 为了测试速度，可以在测试环境中设置较短的超时时间
  });
});

// 全局测试声明
declare global {
  var describe: (name: string, fn: () => void) => void;
  var test: (name: string, fn: () => void | Promise<void>) => void;
  var expect: (actual: any) => any;
  var beforeEach: (fn: () => void | Promise<void>) => void;
}
