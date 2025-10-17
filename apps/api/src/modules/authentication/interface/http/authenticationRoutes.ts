import type { Router as ExpressRouter } from 'express';
import { Router } from 'express';
import { AuthenticationController } from './AuthenticationController';
import { RegistrationController } from '../../../account/interface/http/RegistrationController';

const router: ExpressRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: 认证相关接口
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 用户注册
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名 (3-20 字符，字母数字下划线)
 *               email:
 *                 type: string
 *                 description: 邮箱地址
 *               password:
 *                 type: string
 *                 description: 密码 (至少 8 字符，包含大小写字母和数字)
 *               profile:
 *                 type: object
 *                 properties:
 *                   nickname:
 *                     type: string
 *                     description: 昵称
 *                   avatarUrl:
 *                     type: string
 *                     description: 头像 URL
 *                   bio:
 *                     type: string
 *                     description: 个人简介
 *     responses:
 *       201:
 *         description: 注册成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     account:
 *                       type: object
 *                       description: 账户信息
 *                 message:
 *                   type: string
 *                   example: Registration successful
 *       400:
 *         description: 请求参数错误或验证失败
 *       409:
 *         description: 用户名或邮箱已存在
 *       500:
 *         description: 服务器错误
 */
router.post('/register', RegistrationController.register);

/**
 * @swagger
 * /api/auth/credentials/password:
 *   post:
 *     summary: 创建密码凭证
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountUuid
 *               - hashedPassword
 *             properties:
 *               accountUuid:
 *                 type: string
 *               hashedPassword:
 *                 type: string
 *     responses:
 *       201:
 *         description: 凭证创建成功
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/credentials/password', AuthenticationController.createPasswordCredential);

/**
 * @swagger
 * /api/auth/verify-password:
 *   post:
 *     summary: 验证密码
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountUuid
 *               - hashedPassword
 *             properties:
 *               accountUuid:
 *                 type: string
 *               hashedPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: 密码验证结果
 *       500:
 *         description: 服务器错误
 */
router.post('/verify-password', AuthenticationController.verifyPassword);

/**
 * @swagger
 * /api/auth/password:
 *   put:
 *     summary: 修改密码
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountUuid
 *               - newHashedPassword
 *             properties:
 *               accountUuid:
 *                 type: string
 *               newHashedPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: 密码修改成功
 *       500:
 *         description: 服务器错误
 */
router.put('/password', AuthenticationController.changePassword);

/**
 * @swagger
 * /api/auth/sessions:
 *   post:
 *     summary: 创建会话
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountUuid
 *               - accessToken
 *               - refreshToken
 *               - device
 *               - ipAddress
 *             properties:
 *               accountUuid:
 *                 type: string
 *               accessToken:
 *                 type: string
 *               refreshToken:
 *                 type: string
 *               device:
 *                 type: object
 *               ipAddress:
 *                 type: string
 *               location:
 *                 type: object
 *     responses:
 *       201:
 *         description: 会话创建成功
 *       500:
 *         description: 服务器错误
 */
router.post('/sessions', AuthenticationController.createSession);

/**
 * @swagger
 * /api/auth/sessions/active/{accountUuid}:
 *   get:
 *     summary: 获取活跃会话
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: accountUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户UUID
 *     responses:
 *       200:
 *         description: 成功获取活跃会话列表
 *       500:
 *         description: 服务器错误
 */
router.get('/sessions/active/:accountUuid', AuthenticationController.getActiveSessions);

/**
 * @swagger
 * /api/auth/sessions/{sessionUuid}:
 *   delete:
 *     summary: 撤销会话
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: sessionUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 会话UUID
 *     responses:
 *       200:
 *         description: 会话撤销成功
 *       500:
 *         description: 服务器错误
 */
router.delete('/sessions/:sessionUuid', AuthenticationController.revokeSession);

/**
 * @swagger
 * /api/auth/two-factor/enable:
 *   post:
 *     summary: 启用双因素认证
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountUuid
 *               - method
 *             properties:
 *               accountUuid:
 *                 type: string
 *               method:
 *                 type: string
 *                 enum: [TOTP, SMS, EMAIL, AUTHENTICATOR_APP]
 *     responses:
 *       200:
 *         description: 双因素认证已启用
 *       500:
 *         description: 服务器错误
 */
router.post('/two-factor/enable', AuthenticationController.enableTwoFactor);

/**
 * @swagger
 * /api/auth/api-keys:
 *   post:
 *     summary: 生成 API 密钥
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountUuid
 *               - name
 *             properties:
 *               accountUuid:
 *                 type: string
 *               name:
 *                 type: string
 *               expiresInDays:
 *                 type: integer
 *     responses:
 *       201:
 *         description: API 密钥生成成功
 *       500:
 *         description: 服务器错误
 */
router.post('/api-keys', AuthenticationController.generateApiKey);

export default router;
