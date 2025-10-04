import { Router } from 'express';
import { AccountController } from './controllers/AccountController';

/**
 * ==========================================
 * Account 模块路由 - RESTful API 设计
 * ==========================================
 *
 * API 设计原则：
 * 1. 所有请求使用 JSON body，不使用 query parameters 传递业务数据
 * 2. ID 参数在 URL path 中（如 /accounts/:id）
 * 3. 统一响应格式：
 *    - 成功: { success: true, data: {...}, message: string }
 *    - 失败: { success: false, error: { code: string, message: string } }
 * 4. 列表响应嵌套分页信息：
 *    - { data: { items: [...], total, page, limit, hasMore } }
 *
 * DTO 类型说明：
 * - Request DTOs: CreateAccountRequest, UpdateAccountRequest (使用 Pick/Partial 模式)
 * - Response DTOs: AccountClientDTO (包含计算属性如 isActive, roleNames 等)
 * - 所有时间字段使用 number 类型（毫秒时间戳）
 *
 * @swagger
 * tags:
 *   - name: Accounts
 *     description: 账户管理相关接口
 */

// 如果认证中间件存在，取消注释下面的行
// import { authenticateToken } from '../auth/middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /accounts:
 *   post:
 *     tags: [Accounts]
 *     summary: 创建账户
 *     description: |
 *       注册新用户账户（无需认证）
 *
 *       请求 DTO: CreateAccountRequest
 *       响应 DTO: AccountCreationResponse { data: { account: AccountClientDTO } }
 *
 *       AccountClientDTO 包含计算属性:
 *       - isActive: 账户是否激活
 *       - roleNames: 角色名称数组
 *       - hasVerifiedEmail: 邮箱是否已验证
 *       - hasVerifiedPhone: 手机号是否已验证
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email]
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 邮箱地址
 *               accountType:
 *                 type: string
 *                 enum: [GUEST, ADMIN]
 *                 default: GUEST
 *                 description: 账户类型
 *     responses:
 *       201:
 *         description: 账户创建成功
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
 *                     account:
 *                       type: object
 *                       description: AccountClientDTO with computed properties
 *                 message:
 *                   type: string
 *                   example: Account created successfully
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: 用户名或邮箱已存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/accounts', AccountController.createAccount);

// 以下路由需要认证（如果有认证中间件，取消注释）
// router.use(authenticateToken);

