/**
 * Authentication Controller 示例
 *
 * 本文件展示如何在 Controller 中使用 ApplicationService
 * 遵循 DDD 架构最佳实践
 *
 * Controller 职责：
 * 1. 接收 HTTP 请求
 * 2. 验证输入参数
 * 3. 调用 ApplicationService
 * 4. 转换响应格式
 * 5. 处理 HTTP 错误
 *
 * Controller 不应该：
 * - 包含业务逻辑
 * - 直接调用 Repository
 * - 直接调用 DomainService
 * - 处理事务
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  AuthenticationApplicationService,
  PasswordManagementApplicationService,
  SessionManagementApplicationService,
  TwoFactorApplicationService,
  type LoginRequest,
  type ChangePasswordRequest,
  type RefreshSessionRequest,
  type EnableTwoFactorRequest,
} from '../application/services';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AuthenticationController');
const router = Router();

// ==================== 输入验证 Schema ====================

/**
 * 登录请求验证
 */
const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(100),
  deviceInfo: z.object({
    deviceId: z.string(),
    deviceName: z.string(),
    deviceType: z.enum(['WEB', 'MOBILE', 'DESKTOP', 'TABLET', 'OTHER']),
    platform: z.string(),
    browser: z.string().optional(),
    osVersion: z.string().optional(),
  }),
  ipAddress: z.string().ip(),
  location: z
    .object({
      country: z.string().optional(),
      region: z.string().optional(),
      city: z.string().optional(),
      timezone: z.string().optional(),
    })
    .optional(),
});

/**
 * 修改密码请求验证
 */
const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z
    .string()
    .min(8)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number and special character',
    ),
});

/**
 * 刷新会话请求验证
 */
const refreshSessionSchema = z.object({
  refreshToken: z.string(),
});

/**
 * 启用双因素认证请求验证
 */
const enableTwoFactorSchema = z.object({
  method: z.enum(['TOTP', 'SMS', 'EMAIL', 'AUTHENTICATOR_APP']),
  secret: z.string(),
  verificationCode: z.string().length(6),
});

// ==================== Controller 方法 ====================

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('[AuthenticationController] Login request received', {
      username: req.body.username,
      ipAddress: req.ip,
    });

    // ===== 步骤 1: 验证输入 =====
    const validatedData = loginSchema.parse(req.body);

    // ===== 步骤 2: 调用 ApplicationService =====
    const authService = await AuthenticationApplicationService.getInstance();

    const loginRequest: LoginRequest = {
      username: validatedData.username,
      password: validatedData.password,
      deviceInfo: validatedData.deviceInfo,
      ipAddress: req.ip || validatedData.ipAddress,
      location: validatedData.location,
    };

    const result = await authService.login(loginRequest);

    // ===== 步骤 3: 转换响应格式 =====
    logger.info('[AuthenticationController] Login successful', {
      accountUuid: result.account.uuid,
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: result.session.accessToken,
        refreshToken: result.session.refreshToken,
        expiresAt: result.session.expiresAt,
        user: {
          uuid: result.account.uuid,
          username: result.account.username,
          email: result.account.email,
          displayName: result.account.displayName,
        },
      },
      message: result.message,
    });
  } catch (error) {
    // ===== 步骤 4: 处理错误 =====
    logger.error('[AuthenticationController] Login failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    if (error instanceof Error) {
      // 根据错误消息返回适当的状态码
      if (error.message.includes('Invalid username or password')) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          message: error.message,
        });
      }

      if (error.message.includes('locked')) {
        return res.status(423).json({
          success: false,
          error: 'Account locked',
          message: error.message,
        });
      }
    }

    next(error);
  }
});

/**
 * POST /api/auth/logout
 * 用户登出
 */
router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('[AuthenticationController] Logout request received', {
      sessionUuid: req.body.sessionUuid,
    });

    // 从 JWT 或 session 中获取用户信息（这里简化处理）
    const { sessionUuid, accountUuid } = req.body;

    if (!sessionUuid || !accountUuid) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
      });
    }

    // ===== 调用 ApplicationService =====
    const sessionService = await SessionManagementApplicationService.getInstance();

    await sessionService.terminateSession({
      sessionUuid,
      accountUuid,
    });

    logger.info('[AuthenticationController] Logout successful', {
      sessionUuid,
    });

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    logger.error('[AuthenticationController] Logout failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * 刷新访问令牌
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('[AuthenticationController] Refresh token request received');

    // ===== 步骤 1: 验证输入 =====
    const validatedData = refreshSessionSchema.parse(req.body);

    // ===== 步骤 2: 调用 ApplicationService =====
    const sessionService = await SessionManagementApplicationService.getInstance();

    const refreshRequest: RefreshSessionRequest = {
      refreshToken: validatedData.refreshToken,
    };

    const result = await sessionService.refreshSession(refreshRequest);

    // ===== 步骤 3: 转换响应格式 =====
    logger.info('[AuthenticationController] Token refresh successful', {
      sessionUuid: result.session.sessionUuid,
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: result.session.accessToken,
        refreshToken: result.session.refreshToken,
        expiresAt: result.session.expiresAt,
      },
      message: result.message,
    });
  } catch (error) {
    logger.error('[AuthenticationController] Token refresh failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    if (error instanceof Error && error.message.includes('expired')) {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        message: error.message,
      });
    }

    next(error);
  }
});

/**
 * POST /api/auth/password/change
 * 修改密码
 */
