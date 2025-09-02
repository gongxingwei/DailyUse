/**
 * 使用共享事件契约的模块间通信示例
 * 展示如何避免跨模块依赖，实现类型安全的事件通信
 */

import { typedEventBus } from '../typedEventBus';
import type {
  AccountRegisteredEvent,
  AccountUpdatedEvent,
  UserLoggedInEvent,
  LoginAttemptEvent,
} from '../contracts';
import { EVENT_TYPES } from '../contracts';

/**
 * 示例1: Account 模块发布事件
 */
export class AccountServiceExample {
  async registerAccount(accountData: any): Promise<void> {
    try {
      // ... 执行账户注册逻辑 ...

      // 发布类型安全的账户注册事件
      const event: AccountRegisteredEvent = {
        aggregateId: accountData.uuid,
        eventType: EVENT_TYPES.ACCOUNT.REGISTERED,
        occurredOn: new Date(),
        payload: {
          accountUuid: accountData.uuid,
          username: accountData.username,
          password: accountData.password,
          email: accountData.email,
          phone: accountData.phone,
          accountType: accountData.accountType || 'INDIVIDUAL',
          userUuid: accountData.userUuid,
          userProfile: {
            firstName: accountData.userProfile?.firstName || '',
            lastName: accountData.userProfile?.lastName || '',
            avatar: accountData.userProfile?.avatar,
            bio: accountData.userProfile?.bio,
          },
          status: accountData.status || 'PENDING_VERIFICATION',
          createdAt: new Date(),
          requiresAuthentication: true,
        },
      };

      // 类型安全的事件发布 - 编译时会检查事件结构
      await typedEventBus.publish(event);

      console.log(`✅ [AccountService] 账户注册成功，已发布事件: ${accountData.username}`);
    } catch (error) {
      console.error('❌ [AccountService] 账户注册失败:', error);
      throw error;
    }
  }

  async updateAccountProfile(accountUuid: string, updates: any): Promise<void> {
    // ... 执行账户更新逻辑 ...

    // 发布账户更新事件
    const event: AccountUpdatedEvent = {
      aggregateId: accountUuid,
      eventType: EVENT_TYPES.ACCOUNT.UPDATED,
      occurredOn: new Date(),
      payload: {
        accountUuid,
        username: updates.username || 'unknown',
        updatedFields: Object.keys(updates),
        updatedAt: new Date(),
        updatedBy: updates.updatedBy || 'system',
      },
    };

    await typedEventBus.publish(event);
    console.log(`✅ [AccountService] 账户更新完成，已发布事件`);
  }
}

/**
 * 示例2: Authentication 模块发布事件
 */
export class AuthenticationServiceExample {
  async login(credentials: any): Promise<void> {
    try {
      // ... 执行登录验证逻辑 ...

      if (credentials.isValid) {
        // 登录成功事件
        const successEvent: UserLoggedInEvent = {
          aggregateId: credentials.accountUuid,
          eventType: EVENT_TYPES.AUTH.USER_LOGGED_IN,
          occurredOn: new Date(),
          payload: {
            accountUuid: credentials.accountUuid,
            username: credentials.username,
            sessionId: crypto.randomUUID(),
            loginTime: new Date(),
            clientInfo: {
              ipAddress: credentials.ipAddress || '127.0.0.1',
              userAgent: credentials.userAgent || 'Unknown',
              deviceId: credentials.deviceId,
            },
          },
        };

        await typedEventBus.publish(successEvent);
      } else {
        // 登录失败事件
        const failureEvent: LoginAttemptEvent = {
          aggregateId: credentials.accountUuid || 'unknown',
          eventType: EVENT_TYPES.AUTH.LOGIN_ATTEMPT,
          occurredOn: new Date(),
          payload: {
            username: credentials.username,
            accountUuid: credentials.accountUuid,
            attemptResult: 'failed',
            failureReason: 'INVALID_CREDENTIALS',
            attemptedAt: new Date(),
            clientInfo: {
              ipAddress: credentials.ipAddress || '127.0.0.1',
              userAgent: credentials.userAgent || 'Unknown',
              deviceId: credentials.deviceId,
            },
          },
        };

        await typedEventBus.publish(failureEvent);
      }
    } catch (error) {
      console.error('❌ [AuthenticationService] 登录处理失败:', error);
      throw error;
    }
  }
}

