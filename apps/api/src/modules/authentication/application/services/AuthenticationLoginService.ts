import { authenticationContainer } from '../../infrastructure/di/container';
// repos
import type {
  IAuthCredentialRepository,
  ITokenRepository,
  ISessionRepository,
} from '@dailyuse/domain-server';
import { sharedContracts, AuthenticationContracts, AccountContracts } from '@dailyuse/contracts';

// 类型别名
type ClientInfo = sharedContracts.ClientInfo;
type TokenType = AuthenticationContracts.TokenType;
type IAccountCore = AccountContracts.IAccountCore;
type AuthTokenPersistenceDTO = AuthenticationContracts.AuthTokenPersistenceDTO;
type AuthCredentialPersistenceDTO = AuthenticationContracts.AuthCredentialPersistenceDTO;
type AuthResponseDTO = AuthenticationContracts.AuthResponse;
type LoginResponseData = AuthenticationContracts.LoginResponse['data'];
type UserInfoDTO = AuthenticationContracts.UserInfoDTO;
type AuthByPasswordRequestDTO = AuthenticationContracts.AuthByPasswordRequestDTO;

// Local type for remember me authentication (not in contracts yet)
type AuthByRememberMeTokenRequestDTO = {
  username: string;
  accountUuid: string;
  rememberMeToken: string;
};

// domains
import { AuthCredential, Token } from '@dailyuse/domain-server';
// utils
import { eventBus } from '@dailyuse/utils';
// 新的 EventEmitter 事件客户端
import { authenticationEventRequester } from '../events/EventRequester';
import type { TResponse } from '../../../../tempTypes';

// 枚举常量 - 使用值而非类型
const TokenTypeEnum = AuthenticationContracts.TokenType;

/**
 * AuthenticationLoginService
 *
 * 负责处理用户登录流程、凭证验证、账号状态校验、事件发布等。
 * 支持依赖注入、事件驱动、异步处理，保证登录流程的解耦与可扩展性。
 */
export class AuthenticationLoginService {
  private static instance: AuthenticationLoginService | null = null;

  private authCredentialRepository: IAuthCredentialRepository;
  private tokenRepository: ITokenRepository;
  private sessionRepository: ISessionRepository;

  /**
   * 构造函数
   * @param authCredentialRepository 认证凭证仓库
   * @param tokenRepository 令牌仓库
   * @param sessionRepository 会话仓库
   */
  constructor(
    authCredentialRepository: IAuthCredentialRepository,
    tokenRepository: ITokenRepository,
    sessionRepository: ISessionRepository,
  ) {
    this.authCredentialRepository = authCredentialRepository;
    this.tokenRepository = tokenRepository;
    this.sessionRepository = sessionRepository;
  }

  /**
   * 创建服务实例（支持依赖注入）
   * @param authCredentialRepository 可选的认证凭证仓库
   * @param tokenRepository 可选的令牌仓库
   * @param sessionRepository 可选的会话仓库
   * @returns AuthenticationLoginService 实例
   */
  static async createInstance(
    authCredentialRepository?: IAuthCredentialRepository,
    tokenRepository?: ITokenRepository,
    sessionRepository?: ISessionRepository,
  ): Promise<AuthenticationLoginService> {
    authCredentialRepository =
      authCredentialRepository ??
      (authenticationContainer.resolve('authCredentialRepository') as IAuthCredentialRepository);
    tokenRepository =
      tokenRepository ?? (authenticationContainer.resolve('tokenRepository') as ITokenRepository);
    sessionRepository =
      sessionRepository ??
      (authenticationContainer.resolve('sessionRepository') as ISessionRepository);

    return new AuthenticationLoginService(
      authCredentialRepository,
      tokenRepository,
      sessionRepository,
    );
  }

  /**
   * 获取单例实例（全局唯一）
   * @returns AuthenticationLoginService 实例
   */
  static async getInstance(): Promise<AuthenticationLoginService> {
    if (!AuthenticationLoginService.instance) {
      AuthenticationLoginService.instance = await AuthenticationLoginService.createInstance();
    }
    return AuthenticationLoginService.instance;
  }

  // ===================== 业务主流程 =====================

