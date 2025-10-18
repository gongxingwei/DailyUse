import type { Router as ExpressRouter } from 'express';
import { Router } from 'express';
import { AccountController } from './AccountController';
import { AccountDeletionController } from './AccountDeletionController';

const router: ExpressRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Accounts
 *   description: 账户管理相关接口
 */

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     summary: 创建账户
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - displayName
 *             properties:
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               displayName:
 *                 type: string
 *               timezone:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       201:
 *         description: 账户创建成功
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/', AccountController.createAccount);

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: 列出所有账户
 *     tags: [Accounts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: 每页数量
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: 账户状态筛选
 *     responses:
 *       200:
 *         description: 成功获取账户列表
 *       500:
 *         description: 服务器错误
 */
router.get('/', AccountController.listAccounts);

/**
 * @swagger
 * /api/accounts/{uuid}:
 *   get:
 *     summary: 获取账户详情
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户UUID
 *     responses:
 *       200:
 *         description: 成功获取账户详情
 *       404:
 *         description: 账户不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/:uuid', AccountController.getAccount);

/**
 * @swagger
 * /api/accounts/{uuid}/profile:
 *   patch:
 *     summary: 更新账户资料
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *               bio:
 *                 type: string
 *               dateOfBirth:
 *                 type: integer
 *               gender:
 *                 type: string
 *               country:
 *                 type: string
 *               city:
 *                 type: string
 *               timezone:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       200:
 *         description: 资料更新成功
 *       404:
 *         description: 账户不存在
 *       500:
 *         description: 服务器错误
 */
router.patch('/:uuid/profile', AccountController.updateProfile);

/**
 * @swagger
 * /api/accounts/{uuid}/verify-email:
 *   post:
 *     summary: 验证邮箱
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户UUID
 *     responses:
 *       200:
 *         description: 邮箱验证成功
 *       404:
 *         description: 账户不存在
 *       500:
 *         description: 服务器错误
 */
router.post('/:uuid/verify-email', AccountController.verifyEmail);

/**
 * @swagger
 * /api/accounts/{uuid}/deactivate:
 *   post:
 *     summary: 停用账户
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户UUID
 *     responses:
 *       200:
 *         description: 账户停用成功
 *       404:
 *         description: 账户不存在
 *       500:
 *         description: 服务器错误
 */
router.post('/:uuid/deactivate', AccountController.deactivateAccount);

/**
 * @swagger
 * /api/accounts/{uuid}:
 *   delete:
 *     summary: 删除账户（管理员用）
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户UUID
 *     responses:
 *       200:
 *         description: 账户删除成功
 *       404:
 *         description: 账户不存在
 *       500:
 *         description: 服务器错误
 */
router.delete('/:uuid', AccountController.deleteAccount);

/**
 * @swagger
 * /api/accounts/delete:
 *   post:
 *     summary: 用户主动注销账户
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountUuid
 *               - password
 *             properties:
 *               accountUuid:
 *                 type: string
 *                 format: uuid
 *                 description: 账户UUID
 *               password:
 *                 type: string
 *                 description: 密码（二次验证）
 *               reason:
 *                 type: string
 *                 description: 注销原因
 *               feedback:
 *                 type: string
 *                 description: 用户反馈
 *               confirmationText:
 *                 type: string
 *                 description: 确认文本（必须为"DELETE"）
 *     responses:
 *       200:
 *         description: 账户注销成功
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
 *                     accountUuid:
 *                       type: string
 *                     deletedAt:
 *                       type: number
 *                 message:
 *                   type: string
 *                   example: Account deleted successfully
 *       400:
 *         description: 请求参数错误或验证失败
 *       401:
 *         description: 密码错误
 *       404:
 *         description: 账户不存在
 *       409:
 *         description: 账户已被删除
 *       500:
 *         description: 服务器错误
 */
router.post('/delete', AccountDeletionController.deleteAccount);

export default router;
