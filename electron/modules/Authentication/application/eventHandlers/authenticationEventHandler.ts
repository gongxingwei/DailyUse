import { AccountRegisteredEvent } from '../../../Account/domain/events/accountEvents';
import { AuthCredential } from '../../domain/aggregates/authCredential';
import { Password } from '../../domain/valueObjects/password';
import { IAuthCredentialRepository } from '../../domain/repositories/authenticationRepository';
import { ipcMain } from 'electron';
import { generateUUID } from '@/shared/utils/uuid';

/**
 * Authentication 模块的领域事件处理器
 * 负责处理来自其他模块的事件，特别是 Account 模块的注册事件
 */
export class AuthenticationEventHandler {
  constructor(private authCredentialRepository: IAuthCredentialRepository) {}

  static registerHandlers(): void {
    console.log('[Authentication] 注册事件处理器...');

    // 监听 Account 模块的注册事件
    ipcMain.on('AccountRegistered', async (_event, _data) => {
      console.log('[Authentication] 监听到 Account 模块的注册事件');
    });
  }

  /**
   * 处理账号注册事件
   * 当 Account 模块创建新账号时，向渲染进程请求用户设置认证凭证
   */
  async handleAccountRegistered(event: AccountRegisteredEvent): Promise<void> {
    try {
      console.log('🔐 [Authentication] 处理账号注册事件:', event.payload.username);

      // 从事件中获取注册信息
      const { accountUuid, username, password, requiresAuthentication } = event.payload;

      if (!requiresAuthentication) {
        console.log('⏭️ [Authentication] 账号不需要认证凭证，跳过处理');
        return;
      }
      if (!password) {
        throw new Error('密码不能为空');
      }
      // 检查是否已存在认证凭证
      const existingCredential = await this.authCredentialRepository.findByAccountUuid(accountUuid);
      if (existingCredential) {
        console.log('⚠️ [Authentication] 认证凭证已存在，跳过创建');
        return;
      }

      console.log('📤 [Authentication] 向渲染进程请求用户设置认证凭证');

      // 验证密码强度
      if (!Password.validateStrength(password)) {
        throw new Error('密码强度不足，请重新设置');
      }

      // 创建密码值对象
      const hashedPassword = new Password(password);

      // 创建认证凭证聚合根
      const authCredential = new AuthCredential(generateUUID(), accountUuid, hashedPassword);

      // 保存认证凭证
      await this.authCredentialRepository.save(authCredential);

      console.log('✅ [Authentication] 认证凭证创建成功:', {
        accountUuid,
        username,
        credentialId: authCredential.uuid,
      });

      // 发布认证凭证创建事件
      const domainEvents = authCredential.getDomainEvents();
      for (const domainEvent of domainEvents) {
        console.log(`📢 [Authentication-Event] ${domainEvent.eventType}:`, domainEvent.payload);
        // TODO: 通过事件总线发布事件
      }

      authCredential.clearDomainEvents();
    } catch (error) {
      console.error('❌ [Authentication] 处理账号注册事件失败:', error);

      throw error;
    }
  }
}

/**
 * Authentication 模块事件处理器工厂
 */
export class AuthenticationEventHandlerFactory {
  static create(authCredentialRepository: IAuthCredentialRepository): AuthenticationEventHandler {
    return new AuthenticationEventHandler(authCredentialRepository);
  }
}