  /**
   * 用户名密码登录
   * @param request 登录请求参数
   * @returns 登录响应对象
   * @example
   * const resp = await service.PasswordAuthentication({
   *   username: "user1",
   *   password: "pass",
   *   remember: true,
   *   clientInfo: { deviceId: "dev1", userAgent: "UA" }
   * });
   * // resp: { success: true, message: "登录成功", data: { username, accountUuid, token, sessionUuid } }
   */
  async PasswordAuthentication(
    request: AuthByPasswordRequestDTO & { clientInfo: ClientInfo },
  ): Promise<TResponse<LoginResponseData>> {
    const { username, password, remember, clientInfo } = request;
    try {
      console.log(`🔐 [AuthenticationLoginService] 开始登录流程 - 用户名: ${username}`);

      // 1. 使用新的 EventEmitter 事件总线获取完整的账户信息
      const account = await authenticationEventRequester.getAccountByUsername(username);
      if (!account) {
        return {
          success: false,
          message: '账号不存在',
          data: undefined,
        };
      }

      console.log(`👤 [AuthenticationLoginService] 找到账户: ${account.uuid}`);
      const accountUuid = account.uuid;

      // 2. 使用新的 EventEmitter 事件总线验证账户状态
      const statusCheck = await authenticationEventRequester.verifyAccountStatus(accountUuid);
      console.log('statusCheck:', statusCheck);
      if (!statusCheck.isValid) {
        return {
          success: false,
          message: `账户状态异常: ${statusCheck.status}，无法登录`,
        };
      }

      console.log(`✅ [AuthenticationLoginService] 账户状态正常: ${statusCheck.status}`);

      // 3. 查询认证凭证
      const authCredential = await this.authCredentialRepository.findByAccountUuid(accountUuid);
      if (!authCredential) {
        return {
          success: false,
          message: '认证凭证不存在',
          data: undefined,
        };
      }

      // 4. 将 DTO 转换为领域对象以进行业务操作
      const authCredentialEntity = AuthCredential.fromPersistenceDTO(authCredential);

      // 5. 验证登录凭证（密码）
      const { success: credentialValid, accessToken } =
        authCredentialEntity.verifyPassword(password);
      if (!credentialValid || !accessToken) {
        return {
          success: false,
          message: '用户名或密码错误',
        };
      }

      console.log(`🔑 [AuthenticationLoginService] 密码验证成功`);

      // 5. 创建刷新令牌
      const refreshToken = authCredentialEntity.createToken(TokenTypeEnum.REFRESH) as Token;
      await this.tokenRepository.save(refreshToken);

      // 6. 创建记住我令牌（如果勾选了记住我）
      let rememberToken;
      if (remember) {
        const deviceInfo = clientInfo
          ? `${clientInfo.deviceId}-${clientInfo.userAgent}`
          : 'unknown-device';
        rememberToken = authCredentialEntity.createRememberToken(deviceInfo) as Token;
        await this.tokenRepository.save(rememberToken);
      }

      // 7. 保存更新后的认证凭证
      await this.authCredentialRepository.save(authCredentialEntity);

      // 8. 创建会话
      const newClientInfo: ClientInfo = {
        deviceId: clientInfo?.deviceId || 'unknown',
        deviceName: 'unknown',
        userAgent: clientInfo?.userAgent || 'unknown',
        ipAddress: clientInfo?.ipAddress || 'unknown',
      };
      const newAuthSession = authCredentialEntity.createSession(newClientInfo);
      await this.sessionRepository.save(newAuthSession);

      console.log(`📱 [AuthenticationLoginService] 创建会话成功: ${newAuthSession.uuid}`);

      // 9. 构造 UserInfoDTO - 基于 IAccountCore 可用字段
      const userInfo: UserInfoDTO = {
        uuid: account.uuid,
        username: account.username,
        email: (account as any).email || undefined,
        avatar: (account as any).user?.avatar || undefined,
        firstName: (account as any).user?.firstName || undefined,
        lastName: (account as any).user?.lastName || undefined,
        roles: (account as any).roles?.map((r: any) => r.name) || [],
        permissions: (account as any).user?.permissions?.map((p: any) => p.name) || [],
        status: account.status,
        lastLoginAt: Date.now(),
      };

      // 10. 返回登录结果，包含所有必要的令牌 - 使用新的 LoginResponse 格式
      const responseData: LoginResponseData = {
        user: userInfo,
        accessToken: accessToken.value,
        refreshToken: refreshToken.value,
        expiresIn: Math.floor(accessToken.getRemainingTime() / 1000), // 转换为秒
        tokenType: 'Bearer',
        sessionId: newAuthSession.uuid,
      };

      // 如果有记住我令牌，添加到响应中
      if (rememberToken) {
        responseData.rememberToken = rememberToken.value;
      }

      console.log(`🎉 [AuthenticationLoginService] 登录成功完成 - 用户: ${username}`);

      return {
        success: true,
        message: '登录成功',
        data: responseData,
      };
    } catch (error) {
      console.error(`❌ [AuthenticationLoginService] 登录失败:`, error);
      return {
        success: false,
        message: '登录失败，请稍后重试',
      };
    }
  }

