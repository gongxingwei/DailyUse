/**
 * Authentication Application Service 集成测试示例
 *
 * 本文件展示如何为 ApplicationService 编写集成测试
 *
 * 测试策略：
 * 1. 使用真实的 Repository 实现（连接测试数据库）
 * 2. 测试完整的业务流程
 * 3. 验证事务的原子性
 * 4. 验证事件发布
 * 5. 测试错误场景
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  AuthenticationApplicationService,
  PasswordManagementApplicationService,
  SessionManagementApplicationService,
} from '../application/services';
import { RegistrationApplicationService } from '../../account/application/services/RegistrationApplicationService';
import type { LoginRequest } from '../application/services';

// ==================== 测试环境设置 ====================

let prisma: PrismaClient;
let authService: AuthenticationApplicationService;
let passwordService: PasswordManagementApplicationService;
let sessionService: SessionManagementApplicationService;
let registrationService: RegistrationApplicationService;

// 测试数据
const testUser = {
  username: 'testuser_' + Date.now(),
  email: `testuser_${Date.now()}@example.com`,
  password: 'TestPassword123!',
  displayName: 'Test User',
};

let testAccountUuid: string;
let testSessionUuid: string;
let testAccessToken: string;
let testRefreshToken: string;

// ==================== 生命周期钩子 ====================

beforeAll(async () => {
  // 初始化测试数据库连接
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL || 'postgresql://user:password@localhost:5432/test_db',
      },
    },
  });

  // 初始化服务
  authService = await AuthenticationApplicationService.getInstance();
  passwordService = await PasswordManagementApplicationService.getInstance();
  sessionService = await SessionManagementApplicationService.getInstance();
  registrationService = await RegistrationApplicationService.getInstance();
});

afterAll(async () => {
  // 清理测试数据
  if (testAccountUuid) {
    await prisma.authSession.deleteMany({
      where: { accountUuid: testAccountUuid },
    });
    await prisma.authCredential.deleteMany({
      where: { accountUuid: testAccountUuid },
    });
    await prisma.account.delete({
      where: { uuid: testAccountUuid },
    });
  }

  // 断开数据库连接
  await prisma.$disconnect();
});

beforeEach(async () => {
  // 每个测试前创建测试用户
  const registrationResult = await registrationService.register({
    username: testUser.username,
    email: testUser.email,
    password: testUser.password,
    displayName: testUser.displayName,
  });

  testAccountUuid = registrationResult.account.uuid;
});

afterEach(async () => {
  // 每个测试后清理
  if (testAccountUuid) {
    await prisma.authSession.deleteMany({
      where: { accountUuid: testAccountUuid },
    });
    await prisma.authCredential.deleteMany({
      where: { accountUuid: testAccountUuid },
    });
    await prisma.account.delete({
      where: { uuid: testAccountUuid },
    });
  }
});

// ==================== 登录流程测试 ====================

describe('AuthenticationApplicationService - Login', () => {
  it('should login successfully with valid credentials', async () => {
    // Arrange
    const loginRequest: LoginRequest = {
      username: testUser.username,
      password: testUser.password,
      deviceInfo: {
        deviceId: 'test-device-123',
        deviceName: 'Chrome Browser',
        deviceType: 'WEB',
        platform: 'Windows',
        browser: 'Chrome',
      },
      ipAddress: '127.0.0.1',
      location: {
        country: 'US',
        city: 'New York',
      },
    };

    // Act
    const result = await authService.login(loginRequest);

    // Assert
    expect(result.success).toBe(true);
    expect(result.account.username).toBe(testUser.username);
    expect(result.session.accessToken).toBeDefined();
    expect(result.session.refreshToken).toBeDefined();
    expect(result.session.expiresAt).toBeGreaterThan(Date.now());

    // 验证会话已创建
    const session = await prisma.authSession.findFirst({
      where: { accountUuid: testAccountUuid },
    });
    expect(session).not.toBeNull();
    expect(session?.status).toBe('ACTIVE');

    // 保存令牌供后续测试使用
    testSessionUuid = result.session.sessionUuid;
    testAccessToken = result.session.accessToken;
    testRefreshToken = result.session.refreshToken;
  });

  it('should fail login with invalid password', async () => {
    // Arrange
    const loginRequest: LoginRequest = {
      username: testUser.username,
      password: 'WrongPassword123!',
      deviceInfo: {
        deviceId: 'test-device-123',
        deviceName: 'Chrome Browser',
        deviceType: 'WEB',
        platform: 'Windows',
      },
      ipAddress: '127.0.0.1',
    };

    // Act & Assert
    await expect(authService.login(loginRequest)).rejects.toThrow('Invalid username or password');

    // 验证失败尝试已记录
    const credential = await prisma.authCredential.findFirst({
      where: { accountUuid: testAccountUuid },
    });
    expect(credential?.failedLoginAttempts).toBeGreaterThan(0);
  });

  it('should fail login with non-existent username', async () => {
    // Arrange
    const loginRequest: LoginRequest = {
      username: 'nonexistent_user',
      password: testUser.password,
      deviceInfo: {
        deviceId: 'test-device-123',
        deviceName: 'Chrome Browser',
        deviceType: 'WEB',
        platform: 'Windows',
      },
      ipAddress: '127.0.0.1',
    };

    // Act & Assert
    await expect(authService.login(loginRequest)).rejects.toThrow('Invalid username or password');
  });

  it('should lock account after multiple failed attempts', async () => {
    // Arrange
    const loginRequest: LoginRequest = {
      username: testUser.username,
      password: 'WrongPassword123!',
      deviceInfo: {
        deviceId: 'test-device-123',
        deviceName: 'Chrome Browser',
        deviceType: 'WEB',
        platform: 'Windows',
      },
      ipAddress: '127.0.0.1',
    };

    // Act - 多次失败登录
    const maxAttempts = 5;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await authService.login(loginRequest);
      } catch (error) {
        // 预期会失败
      }
    }

    // Assert - 验证账户已锁定
    const credential = await prisma.authCredential.findFirst({
      where: { accountUuid: testAccountUuid },
    });
    expect(credential?.failedLoginAttempts).toBeGreaterThanOrEqual(maxAttempts);
    expect(credential?.lockedUntil).not.toBeNull();

    // 尝试再次登录应该被拒绝
    loginRequest.password = testUser.password; // 使用正确密码
    await expect(authService.login(loginRequest)).rejects.toThrow('locked');
  });
});

// ==================== 会话管理测试 ====================

describe('SessionManagementApplicationService', () => {
  beforeEach(async () => {
    // 先登录创建会话
    const loginResult = await authService.login({
      username: testUser.username,
      password: testUser.password,
      deviceInfo: {
        deviceId: 'test-device-123',
        deviceName: 'Chrome Browser',
        deviceType: 'WEB',
        platform: 'Windows',
      },
      ipAddress: '127.0.0.1',
    });

    testSessionUuid = loginResult.session.sessionUuid;
    testAccessToken = loginResult.session.accessToken;
    testRefreshToken = loginResult.session.refreshToken;
  });

  it('should refresh session successfully', async () => {
    // Arrange
    const originalAccessToken = testAccessToken;

    // Act
    const result = await sessionService.refreshSession({
      refreshToken: testRefreshToken,
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.session.accessToken).not.toBe(originalAccessToken);
    expect(result.session.refreshToken).toBeDefined();

    // 验证会话已更新
    const session = await prisma.authSession.findUnique({
      where: { uuid: testSessionUuid },
    });
    expect(session?.accessToken).toBe(result.session.accessToken);
  });

  it('should terminate session successfully', async () => {
    // Act
    await sessionService.terminateSession({
      sessionUuid: testSessionUuid,
      accountUuid: testAccountUuid,
    });

    // Assert - 验证会话已撤销
    const session = await prisma.authSession.findUnique({
      where: { uuid: testSessionUuid },
    });
    expect(session?.status).toBe('REVOKED');
    expect(session?.revokedAt).not.toBeNull();
  });

  it('should terminate all sessions except current', async () => {
    // Arrange - 创建多个会话
    const session2 = await authService.login({
      username: testUser.username,
      password: testUser.password,
      deviceInfo: {
        deviceId: 'test-device-456',
        deviceName: 'Mobile App',
        deviceType: 'MOBILE',
        platform: 'iOS',
      },
      ipAddress: '127.0.0.2',
    });

    // Act - 终止所有会话，除了当前会话
    await sessionService.terminateAllSessions({
      accountUuid: testAccountUuid,
      exceptSessionUuid: testSessionUuid,
    });

    // Assert
    const sessions = await prisma.authSession.findMany({
      where: { accountUuid: testAccountUuid },
    });

    const currentSession = sessions.find((s) => s.uuid === testSessionUuid);
    const otherSession = sessions.find((s) => s.uuid === session2.session.sessionUuid);

    expect(currentSession?.status).toBe('ACTIVE');
    expect(otherSession?.status).toBe('REVOKED');
  });

  it('should get all active sessions', async () => {
    // Arrange - 创建多个会话
    await authService.login({
      username: testUser.username,
      password: testUser.password,
      deviceInfo: {
        deviceId: 'test-device-456',
        deviceName: 'Mobile App',
        deviceType: 'MOBILE',
        platform: 'iOS',
      },
      ipAddress: '127.0.0.2',
    });

    // Act
    const sessions = await sessionService.getActiveSessions(testAccountUuid);

    // Assert
    expect(sessions.length).toBeGreaterThanOrEqual(2);
    expect(sessions.every((s) => s.status === 'ACTIVE')).toBe(true);
  });
});

// ==================== 密码管理测试 ====================

describe('PasswordManagementApplicationService', () => {
  it('should change password successfully', async () => {
    // Arrange
    const newPassword = 'NewPassword123!';

    // Act
    const result = await passwordService.changePassword({
      accountUuid: testAccountUuid,
      currentPassword: testUser.password,
      newPassword,
    });

    // Assert
    expect(result.success).toBe(true);

    // 验证可以使用新密码登录
    const loginResult = await authService.login({
      username: testUser.username,
      password: newPassword,
      deviceInfo: {
        deviceId: 'test-device-123',
        deviceName: 'Chrome Browser',
        deviceType: 'WEB',
        platform: 'Windows',
      },
      ipAddress: '127.0.0.1',
    });

    expect(loginResult.success).toBe(true);
  });

  it('should fail to change password with incorrect current password', async () => {
    // Act & Assert
    await expect(
      passwordService.changePassword({
        accountUuid: testAccountUuid,
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword123!',
      }),
    ).rejects.toThrow('incorrect');
  });

  it('should reset password successfully', async () => {
    // Arrange
    const newPassword = 'ResetPassword123!';

    // Act
    const result = await passwordService.resetPassword({
      accountUuid: testAccountUuid,
      newPassword,
    });

    // Assert
    expect(result.success).toBe(true);

    // 验证可以使用新密码登录
    const loginResult = await authService.login({
      username: testUser.username,
      password: newPassword,
      deviceInfo: {
        deviceId: 'test-device-123',
        deviceName: 'Chrome Browser',
        deviceType: 'WEB',
        platform: 'Windows',
      },
      ipAddress: '127.0.0.1',
    });

    expect(loginResult.success).toBe(true);
  });
});

// ==================== 事务测试 ====================

describe('Transaction Atomicity', () => {
  it('should rollback account creation on credential creation failure', async () => {
    // 这个测试需要模拟 Repository 失败
    // 在实际实现中，可以使用依赖注入来注入模拟的 Repository
    // 注意：这是一个概念性的测试示例
    // 实际实现需要根据你的测试框架和模拟库来调整
  });

  it('should rollback session creation on credential update failure', async () => {
    // 同上，需要模拟失败场景
  });
});

// ==================== 运行测试 ====================

/**
 * 运行测试命令：
 *
 * ```bash
 * # 运行所有集成测试
 * pnpm test:integration
 *
 * # 运行特定测试文件
 * pnpm vitest run AuthenticationApplicationService.integration.test.ts
 *
 * # 监听模式
 * pnpm vitest watch AuthenticationApplicationService.integration.test.ts
 *
 * # 生成覆盖率报告
 * pnpm vitest run --coverage
 * ```
 *
 * 测试前准备：
 * 1. 确保测试数据库已创建
 * 2. 设置环境变量 TEST_DATABASE_URL
 * 3. 运行数据库迁移：prisma migrate deploy --schema=./prisma/schema.prisma
 */
