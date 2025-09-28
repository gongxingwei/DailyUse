import { Router } from 'express';
import { AuthenticationController } from './controller';
import { AuthenticationApplicationService } from '../../application/services/AuthenticationApplicationService';

const router = Router();

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
 *     description: 用户通过用户名和密码进行登录认证
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: 认证失败
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
 *     description: 用户登出，使当前会话失效
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 登出成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
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
 *     description: 使用刷新令牌获取新的访问令牌
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
 *     responses:
 *       200:
 *         description: 令牌刷新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
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
 *     description: 获取指定用户的所有多因素认证设备
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
 *               $ref: '#/components/schemas/ApiResponse'
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
 *     description: 获取指定用户的所有活跃会话
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
 *               $ref: '#/components/schemas/ApiResponse'
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

export { router as authenticationRoutes };
