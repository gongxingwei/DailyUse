import { AuthResult, LoginCredentials, RegisterData } from "../domain/types";
import { IAccountRepository } from "@/modules/Account/domain/repositories/accountRepository";
import { Account } from "@/modules/Account/domain/aggregates/account";
import { User } from "@/modules/Account/domain/entities/user";
import { Password } from "@/modules/Account/domain/valueObjects/password";
import { Email } from "@/modules/Account/domain/valueObjects/email";
import { PhoneNumber } from "@/modules/Account/domain/valueObjects/phoneNumber";
import { AccountType } from "@/modules/Account/domain/types/account";
import type { TResponse } from "@/shared/types/response";

/**
 * 认证服务
 * 负责用户认证相关的业务逻辑
 */
export class AuthenticationService {
  private static instance: AuthenticationService;

  constructor(private accountRepository: IAccountRepository) {}

  public static getInstance(accountRepository: IAccountRepository): AuthenticationService {
    if (!AuthenticationService.instance) {
      AuthenticationService.instance = new AuthenticationService(accountRepository);
    }
    return AuthenticationService.instance;
  }

  /**
   * 用户登录
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // 根据用户名查找账号
      const account = await this.accountRepository.findByUsername(credentials.username);
      
      if (!account) {
        return {
          success: false,
          message: '用户名或密码错误'
        };
      }

      // 检查账号状态
      if (!account.canLogin()) {
        return {
          success: false,
          message: '账号已被禁用或暂停'
        };
      }

      // 验证密码
      if (!account.verifyPassword(credentials.password)) {
        return {
          success: false,
          message: '用户名或密码错误'
        };
      }

      // 记录登录时间
      account.recordLogin();
      await this.accountRepository.save(account);

      return {
        success: true,
        message: '登录成功',
        accountId: account.id,
        username: account.username
      };

    } catch (error) {
      console.error('登录失败:', error);
      return {
        success: false,
        message: '登录失败，请稍后重试'
      };
    }
  }

  /**
   * 用户注册
   */
  async register(registerData: RegisterData): Promise<AuthResult> {
    try {
      // 验证密码一致性
      if (registerData.password !== registerData.confirmPassword) {
        return {
          success: false,
          message: '密码和确认密码不一致'
        };
      }

      // 验证密码强度
      if (!Password.validateStrength(registerData.password)) {
        return {
          success: false,
          message: '密码强度不足，至少8位且包含大小写字母和数字'
        };
      }

      // 检查用户名是否已存在
      if (await this.accountRepository.existsByUsername(registerData.username)) {
        return {
          success: false,
          message: '用户名已存在'
        };
      }

      // 检查邮箱是否已存在
      if (registerData.email && await this.accountRepository.existsByEmail(registerData.email)) {
        return {
          success: false,
          message: '邮箱已被注册'
        };
      }

      // 检查手机号是否已存在
      if (registerData.phone && await this.accountRepository.existsByPhone(registerData.phone)) {
        return {
          success: false,
          message: '手机号已被注册'
        };
      }

      // 创建账号实体
      const accountId = this.generateId();
      const password = new Password(registerData.password);
      const user = new User(accountId, registerData.username, '');
      
      let email: Email | undefined;
      let phoneNumber: PhoneNumber | undefined;

      if (registerData.email) {
        email = new Email(registerData.email);
      }

      if (registerData.phone) {
        phoneNumber = new PhoneNumber(registerData.phone);
      }

      const account = new Account(
        accountId,
        registerData.username,
        password,
        AccountType.LOCAL,
        user,
        email,
        phoneNumber
      );

      // 保存账号
      await this.accountRepository.save(account);

      return {
        success: true,
        message: '注册成功',
        accountId: account.id,
        username: account.username
      };

    } catch (error) {
      console.error('注册失败:', error);
      return {
        success: false,
        message: '注册失败，请稍后重试'
      };
    }
  }

  /**
   * 发送邮箱验证码
   */
  async sendEmailVerification(username: string): Promise<TResponse> {
    try {
      const account = await this.accountRepository.findByUsername(username);
      
      if (!account) {
        return {
          success: false,
          message: '账号不存在',
          data: null
        };
      }

      if (!account.email) {
        return {
          success: false,
          message: '账号未绑定邮箱',
          data: null
        };
      }

      // 生成验证令牌
      const token = account.generateEmailVerificationToken();
      await this.accountRepository.save(account);

      // TODO: 实际发送邮箱验证码
      console.log(`发送邮箱验证码到 ${account.email.value}: ${token}`);

      return {
        success: true,
        message: '验证码已发送',
        data: null
      };

    } catch (error) {
      console.error('发送邮箱验证码失败:', error);
      return {
        success: false,
        message: '发送验证码失败',
        data: null
      };
    }
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(username: string, token: string): Promise<TResponse> {
    try {
      const account = await this.accountRepository.findByUsername(username);
      
      if (!account) {
        return {
          success: false,
          message: '账号不存在',
          data: null
        };
      }

      if (!account.validateEmailToken(token)) {
        return {
          success: false,
          message: '验证码不正确或已过期',
          data: null
        };
      }

      account.verifyEmail();
      await this.accountRepository.save(account);

      return {
        success: true,
        message: '邮箱验证成功',
        data: null
      };

    } catch (error) {
      console.error('邮箱验证失败:', error);
      return {
        success: false,
        message: '验证失败',
        data: null
      };
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2, 15);
  }
}