  /**
   * 获取本地可快速登录的账号列表
   * @returns { success, message, data } data为账号数组
   * @example
   * const resp = await service.getQuickLoginAccounts();
   * // resp: { success: true, message: "获取快速登录账号列表成功", data: [{ accountUuid, username, token }] }
   */
  async getQuickLoginAccounts(): Promise<
    TResponse<Array<{ accountUuid: string; username: string; token: string }>>
  > {
    try {
      console.log(`📋 [AuthenticationLoginService] 获取快速登录账号列表`);

      const tokenDtos: Array<AuthTokenPersistenceDTO> = await this.tokenRepository.findByType(
        TokenTypeEnum.REMEMBER_ME,
      );
      const accounts = [];

      for (const tokenDto of tokenDtos) {
        // 转换为领域对象以检查有效性
        const token = Token.fromPersistenceDTO(tokenDto);
        if (token.isExpired()) continue;

        // 使用新的 EventEmitter 事件总线获取账户信息
        const account = await authenticationEventRequester.getAccountByUuid(token.accountUuid);
        if (account) {
          accounts.push({
            accountUuid: token.accountUuid,
            username: account.username,
            token: token.value,
          });
        }
      }

      console.log(`✅ [AuthenticationLoginService] 找到 ${accounts.length} 个可快速登录的账号`);

      return {
        success: true,
        message: '获取快速登录账号列表成功',
        data: accounts,
      };
    } catch (error) {
      console.error(`❌ [AuthenticationLoginService] 获取快速登录账号失败:`, error);
      return {
        success: false,
        message: '获取快速登录账号失败，请稍后重试',
        data: [],
      };
    }
  }

  /**
   * 记住我令牌登录（快速登录）
   * @param request RememberMeTokenAuthenticationRequest
   * @returns 登录响应对象
   * @example
   * const resp = await service.rememberMeTokenAuthentication({
   *   username: "user1",
   *   accountUuid: "uuid",
   *   rememberMeToken: "token",
   *   clientInfo: { deviceId: "dev1", userAgent: "UA" }
   * });
   * // resp: { success: true, message: "登录成功", data: { accountUuid, username, sessionUuid, token } }
   */
  async rememberMeTokenAuthentication(
    request: AuthByRememberMeTokenRequestDTO & { clientInfo: ClientInfo },
  ): Promise<TResponse<AuthResponseDTO>> {
    const { username, accountUuid, rememberMeToken, clientInfo } = request;

    try {
      console.log(`🔐 [AuthenticationLoginService] 开始记住我登录流程 - 用户名: ${username}`);

      // 1. 使用新的 EventEmitter 事件总线验证账户状态
      const statusCheck = await authenticationEventRequester.verifyAccountStatus(accountUuid);
      if (!statusCheck.isValid) {
        return {
          success: false,
          message: `账户状态异常: ${statusCheck.status}，无法登录`,
        };
      }

      console.log(`✅ [AuthenticationLoginService] 账户状态正常: ${statusCheck.status}`);

      // 2. 验证 rememberMeToken
      const authCredentialDto = await this.authCredentialRepository.findByAccountUuid(accountUuid);
      if (!authCredentialDto) {
        return {
          success: false,
          message: '账号认证凭证不存在',
        };
      }

      // 转换为领域对象以进行业务操作
      const authCredential = AuthCredential.fromPersistenceDTO(authCredentialDto);

      const { success: isRememberMeTokenValid, accessToken } =
        authCredential.verifyRememberToken(rememberMeToken);
      if (!isRememberMeTokenValid || !accessToken) {
        return {
          success: false,
          message: '无效的记住我令牌',
        };
      }

      console.log(`🔑 [AuthenticationLoginService] 记住我令牌验证成功`);

      // 3. 创建新的访问令牌和刷新令牌
      const newAccessToken = authCredential.createToken(TokenTypeEnum.ACCESS) as Token;
      const refreshToken = authCredential.createToken(TokenTypeEnum.REFRESH) as Token;

      // 4. 保存令牌
      await this.tokenRepository.save(newAccessToken);
      await this.tokenRepository.save(refreshToken);

      // 5. 保存更新后的认证凭证
      await this.authCredentialRepository.save(authCredential);

      const newClientInfo: ClientInfo = {
        deviceId: clientInfo?.deviceId || 'unknown',
        deviceName: 'unknown',
        userAgent: clientInfo?.userAgent || 'unknown',
        ipAddress: clientInfo?.ipAddress || 'unknown',
      };

      // 6. 创建新的会话
      const newSession = authCredential.createSession(newClientInfo);
      await this.sessionRepository.save(newSession);

      console.log(`📱 [AuthenticationLoginService] 创建会话成功: ${newSession.uuid}`);

      // 8. 返回成功响应，包含完整的令牌信息
      const responseData: AuthResponseDTO = {
        accountUuid,
        username,
        sessionUuid: newSession.uuid,
        accessToken: newAccessToken.value,
        refreshToken: refreshToken.value,
        rememberToken: rememberMeToken, // 保持原有的记住我令牌
        tokenType: 'Bearer',
        expiresIn: Math.floor(newAccessToken.getRemainingTime() / 1000),
      };

      console.log(`🎉 [AuthenticationLoginService] 记住我登录成功完成 - 用户: ${username}`);

      return {
        success: true,
        message: '登录成功',
        data: responseData,
      };
    } catch (error) {
      console.error(`❌ [AuthenticationLoginService] 记住我登录失败:`, error);
      return {
        success: false,
        message: '登录失败，请稍后重试',
      };
    }
  }

  // ===================== 私有方法（事件/异步/内部工具） =====================
}
