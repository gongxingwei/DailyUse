/**
 * UserSetting Routes
 * 用户设置路由
 */

import { Router } from 'express';
import { UserSettingController } from '../controllers/UserSettingController';

const router = Router();

/**
 * @swagger
 * /user-settings:
 *   post:
 *     summary: 创建用户设置
 *     tags: [UserSettings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountUuid
 *             properties:
 *               accountUuid:
 *                 type: string
 *               appearance:
 *                 type: object
 *               locale:
 *                 type: object
 *               workflow:
 *                 type: object
 *               shortcuts:
 *                 type: object
 *               privacy:
 *                 type: object
 *               experimental:
 *                 type: object
 *     responses:
 *       201:
 *         description: 用户设置创建成功
 *       400:
 *         description: 请求参数错误
 */
router.post('/', UserSettingController.createUserSetting);

/**
 * @swagger
 * /user-settings/get-or-create:
 *   post:
 *     summary: 获取或创建用户设置
 *     tags: [UserSettings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountUuid
 *             properties:
 *               accountUuid:
 *                 type: string
 *     responses:
 *       200:
 *         description: 成功获取或创建用户设置
 *       400:
 *         description: 请求参数错误
 */
router.post('/get-or-create', UserSettingController.getOrCreateUserSetting);

/**
 * @swagger
 * /user-settings/{uuid}:
 *   get:
 *     summary: 获取用户设置详情
 *     tags: [UserSettings]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户设置UUID
 *     responses:
 *       200:
 *         description: 成功获取用户设置
 *       404:
 *         description: 用户设置不存在
 */
router.get('/:uuid', UserSettingController.getUserSetting);

/**
 * @swagger
 * /user-settings/account/{accountUuid}:
 *   get:
 *     summary: 根据账户获取用户设置
 *     tags: [UserSettings]
 *     parameters:
 *       - in: path
 *         name: accountUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户UUID
 *     responses:
 *       200:
 *         description: 成功获取用户设置
 *       404:
 *         description: 用户设置不存在
 */
router.get('/account/:accountUuid', UserSettingController.getUserSettingByAccount);

/**
 * @swagger
 * /user-settings/{uuid}:
 *   put:
 *     summary: 更新用户设置
 *     tags: [UserSettings]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户设置UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               appearance:
 *                 type: object
 *               locale:
 *                 type: object
 *               workflow:
 *                 type: object
 *               shortcuts:
 *                 type: object
 *               privacy:
 *                 type: object
 *               experimental:
 *                 type: object
 *     responses:
 *       200:
 *         description: 用户设置更新成功
 *       404:
 *         description: 用户设置不存在
 */
router.put('/:uuid', UserSettingController.updateUserSetting);

/**
 * @swagger
 * /user-settings/{uuid}/appearance:
 *   patch:
 *     summary: 更新外观设置
 *     tags: [UserSettings]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户设置UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theme:
 *                 type: string
 *                 enum: [LIGHT, DARK, AUTO]
 *               accentColor:
 *                 type: string
 *               fontSize:
 *                 type: string
 *                 enum: [SMALL, MEDIUM, LARGE]
 *               fontFamily:
 *                 type: string
 *               compactMode:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 外观设置更新成功
 *       404:
 *         description: 用户设置不存在
 */
router.patch('/:uuid/appearance', UserSettingController.updateAppearance);

/**
 * @swagger
 * /user-settings/{uuid}/locale:
 *   patch:
 *     summary: 更新语言区域设置
 *     tags: [UserSettings]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户设置UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:
 *                 type: string
 *               timezone:
 *                 type: string
 *               dateFormat:
 *                 type: string
 *               timeFormat:
 *                 type: string
 *               weekStartsOn:
 *                 type: integer
 *               currency:
 *                 type: string
 *     responses:
 *       200:
 *         description: 语言区域设置更新成功
 *       404:
 *         description: 用户设置不存在
 */
router.patch('/:uuid/locale', UserSettingController.updateLocale);

/**
 * @swagger
 * /user-settings/{uuid}/theme:
 *   patch:
 *     summary: 更新主题
 *     tags: [UserSettings]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户设置UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - theme
 *             properties:
 *               theme:
 *                 type: string
 *                 enum: [LIGHT, DARK, AUTO]
 *     responses:
 *       200:
 *         description: 主题更新成功
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 用户设置不存在
 */
router.patch('/:uuid/theme', UserSettingController.updateTheme);

/**
 * @swagger
 * /user-settings/{uuid}/language:
 *   patch:
 *     summary: 更新语言
 *     tags: [UserSettings]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户设置UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - language
 *             properties:
 *               language:
 *                 type: string
 *     responses:
 *       200:
 *         description: 语言更新成功
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 用户设置不存在
 */
router.patch('/:uuid/language', UserSettingController.updateLanguage);

/**
 * @swagger
 * /user-settings/{uuid}/shortcuts/{action}:
 *   patch:
 *     summary: 更新快捷键
 *     tags: [UserSettings]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户设置UUID
 *       - in: path
 *         name: action
 *         required: true
 *         schema:
 *           type: string
 *         description: 快捷键动作
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shortcut
 *             properties:
 *               shortcut:
 *                 type: string
 *     responses:
 *       200:
 *         description: 快捷键更新成功
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 用户设置不存在
 *   delete:
 *     summary: 删除快捷键
 *     tags: [UserSettings]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户设置UUID
 *       - in: path
 *         name: action
 *         required: true
 *         schema:
 *           type: string
 *         description: 快捷键动作
 *     responses:
 *       200:
 *         description: 快捷键删除成功
 *       404:
 *         description: 用户设置不存在
 */
router.patch('/:uuid/shortcuts/:action', UserSettingController.updateShortcut);
router.delete('/:uuid/shortcuts/:action', UserSettingController.removeShortcut);

/**
 * @swagger
 * /user-settings/{uuid}:
 *   delete:
 *     summary: 删除用户设置
 *     tags: [UserSettings]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户设置UUID
 *     responses:
 *       200:
 *         description: 用户设置删除成功
 *       404:
 *         description: 用户设置不存在
 */
router.delete('/:uuid', UserSettingController.deleteUserSetting);

export default router;