/**
 * 示例3: Notification 模块订阅和处理事件
 */
export class NotificationServiceExample {
  initialize(): void {
    // 订阅账户注册事件 - 发送欢迎邮件
    typedEventBus.subscribe(
      EVENT_TYPES.ACCOUNT.REGISTERED,
      async (event) => {
        console.log(`📧 [NotificationService] 处理账户注册事件:`, event.payload);

        // 发送欢迎邮件
        await this.sendWelcomeEmail(
          event.payload.email || event.payload.username,
          event.payload.accountType,
        );
      },
      { module: 'NotificationService', version: '1.0.0' },
    );

    // 订阅账户更新事件 - 发送更新通知
    typedEventBus.subscribe(
      EVENT_TYPES.ACCOUNT.UPDATED,
      async (event) => {
        console.log(`🔔 [NotificationService] 处理账户更新事件:`, event.payload);

        // 如果是重要字段更新，发送通知
        const importantFields = ['email', 'password', 'phone'];
        const hasImportantUpdate = event.payload.updatedFields.some((field) =>
          importantFields.includes(field),
        );

        if (hasImportantUpdate) {
          await this.sendSecurityNotification(event.payload.accountUuid);
        }
      },
      { module: 'NotificationService' },
    );

    // 订阅登录失败事件 - 安全警告
    typedEventBus.subscribe(
      EVENT_TYPES.AUTH.LOGIN_ATTEMPT,
      async (event) => {
        console.log(`🚨 [NotificationService] 处理登录尝试事件:`, event.payload);

        if (event.payload.attemptResult === 'failed' && event.payload.username) {
          await this.sendSecurityAlert(
            event.payload.username,
            event.payload.clientInfo?.ipAddress || 'unknown',
          );
        }
      },
      { module: 'NotificationService' },
    );

    console.log('🎯 [NotificationService] 事件订阅初始化完成');
  }

  private async sendWelcomeEmail(email: string, accountType: string): Promise<void> {
    console.log(`📬 发送欢迎邮件到: ${email}, 账户类型: ${accountType}`);
    // 实际的邮件发送逻辑...
  }

  private async sendSecurityNotification(accountUuid: string): Promise<void> {
    console.log(`🔐 发送安全通知给账户: ${accountUuid}`);
    // 实际的安全通知逻辑...
  }

  private async sendSecurityAlert(username: string, ipAddress: string): Promise<void> {
    console.log(`⚠️ 发送安全警告: ${username} 从 ${ipAddress} 登录失败`);
    // 实际的安全警告逻辑...
  }
}

/**
 * 示例4: Audit 模块订阅事件 - 审计日志
 */
export class AuditServiceExample {
  initialize(): void {
    // 订阅所有账户相关事件
    typedEventBus.subscribe(
      EVENT_TYPES.ACCOUNT.REGISTERED,
      async (event) => {
        await this.logAuditEvent('ACCOUNT_REGISTRATION', event);
      },
      { module: 'AuditService', version: '1.0.0' },
    );

    typedEventBus.subscribe(
      EVENT_TYPES.ACCOUNT.UPDATED,
      async (event) => {
        await this.logAuditEvent('ACCOUNT_UPDATE', event);
      },
      { module: 'AuditService' },
    );

    // 订阅认证相关事件
    typedEventBus.subscribe(
      EVENT_TYPES.AUTH.USER_LOGGED_IN,
      async (event) => {
        await this.logAuditEvent('USER_LOGIN', event);
      },
      { module: 'AuditService' },
    );

    typedEventBus.subscribe(
      EVENT_TYPES.AUTH.LOGIN_ATTEMPT,
      async (event) => {
        await this.logAuditEvent('LOGIN_ATTEMPT', event);
      },
      { module: 'AuditService' },
    );

    console.log('📋 [AuditService] 审计事件订阅初始化完成');
  }

