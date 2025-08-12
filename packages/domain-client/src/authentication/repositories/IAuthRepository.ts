import type { Session } from '../entities/Session';
import type { AuthCredential } from '../AuthCredential';

/**
 * 认证仓储接口 - 客户端
 * 定义客户端认证相关的数据访问契约
 */
export interface IAuthRepository {
  /**
   * 用户登录
   */
  login(credential: AuthCredential): Promise<{
    session: Session;
    accessToken: string;
    refreshToken: string;
  }>;

  /**
   * 用户登出
   */
  logout(sessionId?: string): Promise<void>;

  /**
   * 刷新访问令牌
   */
  refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }>;

  /**
   * 验证访问令牌
   */
  validateToken(token: string): Promise<{
    isValid: boolean;
    session?: Session;
  }>;

  /**
   * 获取当前会话
   */
  getCurrentSession(): Promise<Session | null>;

  /**
   * 获取用户所有会话
   */
  getUserSessions(userId: string): Promise<Session[]>;

  /**
   * 终止指定会话
   */
  terminateSession(sessionId: string): Promise<void>;

  /**
   * 终止所有会话（除当前会话外）
   */
  terminateAllOtherSessions(currentSessionId: string): Promise<void>;

  /**
   * 缓存会话数据到本地存储
   */
  cacheSession(session: Session): Promise<void>;

  /**
   * 从本地缓存获取会话数据
   */
  getSessionFromCache(): Promise<Session | null>;

  /**
   * 清除会话缓存
   */
  clearSessionCache(): Promise<void>;

  /**
   * 更新会话最后活动时间
   */
  updateLastActivity(sessionId: string): Promise<void>;

  /**
   * 检查会话是否有效
   */
  isSessionValid(sessionId: string): Promise<boolean>;
}

/**
 * 注册仓储接口 - 客户端
 */
export interface IRegistrationRepository {
  /**
   * 用户注册
   */
  register(registrationData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<{
    success: boolean;
    userId?: string;
    message: string;
    requiresVerification?: boolean;
  }>;

  /**
   * 发送邮箱验证码
   */
  sendEmailVerification(email: string): Promise<{
    success: boolean;
    message: string;
  }>;

  /**
   * 验证邮箱验证码
   */
  verifyEmailCode(
    email: string,
    code: string,
  ): Promise<{
    success: boolean;
    message: string;
  }>;

  /**
   * 检查用户名是否可用
   */
  checkUsernameAvailability(username: string): Promise<{
    available: boolean;
    suggestions?: string[];
  }>;

  /**
   * 检查邮箱是否已被使用
   */
  checkEmailAvailability(email: string): Promise<{
    available: boolean;
  }>;

  /**
   * 重发验证邮件
   */
  resendVerificationEmail(email: string): Promise<{
    success: boolean;
    message: string;
    nextAllowedTime?: Date;
  }>;
}

/**
 * 密码管理仓储接口 - 客户端
 */
export interface IPasswordRepository {
  /**
   * 请求密码重置
   */
  requestPasswordReset(email: string): Promise<{
    success: boolean;
    message: string;
  }>;

  /**
   * 验证重置令牌
   */
  validateResetToken(token: string): Promise<{
    valid: boolean;
    email?: string;
    expiresAt?: Date;
  }>;

  /**
   * 重置密码
   */
  resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{
    success: boolean;
    message: string;
  }>;

  /**
   * 修改密码
   */
  changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<{
    success: boolean;
    message: string;
  }>;

  /**
   * 验证当前密码
   */
  validateCurrentPassword(password: string): Promise<{
    valid: boolean;
  }>;
}
