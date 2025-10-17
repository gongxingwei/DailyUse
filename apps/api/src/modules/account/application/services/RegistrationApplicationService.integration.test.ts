/**
 * 事件驱动用户注册流程测试
 *
 * 测试目标：
 * 1. Account 模块创建账户并发布事件
 * 2. Authentication 模块接收事件并创建凭证
 * 3. 验证最终一致性
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { eventBus } from '@dailyuse/utils';
import { RegistrationApplicationService } from '../services/RegistrationApplicationService';
import { AccountContainer } from '../../../infrastructure/di/AccountContainer';
import { AuthenticationContainer } from '../../../../authentication/infrastructure/di/AuthenticationContainer';
import { AccountCreatedHandler } from '../../../../authentication/application/event-handlers/AccountCreatedHandler';
import type { RegisterAccountRequest } from '@dailyuse/contracts';

describe('Event-Driven Registration Flow', () => {
  let registrationService: RegistrationApplicationService;
  let accountCreatedHandler: AccountCreatedHandler;
  let accountContainer: AccountContainer;
  let authContainer: AuthenticationContainer;

  beforeAll(async () => {
    // 初始化容器
    accountContainer = AccountContainer.getInstance();
    authContainer = AuthenticationContainer.getInstance();

    // 初始化服务
    registrationService = RegistrationApplicationService.createInstance();
    accountCreatedHandler = AccountCreatedHandler.getInstance();

    // 注册事件处理器
    eventBus.on('account:created', async (event) => {
      await accountCreatedHandler.handle(event);
    });
  });

  afterAll(async () => {
    // 清理事件监听器
    eventBus.off('account:created');
  });

  it('should create account and credential via event bus', async () => {
    // Arrange: 准备测试数据
    const uniqueSuffix = Date.now();
    const request: RegisterAccountRequest = {
      username: `testuser${uniqueSuffix}`,
      email: `testuser${uniqueSuffix}@example.com`,
      password: 'Test@123456',
      displayName: 'Test User',
    };

    // Act: 调用注册服务
    const accountDto = await registrationService.registerUser(request);

    // Assert: 验证 Account 创建成功
    expect(accountDto).toBeDefined();
    expect(accountDto.username).toBe(request.username);
    expect(accountDto.email).toBe(request.email);
    expect(accountDto.displayName).toBe(request.displayName);

    // 等待事件处理完成（最终一致性）
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 验证 AuthCredential 创建成功
    const credRepo = authContainer.getAuthCredentialRepository();
    const credential = await credRepo.findByAccountUuid(accountDto.uuid);

    expect(credential).toBeDefined();
    expect(credential?.accountUuid).toBe(accountDto.uuid);
    expect(credential?.credentialType).toBe('password');

    // 验证密码已加密（不等于明文密码）
    expect(credential?.credentialValue).not.toBe(request.password);
    expect(credential?.credentialValue.length).toBeGreaterThan(50); // bcrypt hash length

    // 清理测试数据
    const accountRepo = accountContainer.getAccountRepository();
    await accountRepo.delete(accountDto.uuid);
    if (credential) {
      await credRepo.delete(credential.uuid);
    }
  });

  it('should handle event publishing failure gracefully', async () => {
    // Arrange: 模拟事件总线故障
    const eventBusSpy = vi
      .spyOn(eventBus, 'emit')
      .mockRejectedValueOnce(new Error('Event bus error'));

    const uniqueSuffix = Date.now();
    const request: RegisterAccountRequest = {
      username: `testuser${uniqueSuffix}`,
      email: `testuser${uniqueSuffix}@example.com`,
      password: 'Test@123456',
      displayName: 'Test User',
    };

    // Act & Assert: 验证错误处理
    await expect(registrationService.registerUser(request)).rejects.toThrow();

    // 清理 spy
    eventBusSpy.mockRestore();
  });

  it('should handle credential creation failure gracefully', async () => {
    // Arrange: 模拟 AuthenticationDomainService 故障
    const originalHandle = accountCreatedHandler.handle.bind(accountCreatedHandler);
    vi.spyOn(accountCreatedHandler, 'handle').mockRejectedValueOnce(
      new Error('Credential creation failed'),
    );

    const uniqueSuffix = Date.now();
    const request: RegisterAccountRequest = {
      username: `testuser${uniqueSuffix}`,
      email: `testuser${uniqueSuffix}@example.com`,
      password: 'Test@123456',
      displayName: 'Test User',
    };

    // Act: 调用注册服务
    const accountDto = await registrationService.registerUser(request);

    // Assert: 验证 Account 创建成功（即使凭证创建失败）
    expect(accountDto).toBeDefined();

    // 等待事件处理失败
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 验证 Account 存在但 AuthCredential 不存在（最终一致性失败场景）
    const accountRepo = accountContainer.getAccountRepository();
    const account = await accountRepo.findByUuid(accountDto.uuid);
    expect(account).toBeDefined();

    const credRepo = authContainer.getAuthCredentialRepository();
    const credential = await credRepo.findByAccountUuid(accountDto.uuid);
    expect(credential).toBeNull(); // 凭证创建失败

    // 清理测试数据
    await accountRepo.delete(accountDto.uuid);

    // 恢复原始方法
    vi.spyOn(accountCreatedHandler, 'handle').mockRestore();
  });
});