  private async logAuditEvent(actionType: string, event: any): Promise<void> {
    const auditLog = {
      id: crypto.randomUUID(),
      actionType,
      entityId: event.aggregateId,
      entityType: event.aggregateType,
      eventType: event.eventType,
      details: JSON.stringify(event.payload),
      timestamp: event.occurredAt,
      source: 'EventBus',
    };

    console.log(`📝 [AuditService] 记录审计日志:`, auditLog);
    // 保存到审计日志数据库...
  }
}

/**
 * 示例5: 应用程序初始化和事件总线健康监控
 */
export class ApplicationBootstrap {
  async initialize(): Promise<void> {
    console.log('🚀 [Application] 初始化事件驱动架构...');

    // 初始化各个服务的事件订阅
    const notificationService = new NotificationServiceExample();
    notificationService.initialize();

    const auditService = new AuditServiceExample();
    auditService.initialize();

    // 显示事件总线状态
    this.displayEventBusStatus();

    // 设置健康检查定时器
    setInterval(() => {
      this.healthCheck();
    }, 30000); // 每30秒检查一次

    console.log('✅ [Application] 事件驱动架构初始化完成');
  }

  private displayEventBusStatus(): void {
    const subscribedEvents = typedEventBus.getSubscribedEventTypes();
    console.log(`📊 [EventBus] 已订阅的事件类型 (${subscribedEvents.length}):`, subscribedEvents);

    subscribedEvents.forEach((eventType) => {
      const subscribers = typedEventBus.getEventSubscribers(eventType);
      console.log(`  - ${eventType}: ${subscribers.length} 个订阅者`);
      subscribers.forEach((sub) => {
        console.log(`    * ${sub.module} (${sub.version || 'no version'})`);
      });
    });
  }

  private healthCheck(): void {
    const health = typedEventBus.healthCheck();
    const stats = typedEventBus.getStats();

    console.log(`💚 [EventBus] 健康状态: ${health.status}`);
    console.log(
      `📈 [EventBus] 统计: ${health.eventTypes} 事件类型, ${health.totalHandlers} 处理器`,
    );

    if (health.recentFailures > 0) {
      console.warn(`⚠️ [EventBus] 最近失败: ${health.recentFailures} 次`);
    }

    // 显示详细统计
    stats.forEach((stat, eventType) => {
      if (stat.totalPublished > 0) {
        console.log(
          `  ${eventType}: 发布${stat.totalPublished} 处理${stat.totalHandled} 失败${stat.failureCount}`,
        );
      }
    });
  }
}

/**
 * 示例6: 测试用例展示类型安全
 */
export async function demonstrateTypeSafety(): Promise<void> {
  console.log('🧪 [Demo] 演示类型安全的事件处理...');

  const accountService = new AccountServiceExample();
  const authService = new AuthenticationServiceExample();

  // 模拟账户注册 - 这会触发通知和审计事件处理
  await accountService.registerAccount({
    uuid: 'acc-123',
    username: 'testuser',
    password: 'hashed_password',
    email: 'user@example.com',
    userUuid: 'user-123',
    userProfile: {
      firstName: 'Test',
      lastName: 'User',
    },
    accountType: 'INDIVIDUAL',
    status: 'ACTIVE',
  });

  // 模拟登录成功
  await authService.login({
    accountUuid: 'acc-123',
    username: 'testuser',
    isValid: true,
    ipAddress: '192.168.1.100',
    userAgent: 'Test Browser',
    deviceId: 'device-123',
  });

  // 模拟登录失败
  await authService.login({
    username: 'testuser',
    accountUuid: 'acc-123',
    isValid: false,
    ipAddress: '192.168.1.100',
    userAgent: 'Test Browser',
  });

  // 等待异步事件处理完成
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log('✅ [Demo] 类型安全演示完成');
}

// 使用示例
export async function runExample(): Promise<void> {
  const app = new ApplicationBootstrap();
  await app.initialize();

  // 运行演示
  await demonstrateTypeSafety();
}
