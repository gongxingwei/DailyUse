import { Router, type Router as ExpressRouter } from 'express';
import { AuthenticationController } from './controller';
import { AuthenticationApplicationService } from '../../application/services/AuthenticationApplicationService';

/**
 * ==========================================
 * Authentication Routes - RESTful API 设计
 * ==========================================
 *
 * API 设计原则：
 * 1. RESTful 风格：
 *    - 所有请求数据在 JSON body 中
 *    - ID 参数在 URL path 中
 *    - 使用标准 HTTP 方法：POST (创建), GET (查询), PATCH (更新), DELETE (删除)
 *
 * 2. 统一响应格式：
 *    - 成功：{ success: true, data: {...}, message: "..." }
 *    - 失败：{ success: false, error: { code: "...", message: "..." } }
 *
 * 3. 列表响应格式：
 *    - { success: true, data: { items: [...], total: 100, page: 1, limit: 20 } }
 *
 * 4. DTO 类型说明：
 *    - Request DTO: API 请求体类型（如 LoginRequest）
 *    - Response DTO: API 响应数据类型（如 LoginResponse）
 *    - ClientDTO: 包含计算属性的客户端数据类型
 *
 * 5. 时间戳格式：
 *    - 统一使用 number 类型（毫秒时间戳）
 */

const router: ExpressRouter = Router();

const authenticationService = await AuthenticationApplicationService.getInstance();

const authController = new AuthenticationController(authenticationService);

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: 用户认证相关接口
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: 用户登录
 *     description: |
 *       用户通过用户名和密码进行登录认证
 *
 *       请求 DTO: LoginRequest
 *       响应 DTO: LoginResponse { data: { user, accessToken, refreshToken, ... } }
 *
 *       返回的 UserInfoDTO 包含:
 *       - uuid, username, email, avatar
 *       - roles: 角色数组
 *       - permissions: 权限数组
 *       - lastLoginAt: 最后登录时间（毫秒时间戳）
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, deviceInfo]
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名
 *                 example: "admin"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: 密码
 *                 example: "password123"
 *               rememberMe:
 *                 type: boolean
 *                 default: false
 *                 description: 是否记住登录状态
 *               accountType:
 *                 type: string
 *                 enum: [GUEST, ADMIN]
 *                 description: 账户类型
 *               deviceInfo:
 *                 type: object
 *                 required: [deviceId, deviceName, userAgent]
 *                 properties:
 *                   deviceId:
 *                     type: string
 *                     description: 设备唯一标识
 *                   deviceName:
 *                     type: string
 *                     description: 设备名称
 *                   userAgent:
 *                     type: string
 *                     description: 浏览器 User Agent
 *                   ipAddress:
 *                     type: string
 *                     description: IP 地址
 *               mfaCode:
 *                 type: string
 *                 description: MFA 验证码（如果启用了双因素认证）
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       description: 用户信息（UserInfoDTO）
 *                     accessToken:
 *                       type: string
 *                       description: JWT 访问令牌
 *                     refreshToken:
 *                       type: string
 *                       description: JWT 刷新令牌
 *                     expiresIn:
 *                       type: number
 *                       description: 令牌过期时间（秒）
 *                     tokenType:
 *                       type: string
 *                       example: "Bearer"
 *                     sessionId:
 *                       type: string
 *                       description: 会话 ID
 *                     rememberToken:
 *                       type: string
 *                       description: 记住我令牌（如果 rememberMe 为 true）
 *                 message:
 *                   type: string
 *                   example: "登录成功"
 *       401:
 *         description: 认证失败（用户名或密码错误）
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/auth/login', (req, res) => authController.login(req, res));