/**
 * @swagger
 * /accounts/{id}:
 *   get:
 *     tags: [Accounts]
 *     summary: 根据 ID 获取账户信息
 *     description: 获取指定账户的详细信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户ID
 *     responses:
 *       200:
 *         description: 账户信息
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Account'
 *       404:
 *         description: 账户不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/accounts/:id', AccountController.getAccountById);

/**
 * @swagger
 * /accounts/username/{username}:
 *   get:
 *     tags: [Accounts]
 *     summary: 根据用户名获取账户信息
 *     description: 根据用户名查找账户信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户名
 *     responses:
 *       200:
 *         description: 账户信息
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Account'
 *       404:
 *         description: 账户不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/accounts/username/:username', AccountController.getAccountByUsername);

/**
 * @swagger
 * /accounts/{id}:
 *   put:
 *     tags: [Accounts]
 *     summary: 更新账户信息
 *     description: 更新指定账户的基本信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 邮箱地址
 *               profile:
 *                 type: object
 *                 properties:
 *                   displayName:
 *                     type: string
 *                     description: 显示名称
 *                   avatar:
 *                     type: string
 *                     description: 头像URL
 *                   bio:
 *                     type: string
 *                     description: 个人简介
 *     responses:
 *       200:
 *         description: 账户更新成功
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
 *       404:
 *         description: 账户不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/accounts/:id', AccountController.updateAccount);

/**
 * @swagger
 * /accounts/{id}/activate:
 *   post:
 *     tags: [Accounts]
 *     summary: 激活账户
 *     description: 激活指定的账户，使其可以正常使用
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户ID
 *     responses:
 *       200:
 *         description: 账户激活成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 账户不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: 无权限操作
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/accounts/:id/activate', AccountController.activateAccount);

/**
 * @swagger
 * /accounts/{id}/deactivate:
 *   post:
 *     tags: [Accounts]
 *     summary: 停用账户
 *     description: 停用指定的账户，账户将无法登录
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 停用原因
 *     responses:
 *       200:
 *         description: 账户停用成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 账户不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/accounts/:id/deactivate', AccountController.deactivateAccount);

/**
 * @swagger
 * /accounts/{id}/suspend:
 *   post:
 *     tags: [Accounts]
 *     summary: 暂停账户
 *     description: 暂停指定的账户，账户将被临时限制访问
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 暂停原因
 *               duration:
 *                 type: integer
 *                 description: 暂停时长（小时）
 *               suspendUntil:
 *                 type: string
 *                 format: date-time
 *                 description: 暂停到期时间
 *     responses:
 *       200:
 *         description: 账户暂停成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 账户不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/accounts/:id/suspend', AccountController.suspendAccount);

/**
 * @swagger
 * /accounts/{id}/verify-email:
 *   post:
 *     tags: [Accounts]
 *     summary: 验证邮箱
 *     description: 验证账户绑定的邮箱地址
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [verificationCode]
 *             properties:
 *               verificationCode:
 *                 type: string
 *                 description: 邮箱验证码
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 要验证的邮箱地址（可选，用于更新邮箱）
 *     responses:
 *       200:
 *         description: 邮箱验证成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: 验证码错误或已过期
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 账户不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/accounts/:id/verify-email', AccountController.verifyEmail);

/**
 * @swagger
 * /accounts/{id}/verify-phone:
 *   post:
 *     tags: [Accounts]
 *     summary: 验证手机号
 *     description: 验证账户绑定的手机号码
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [verificationCode]
 *             properties:
 *               verificationCode:
 *                 type: string
 *                 description: 手机验证码
 *               phoneNumber:
 *                 type: string
 *                 description: 要验证的手机号码（可选，用于更新手机号）
 *                 pattern: '^[1][3-9]\\d{9}$'
 *     responses:
 *       200:
 *         description: 手机号验证成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: 验证码错误或已过期
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 账户不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/accounts/:id/verify-phone', AccountController.verifyPhone);

/**
 * @swagger
 * /accounts:
 *   get:
 *     tags: [Accounts]
 *     summary: 获取账户列表
 *     description: |
 *       获取所有账户列表（管理员功能）
 *
 *       响应 DTO: AccountListResponse
 *       格式: { data: { accounts: AccountClientDTO[], total, page, limit, hasMore } }
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: 每页数量
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, SUSPENDED]
 *         description: 账户状态筛选
 *     responses:
 *       200:
 *         description: 账户列表
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
 *                     accounts:
 *                       type: array
 *                       description: AccountClientDTO array with computed properties
 *                       items:
 *                         type: object
 *                     total:
 *                       type: integer
 *                       description: 总记录数
 *                       example: 100
 *                     page:
 *                       type: integer
 *                       description: 当前页码
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       description: 每页记录数
 *                       example: 10
 *                     hasMore:
 *                       type: boolean
 *                       description: 是否有更多数据
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: Account list retrieved successfully
 *       403:
 *         description: 无权限访问
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/accounts', AccountController.getAllAccounts);

/**
 * @swagger
 * /accounts/search:
 *   get:
 *     tags: [Accounts]
 *     summary: 搜索账户
 *     description: 根据关键词搜索账户（管理员功能）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [username, email]
 *         description: 搜索类型
 *     responses:
 *       200:
 *         description: 搜索结果
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/accounts/search', AccountController.searchAccounts);

/**
 * @swagger
 * /accounts/{id}:
 *   delete:
 *     tags: [Accounts]
 *     summary: 删除账户
 *     description: 永久删除指定的账户及其所有相关数据（管理员功能）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               confirmDeletion:
 *                 type: boolean
 *                 description: 确认删除标志
 *                 example: true
 *               reason:
 *                 type: string
 *                 description: 删除原因
 *     responses:
 *       200:
 *         description: 账户删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: 请求参数错误或未确认删除
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: 无权限操作（需要管理员权限）
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 账户不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/accounts/:id', AccountController.deleteAccount);

export default router;