router.post('/password/change', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('[AuthenticationController] Change password request received');

    // 从认证中间件获取用户信息（这里简化处理）
    const accountUuid = req.body.accountUuid || (req as any).user?.uuid;

    if (!accountUuid) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // ===== 步骤 1: 验证输入 =====
    const validatedData = changePasswordSchema.parse(req.body);

    // ===== 步骤 2: 调用 ApplicationService =====
    const passwordService = await PasswordManagementApplicationService.getInstance();

    const changePasswordRequest: ChangePasswordRequest = {
      accountUuid,
      currentPassword: validatedData.currentPassword,
      newPassword: validatedData.newPassword,
    };

    const result = await passwordService.changePassword(changePasswordRequest);

    // ===== 步骤 3: 转换响应格式 =====
    logger.info('[AuthenticationController] Password changed successfully', {
      accountUuid,
    });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error('[AuthenticationController] Password change failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    if (error instanceof Error && error.message.includes('incorrect')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid password',
        message: error.message,
      });
    }

    next(error);
  }
});

/**
 * POST /api/auth/2fa/enable
 * 启用双因素认证
 */
router.post('/2fa/enable', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('[AuthenticationController] Enable 2FA request received');

    // 从认证中间件获取用户信息
    const accountUuid = req.body.accountUuid || (req as any).user?.uuid;

    if (!accountUuid) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // ===== 步骤 1: 验证输入 =====
    const validatedData = enableTwoFactorSchema.parse(req.body);

    // ===== 步骤 2: 调用 ApplicationService =====
    const twoFactorService = await TwoFactorApplicationService.getInstance();

    const enableRequest: EnableTwoFactorRequest = {
      accountUuid,
      method: validatedData.method,
      secret: validatedData.secret,
      verificationCode: validatedData.verificationCode,
    };

    const result = await twoFactorService.enableTwoFactor(enableRequest);

    // ===== 步骤 3: 转换响应格式 =====
    logger.info('[AuthenticationController] 2FA enabled successfully', {
      accountUuid,
    });

    res.status(200).json({
      success: true,
      data: {
        backupCodes: result.backupCodes,
      },
      message: result.message,
    });
  } catch (error) {
    logger.error('[AuthenticationController] Enable 2FA failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    next(error);
  }
});

/**
 * GET /api/auth/sessions
 * 获取活跃会话列表
 */
router.get('/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('[AuthenticationController] Get sessions request received');

    // 从认证中间件获取用户信息
    const accountUuid = (req.query.accountUuid as string) || (req as any).user?.uuid;

    if (!accountUuid) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // ===== 调用 ApplicationService =====
    const sessionService = await SessionManagementApplicationService.getInstance();
    const sessions = await sessionService.getActiveSessions(accountUuid);

    // ===== 转换响应格式 =====
    logger.info('[AuthenticationController] Sessions retrieved successfully', {
      accountUuid,
      count: sessions.length,
    });

    res.status(200).json({
      success: true,
      data: {
        sessions: sessions.map((session) => ({
          uuid: session.uuid,
          device: session.device,
          ipAddress: session.ipAddress,
          location: session.location,
          lastActivityAt: session.lastActivityAt,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
        })),
        count: sessions.length,
      },
    });
  } catch (error) {
    logger.error('[AuthenticationController] Get sessions failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    next(error);
  }
});

// ==================== 错误处理中间件 ====================

/**
 * 全局错误处理
 */
router.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('[AuthenticationController] Unhandled error', {
    error: error.message,
    stack: error.stack,
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred',
  });
});

// ==================== 导出 ====================

export default router;

/**
 * ==================== 使用说明 ====================
 *
 * 在主应用文件中注册路由：
 *
 * ```typescript
 * import express from 'express';
 * import authenticationRouter from './modules/authentication/presentation/controllers/AuthenticationController';
 *
 * const app = express();
 *
 * app.use(express.json());
 * app.use('/api/auth', authenticationRouter);
 *
 * app.listen(3000, () => {
 *   console.log('Server running on port 3000');
 * });
 * ```
 *
 * ==================== API 示例 ====================
 *
 * 1. 登录：
 *    POST /api/auth/login
 *    Body: {
 *      "username": "john.doe",
 *      "password": "SecurePassword123!",
 *      "deviceInfo": {
 *        "deviceId": "device-123",
 *        "deviceName": "Chrome Browser",
 *        "deviceType": "WEB",
 *        "platform": "Windows"
 *      },
 *      "ipAddress": "192.168.1.1"
 *    }
 *
 * 2. 登出：
 *    POST /api/auth/logout
 *    Body: {
 *      "sessionUuid": "session-uuid",
 *      "accountUuid": "account-uuid"
 *    }
 *
 * 3. 刷新令牌：
 *    POST /api/auth/refresh
 *    Body: {
 *      "refreshToken": "refresh-token"
 *    }
 *
 * 4. 修改密码：
 *    POST /api/auth/password/change
 *    Body: {
 *      "accountUuid": "account-uuid",
 *      "currentPassword": "OldPassword123!",
 *      "newPassword": "NewPassword123!"
 *    }
 *
 * 5. 启用双因素认证：
 *    POST /api/auth/2fa/enable
 *    Body: {
 *      "accountUuid": "account-uuid",
 *      "method": "AUTHENTICATOR_APP",
 *      "secret": "totp-secret",
 *      "verificationCode": "123456"
 *    }
 *
 * 6. 获取活跃会话：
 *    GET /api/auth/sessions?accountUuid=account-uuid
 */