/**
 * @swagger
 * /auth/mfa/verify:
 *   post:
 *     tags: [Authentication]
 *     summary: MFA 多因素验证
 *     description: 验证多因素认证码
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, deviceId]
 *             properties:
 *               code:
 *                 type: string
 *                 description: 验证码
 *               deviceId:
 *                 type: string
 *                 description: 设备ID
 *     responses:
 *       200:
 *         description: 验证成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: 验证失败
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/auth/mfa/verify', (req, res) => authController.verifyMFA(req, res));

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: 用户登出
 *     description: |
 *       用户登出，使当前会话失效
 *
 *       请求 DTO: LogoutRequest
 *       响应 DTO: LogoutResponse { data: { message, sessionsClosed } }
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: 会话 ID（如果不提供，使用当前会话）
 *               allSessions:
 *                 type: boolean
 *                 default: false
 *                 description: 是否登出所有会话
 *     responses:
 *       200:
 *         description: 登出成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     sessionsClosed:
 *                       type: number
 *                       description: 关闭的会话数
 *                 message:
 *                   type: string
 *       401:
 *         description: 未授权
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/auth/logout', (req, res) => authController.logout(req, res));

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: 刷新访问令牌
 *     description: |
 *       使用刷新令牌获取新的访问令牌
 *
 *       请求 DTO: RefreshTokenRequest
 *       响应 DTO: RefreshTokenResponse { data: { accessToken, refreshToken, expiresIn, tokenType } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: 刷新令牌
 *               deviceInfo:
 *                 type: object
 *                 properties:
 *                   deviceId:
 *                     type: string
 *                     description: 设备 ID
 *                   userAgent:
 *                     type: string
 *                     description: User Agent
 *     responses:
 *       200:
 *         description: 令牌刷新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     expiresIn:
 *                       type: number
 *                     tokenType:
 *                       type: string
 *                       example: "Bearer"
 *                 message:
 *                   type: string
 *       401:
 *         description: 刷新令牌无效
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/auth/refresh', (req, res) => authController.refreshToken(req, res));

/**
 * @swagger
 * /auth/mfa/devices:
 *   post:
 *     tags: [Authentication]
 *     summary: 创建 MFA 设备
 *     description: 为用户创建新的多因素认证设备
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [deviceName, deviceType]
 *             properties:
 *               deviceName:
 *                 type: string
 *                 description: 设备名称
 *               deviceType:
 *                 type: string
 *                 enum: [TOTP, SMS, EMAIL]
 *                 description: 设备类型
 *     responses:
 *       201:
 *         description: 设备创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/auth/mfa/devices', (req, res) => authController.createMFADevice(req, res));

/**
 * @swagger
 * /auth/mfa/devices/{accountUuid}:
 *   get:
 *     tags: [Authentication]
 *     summary: 获取用户 MFA 设备列表
 *     description: |
 *       获取指定用户的所有多因素认证设备
 *
 *       响应 DTO: MFADeviceListResponse { data: { devices: MFADeviceClientDTO[], total } }
 *
 *       MFADeviceClientDTO 包含计算属性:
 *       - isUsable: 是否可用（已验证且未锁定且已启用）
 *       - daysSinceLastUsed: 距离上次使用的天数
 *       - displayName: 显示名称（类型 + 名称）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户UUID
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     devices:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: MFADeviceClientDTO
 *                     total:
 *                       type: number
 *                 message:
 *                   type: string
 *       404:
 *         description: 用户不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/auth/mfa/devices/:accountUuid', (req, res) => authController.getMFADevices(req, res));

/**
 * @swagger
 * /auth/mfa/devices/{deviceUuid}:
 *   delete:
 *     tags: [Authentication]
 *     summary: 删除 MFA 设备
 *     description: 删除指定的多因素认证设备
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 设备UUID
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 设备不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/auth/mfa/devices/:deviceUuid', (req, res) =>
  authController.deleteMFADevice(req, res),
);

/**
 * @swagger
 * /auth/sessions/{accountUuid}:
 *   get:
 *     tags: [Authentication]
 *     summary: 获取用户会话列表
 *     description: |
 *       获取指定用户的所有活跃会话
 *
 *       响应 DTO: SessionListResponse { data: { sessions: UserSessionClientDTO[], total, current } }
 *
 *       UserSessionClientDTO 包含计算属性:
 *       - isExpired: 是否已过期
 *       - isActive: 是否激活
 *       - minutesRemaining: 剩余有效时间（分钟）
 *       - durationMinutes: 会话持续时间（分钟）
 *       - isCurrent: 是否为当前会话
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户UUID
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: UserSessionClientDTO
 *                     total:
 *                       type: number
 *                     current:
 *                       type: string
 *                       description: 当前会话 ID
 *                 message:
 *                   type: string
 *       404:
 *         description: 用户不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/auth/sessions/:accountUuid', (req, res) => authController.getSessions(req, res));

/**
 * @swagger
 * /auth/sessions/{sessionId}:
 *   delete:
 *     tags: [Authentication]
 *     summary: 终止会话
 *     description: 终止指定的用户会话
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: 会话ID
 *     responses:
 *       200:
 *         description: 会话已终止
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 会话不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/auth/sessions/:sessionId', (req, res) => authController.terminateSession(req, res));

export default router;
