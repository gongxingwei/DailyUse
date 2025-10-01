/**
 * Repository Routes
 * 仓储路由配置
 *
 * @swagger
 * tags:
 *   - name: Repositories
 *     description: 仓储管理相关接口
 *   - name: Repository Resources
 *     description: 仓储资源管理接口
 *   - name: Repository Git
 *     description: 仓储Git操作接口
 *
 * components:
 *   schemas:
 *     Repository:
 *       type: object
 *       properties:
 *         uuid:
 *           type: string
 *           description: 仓储唯一标识
 *         accountUuid:
 *           type: string
 *           description: 账户UUID
 *         name:
 *           type: string
 *           description: 仓储名称
 *         type:
 *           type: string
 *           enum: [local, remote, synchronized]
 *           description: 仓储类型
 *         path:
 *           type: string
 *           description: 仓储路径
 *         description:
 *           type: string
 *           description: 仓储描述
 *         status:
 *           type: string
 *           enum: [active, inactive, archived, syncing]
 *           description: 仓储状态
 *         config:
 *           type: object
 *           properties:
 *             enableGit:
 *               type: boolean
 *               description: 是否启用Git
 *             autoSync:
 *               type: boolean
 *               description: 是否自动同步
 *             syncInterval:
 *               type: number
 *               description: 同步间隔(分钟)
 *             defaultLinkedDocName:
 *               type: string
 *               description: 默认关联文档名称
 *             supportedFileTypes:
 *               type: array
 *               items:
 *                 type: string
 *               description: 支持的文件类型
 *             maxFileSize:
 *               type: number
 *               description: 最大文件大小(字节)
 *             enableVersionControl:
 *               type: boolean
 *               description: 是否启用版本控制
 *         relatedGoals:
 *           type: array
 *           items:
 *             type: string
 *           description: 关联目标列表
 *         git:
 *           type: object
 *           properties:
 *             isGitRepo:
 *               type: boolean
 *               description: 是否为Git仓库
 *             currentBranch:
 *               type: string
 *               description: 当前分支
 *             hasChanges:
 *               type: boolean
 *               description: 是否有未提交更改
 *             remoteUrl:
 *               type: string
 *               description: 远程仓库URL
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *     Resource:
 *       type: object
 *       properties:
 *         uuid:
 *           type: string
 *           description: 资源唯一标识
 *         repositoryUuid:
 *           type: string
 *           description: 所属仓储UUID
 *         name:
 *           type: string
 *           description: 资源名称
 *         type:
 *           type: string
 *           enum: [markdown, image, video, audio, pdf, link, code, other]
 *           description: 资源类型
 *         path:
 *           type: string
 *           description: 资源路径
 *         size:
 *           type: number
 *           description: 资源大小(字节)
 *         description:
 *           type: string
 *           description: 资源描述
 *         author:
 *           type: string
 *           description: 作者
 *         version:
 *           type: string
 *           description: 版本
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: 标签列表
 *         category:
 *           type: string
 *           description: 分类
 *         status:
 *           type: string
 *           enum: [active, archived, deleted, draft]
 *           description: 资源状态
 *         metadata:
 *           type: object
 *           description: 资源元数据
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *     CreateRepositoryRequest:
 *       type: object
 *       required: [name, type, path]
 *       properties:
 *         name:
 *           type: string
 *           description: 仓储名称
 *           example: "我的项目仓储"
 *         type:
 *           type: string
 *           enum: [local, remote, synchronized]
 *           description: 仓储类型
 *           example: "local"
 *         path:
 *           type: string
 *           description: 仓储路径
 *           example: "/path/to/repository"
 *         description:
 *           type: string
 *           description: 仓储描述
 *           example: "用于管理项目文档和资源的仓储"
 *         config:
 *           type: object
 *           properties:
 *             enableGit:
 *               type: boolean
 *               default: false
 *             autoSync:
 *               type: boolean
 *               default: false
 *             syncInterval:
 *               type: number
 *               default: 30
 *             defaultLinkedDocName:
 *               type: string
 *               default: "README.md"
 *             supportedFileTypes:
 *               type: array
 *               items:
 *                 type: string
 *               default: ["markdown", "image", "pdf"]
 *             maxFileSize:
 *               type: number
 *               default: 52428800
 *             enableVersionControl:
 *               type: boolean
 *               default: true
 *         relatedGoals:
 *           type: array
 *           items:
 *             type: string
 *           description: 关联目标UUID列表
 *     UpdateRepositoryRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: 仓储名称
 *         description:
 *           type: string
 *           description: 仓储描述
 *         config:
 *           type: object
 *           description: 仓储配置
 *         relatedGoals:
 *           type: array
 *           items:
 *             type: string
 *           description: 关联目标UUID列表
 *     CreateResourceRequest:
 *       type: object
 *       required: [name, type, path]
 *       properties:
 *         name:
 *           type: string
 *           description: 资源名称
 *           example: "项目文档.md"
 *         type:
 *           type: string
 *           enum: [markdown, image, video, audio, pdf, link, code, other]
 *           description: 资源类型
 *           example: "markdown"
 *         path:
 *           type: string
 *           description: 资源路径
 *           example: "/docs/project.md"
 *         description:
 *           type: string
 *           description: 资源描述
 *         author:
 *           type: string
 *           description: 作者
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: 标签列表
 *         category:
 *           type: string
 *           description: 分类
 *         metadata:
 *           type: object
 *           description: 资源元数据
 *     CommitRequest:
 *       type: object
 *       required: [message]
 *       properties:
 *         message:
 *           type: string
 *           description: 提交消息
 *           example: "添加新的项目文档"
 *         files:
 *           type: array
 *           items:
 *             type: string
 *           description: 要提交的文件列表(可选，留空则提交所有更改)
 *     GitStatus:
 *       type: object
 *       properties:
 *         isGitRepo:
 *           type: boolean
 *           description: 是否为Git仓库
 *         currentBranch:
 *           type: string
 *           description: 当前分支
 *         hasChanges:
 *           type: boolean
 *           description: 是否有未提交更改
 *         staged:
 *           type: array
 *           items:
 *             type: string
 *           description: 已暂存文件列表
 *         modified:
 *           type: array
 *           items:
 *             type: string
 *           description: 已修改文件列表
 *         untracked:
 *           type: array
 *           items:
 *             type: string
 *           description: 未跟踪文件列表
 */

import { Router } from 'express';
import { RepositoryController } from './RepositoryController.js';

export function createRepositoryRoutes(): Router {
  const router = Router();

  // ============ 仓储管理路由 ============

  /**
   * @swagger
   * /repositories:
   *   post:
   *     tags: [Repositories]
   *     summary: 创建仓储
   *     description: 创建一个新的仓储，用于管理文档和资源
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateRepositoryRequest'
   *     responses:
   *       201:
   *         description: 仓储创建成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Repository'
   *       400:
   *         description: 请求参数错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: 未授权
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: 仓储已存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post('/', async (req, res) => {
    await RepositoryController.createRepository(req, res);
  });

  /**
   * @swagger
   * /repositories:
   *   get:
   *     tags: [Repositories]
   *     summary: 获取仓储列表
   *     description: 获取当前用户的仓储列表，支持分页和过滤
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
   *           default: 20
   *         description: 每页数量
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [local, remote, synchronized]
   *         description: 过滤仓储类型
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, inactive, archived, syncing]
   *         description: 过滤仓储状态
   *       - in: query
   *         name: keyword
   *         schema:
   *           type: string
   *         description: 搜索关键词（匹配名称和描述）
   *     responses:
   *       200:
   *         description: 仓储列表获取成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/PaginatedResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: object
   *                       properties:
   *                         items:
   *                           type: array
   *                           items:
   *                             $ref: '#/components/schemas/Repository'
   *       401:
   *         description: 未授权
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get('/', async (req, res) => {
    await RepositoryController.getRepositories(req, res);
  });

  /**
   * @swagger
   * /repositories/{uuid}:
   *   get:
   *     tags: [Repositories]
   *     summary: 根据ID获取仓储
   *     description: 根据UUID获取特定仓储的详细信息
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: uuid
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 仓储UUID
   *     responses:
   *       200:
   *         description: 仓储信息获取成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Repository'
   *       404:
   *         description: 仓储不存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: 未授权
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: 无权限访问
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get('/:uuid', async (req, res) => {
    await RepositoryController.getRepositoryById(req, res);
  });

  /**
   * @swagger
   * /repositories/{uuid}:
   *   put:
   *     tags: [Repositories]
   *     summary: 更新仓储
   *     description: 更新指定仓储的信息和配置
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: uuid
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 仓储UUID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateRepositoryRequest'
   *     responses:
   *       200:
   *         description: 仓储更新成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Repository'
   *       400:
   *         description: 请求参数错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: 仓储不存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: 未授权
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: 无权限修改
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.put('/:uuid', async (req, res) => {
    await RepositoryController.updateRepository(req, res);
  });

  /**
   * @swagger
   * /repositories/{uuid}:
   *   delete:
   *     tags: [Repositories]
   *     summary: 删除仓储
   *     description: 删除指定的仓储（软删除或硬删除）
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: uuid
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 仓储UUID
   *       - in: query
   *         name: force
   *         schema:
   *           type: boolean
   *           default: false
   *         description: 是否强制删除（硬删除）
   *     responses:
   *       200:
   *         description: 仓储删除成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       404:
   *         description: 仓储不存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: 未授权
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: 无权限删除
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: 仓储有关联资源，无法删除
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.delete('/:uuid', async (req, res) => {
    await RepositoryController.deleteRepository(req, res);
  });

  /**
   * @swagger
   * /repositories/{uuid}/activate:
   *   post:
   *     tags: [Repositories]
   *     summary: 激活仓储
   *     description: 激活指定的仓储，使其状态变为活跃
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: uuid
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 仓储UUID
   *     responses:
   *       200:
   *         description: 仓储激活成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Repository'
   *       404:
   *         description: 仓储不存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: 未授权
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
   *       409:
   *         description: 仓储状态不允许激活
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post('/:uuid/activate', async (req, res) => {
    await RepositoryController.activateRepository(req, res);
  });

  /**
   * @swagger
   * /repositories/{uuid}/archive:
   *   post:
   *     tags: [Repositories]
   *     summary: 归档仓储
   *     description: 归档指定的仓储，使其状态变为归档
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: uuid
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 仓储UUID
   *     responses:
   *       200:
   *         description: 仓储归档成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Repository'
   *       404:
   *         description: 仓储不存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: 未授权
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
   *       409:
   *         description: 仓储状态不允许归档
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post('/:uuid/archive', async (req, res) => {
    await RepositoryController.archiveRepository(req, res);
  });

  // ============ Git 操作路由 ============

  /**
   * @swagger
   * /repositories/{uuid}/git/status:
   *   get:
   *     tags: [Repository Git]
   *     summary: 获取Git状态
   *     description: 获取指定仓储的Git状态信息，包括分支、更改文件等
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: uuid
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 仓储UUID
   *     responses:
   *       200:
   *         description: Git状态获取成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/GitStatus'
   *       404:
   *         description: 仓储不存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: 未授权
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: 无权限访问
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       400:
   *         description: 仓储未Git初始化
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get('/:uuid/git/status', async (req, res) => {
    await RepositoryController.getGitStatus(req, res);
  });

  /**
   * @swagger
   * /repositories/{uuid}/git/commit:
   *   post:
   *     tags: [Repository Git]
   *     summary: Git提交
   *     description: 对指定仓储执行Git提交操作
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: uuid
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 仓储UUID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CommitRequest'
   *     responses:
   *       200:
   *         description: 提交成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: object
   *                       properties:
   *                         commitHash:
   *                           type: string
   *                           description: 提交哈希值
   *                         message:
   *                           type: string
   *                           description: 提交消息
   *                         files:
   *                           type: array
   *                           items:
   *                             type: string
   *                           description: 已提交文件列表
   *                         timestamp:
   *                           type: string
   *                           format: date-time
   *                           description: 提交时间
   *       400:
   *         description: 请求参数错误或没有可提交的更改
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: 仓储不存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: 未授权
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
  router.post('/:uuid/git/commit', async (req, res) => {
    await RepositoryController.commitChanges(req, res);
  });

  // ============ 资源管理路由 ============

  /**
   * @swagger
   * /repositories/{repositoryUuid}/resources:
   *   get:
   *     tags: [Repository Resources]
   *     summary: 获取仓储资源
   *     description: 获取指定仓储下的所有资源，支持分页和过滤
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: repositoryUuid
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 仓储UUID
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
   *           default: 20
   *         description: 每页数量
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [markdown, image, video, audio, pdf, link, code, other]
   *         description: 过滤资源类型
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, archived, deleted, draft]
   *         description: 过滤资源状态
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *         description: 过滤资源分类
   *       - in: query
   *         name: tags
   *         schema:
   *           type: string
   *         description: 过滤标签（逗号分隔）
   *       - in: query
   *         name: keyword
   *         schema:
   *           type: string
   *         description: 搜索关键词（匹配名称和描述）
   *     responses:
   *       200:
   *         description: 资源列表获取成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/PaginatedResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: object
   *                       properties:
   *                         items:
   *                           type: array
   *                           items:
   *                             $ref: '#/components/schemas/Resource'
   *       404:
   *         description: 仓储不存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: 未授权
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: 无权限访问
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get('/:repositoryUuid/resources', async (req, res) => {
    await RepositoryController.getResources(req, res);
  });

  /**
   * @swagger
   * /repositories/{repositoryUuid}/resources:
   *   post:
   *     tags: [Repository Resources]
   *     summary: 创建资源
   *     description: 在指定仓储中创建新的资源
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: repositoryUuid
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 仓储UUID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateResourceRequest'
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *                 description: 上传的文件
   *               name:
   *                 type: string
   *                 description: 资源名称
   *               description:
   *                 type: string
   *                 description: 资源描述
   *               tags:
   *                 type: string
   *                 description: 标签（逗号分隔）
   *               category:
   *                 type: string
   *                 description: 分类
   *     responses:
   *       201:
   *         description: 资源创建成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Resource'
   *       400:
   *         description: 请求参数错误或文件上传失败
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: 仓储不存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: 未授权
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: 无权限创建
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       413:
   *         description: 文件过大
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post('/:repositoryUuid/resources', async (req, res) => {
    await RepositoryController.createResource(req, res);
  });

  /**
   * @swagger
   * /repositories/{repositoryUuid}/resources/{resourceUuid}:
   *   put:
   *     tags: [Repository Resources]
   *     summary: 更新资源
   *     description: 更新指定资源的信息和元数据
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: repositoryUuid
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 仓储UUID
   *       - in: path
   *         name: resourceUuid
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 资源UUID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: 资源名称
   *               description:
   *                 type: string
   *                 description: 资源描述
   *               author:
   *                 type: string
   *                 description: 作者
   *               version:
   *                 type: string
   *                 description: 版本
   *               tags:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: 标签列表
   *               category:
   *                 type: string
   *                 description: 分类
   *               status:
   *                 type: string
   *                 enum: [active, archived, deleted, draft]
   *                 description: 资源状态
   *               metadata:
   *                 type: object
   *                 description: 资源元数据
   *     responses:
   *       200:
   *         description: 资源更新成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Resource'
   *       400:
   *         description: 请求参数错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: 仓储或资源不存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: 未授权
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: 无权限修改
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.put('/:repositoryUuid/resources/:resourceUuid', async (req, res) => {
    await RepositoryController.updateResource(req, res);
  });

  /**
   * @swagger
   * /repositories/{repositoryUuid}/resources/{resourceUuid}:
   *   delete:
   *     tags: [Repository Resources]
   *     summary: 删除资源
   *     description: 删除指定的资源（软删除或硬删除）
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: repositoryUuid
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 仓储UUID
   *       - in: path
   *         name: resourceUuid
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 资源UUID
   *       - in: query
   *         name: force
   *         schema:
   *           type: boolean
   *           default: false
   *         description: 是否强制删除（硬删除）
   *       - in: query
   *         name: deleteFile
   *         schema:
   *           type: boolean
   *           default: false
   *         description: 是否同时删除物理文件
   *     responses:
   *       200:
   *         description: 资源删除成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       404:
   *         description: 仓储或资源不存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: 未授权
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: 无权限删除
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: 资源有关联依赖，无法删除
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.delete('/:repositoryUuid/resources/:resourceUuid', async (req, res) => {
    await RepositoryController.deleteResource(req, res);
  });

  return router;
}
